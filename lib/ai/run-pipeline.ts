/**
 * runPipeline(responseId): the resumable, two-stage processing of one response.
 *
 *   claim -> [transcription stage] -> [scoring stage] -> completed
 *
 * - Stages are separate: if a transcript is already saved, transcription is skipped, so a scoring
 *   failure never costs a second Groq call. `retranscribe` forces it (e.g. after the audio was fixed).
 * - Every transition writes the status, retry_count and last_error through the store.
 * - Idempotent: the claim is atomic (a second runner is turned away), and results overwrite the single
 *   row for the response, so re-running never creates duplicates.
 * - Never throws. The caller (submit handler, sweeper, admin button) gets a result object.
 *
 * The store is an interface so the logic is testable without a database. The Supabase version is in
 * supabase-store.ts.
 */
import { AIError, classifyError, statusForError, type AIErrorCode, type AIStage } from "./errors";
import type { ScoreInput } from "./score";
import type { AudioFetcher } from "./storage";
import type { TranscribeFromStorageOptions, TranscribeOutput } from "./transcribe";
import type { ScoringResult } from "./validate";

/** Total pipeline runs allowed for temporary errors (the first run plus retries). */
export const MAX_ATTEMPTS = 3;
/** Wait before the next run, after the 1st and 2nd temporary failure. Long waits happen between runs, not inside one. */
export const RETRY_SCHEDULE_MS = [30_000, 120_000] as const;
/** A response left in transcribing/scoring longer than this is assumed to have crashed and may be claimed again. */
export const STALE_AFTER_MS = 10 * 60 * 1000;
/** Time that must remain before the deadline for the scoring stage to be started in the same run. */
export const SCORING_RESERVE_MS = 20_000;

export type ProcessingStatus =
  | "queued"
  | "transcribing"
  | "transcribed"
  | "scoring"
  | "completed"
  | "needs_manual_review"
  | "failed_retryable"
  | "failed";

export type PipelineStage = "transcription" | "scoring";
export type Trigger = "auto" | "admin";

export interface ResponseContext {
  responseId: string;
  question: string;
  /** Recording in the private bucket (audio path if there is one, else the video path). */
  storagePath: string;
  durationSeconds?: number;
  /** Already-saved transcript, if the transcription stage finished earlier. */
  transcript?: string;
  retryCount: number;
}

export type ClaimResult =
  | { claimed: true; transcript: string | null; retryCount: number }
  | {
      claimed: false;
      reason: "not_found" | "already_completed" | "already_running" | "not_due" | "not_claimable";
    };

export interface FailureUpdate {
  status: Extract<ProcessingStatus, "failed_retryable" | "failed" | "needs_manual_review">;
  reason?: string;
  error: { code: AIErrorCode; message: string };
  retryCount: number;
  nextRetryAt: string | null;
}

export interface CompletedUpdate {
  transcript: string;
  result: ScoringResult;
  meta: { scoringModel: string; transcriptionModel?: string; durationSeconds?: number };
}

/** Storage for pipeline state. Every method must THROW if the write fails. */
export interface PipelineStore {
  /**
   * Atomically move the response into transcribing (or scoring, when a transcript is already saved and
   * `retranscribe` is false). Must claim only if the status allows it:
   *   auto:  queued, transcribed, failed_retryable once next_retry_at has passed, or a stale transcribing/scoring
   *   admin: anything that is not actively running (also resets retry_count to 0)
   */
  claim(
    responseId: string,
    options: { trigger: Trigger; retranscribe: boolean; staleAfterMs: number },
  ): Promise<ClaimResult>;
  /** Read the response, its question and its recording path. Throw AIError BAD_INPUT if they do not exist. */
  loadContext(responseId: string, claimed: { transcript: string | null; retryCount: number }): Promise<ResponseContext>;
  /** Save the transcript (overwriting) and set status `transcribed`. */
  markTranscribed(responseId: string, transcription: TranscribeOutput): Promise<void>;
  /** Set status `scoring` and clear old scores, so stale scores never sit next to a new run. */
  markScoring(responseId: string): Promise<void>;
  /** Save scores and evidence and set status `completed`; clears last_error and next_retry_at. */
  markCompleted(responseId: string, update: CompletedUpdate): Promise<void>;
  /** Set the failure status with retry_count, last_error and next_retry_at. Keeps the transcript. */
  markFailed(responseId: string, update: FailureUpdate): Promise<void>;
}

export interface RunPipelineDeps {
  store: PipelineStore;
  /** Member 2's download helper for the private bucket; must throw on failure. */
  fetchAudio: AudioFetcher;
  /** "auto" for submit handlers and the sweeper (default), "admin" for the Retry button. */
  trigger?: Trigger;
  /** Transcribe again even if a transcript is saved. */
  retranscribe?: boolean;
  language?: string;
  prompt?: string;
  now?: () => Date;
  /**
   * Epoch ms by which the host will cut this run off (serverless time limit). If scoring could not finish
   * before it, the run stops right after transcription with status `transcribed`; the next run only scores.
   */
  deadline?: number;
  /** Time kept free for the scoring stage when checking the deadline. Default 20 s. */
  scoringReserveMs?: number;
  /** Override STALE_AFTER_MS. Set it to about twice your function's time limit. */
  staleAfterMs?: number;
  /** Test doubles. Default to the real Groq and Gemini calls. */
  transcribe?: (storagePath: string, options: TranscribeFromStorageOptions) => Promise<TranscribeOutput>;
  score?: (input: ScoreInput) => Promise<{ result: ScoringResult; model: string }>;
}

export type RunPipelineResult =
  | { outcome: "completed"; status: "completed"; stagesRun: PipelineStage[] }
  | { outcome: "deferred"; status: "transcribed"; stagesRun: PipelineStage[]; reason: "time_budget" }
  | {
      outcome: "skipped";
      reason: Extract<ClaimResult, { claimed: false }>["reason"];
    }
  | {
      outcome: "failed";
      status: FailureUpdate["status"];
      reason?: string;
      error: { code: AIErrorCode; message: string; retryable: boolean };
      failedStage: AIStage;
      stagesRun: PipelineStage[];
      retryCount: number;
      nextRetryAt: string | null;
      /** False if the failure itself could not be written; the sweeper will find the stale row later. */
      statusPersisted: boolean;
    };

/** Pure decision: where does a failed run go, and when is the next attempt? */
export function planFailure(
  error: AIError,
  retryCount: number,
  now: Date,
): Pick<FailureUpdate, "status" | "reason" | "retryCount" | "nextRetryAt"> {
  const { status, reason } = statusForError(error);

  if (status === "failed_retryable") {
    const newCount = retryCount + 1;
    if (newCount >= MAX_ATTEMPTS) {
      return { status: "failed", reason: "retries_exhausted", retryCount: MAX_ATTEMPTS, nextRetryAt: null };
    }
    const delay = RETRY_SCHEDULE_MS[Math.min(newCount - 1, RETRY_SCHEDULE_MS.length - 1)];
    return { status: "failed_retryable", reason, retryCount: newCount, nextRetryAt: new Date(now.getTime() + delay).toISOString() };
  }
  if (status === "needs_manual_review") {
    return { status: "needs_manual_review", reason, retryCount, nextRetryAt: null };
  }
  return { status: "failed", reason, retryCount, nextRetryAt: null };
}

export async function runPipeline(responseId: string, deps: RunPipelineDeps): Promise<RunPipelineResult> {
  const { store } = deps;
  const now = deps.now ?? (() => new Date());
  const stagesRun: PipelineStage[] = [];
  let stage: AIStage = "transcription";
  let retryCount = 0;

  // 1. Claim. Nothing has changed yet if this fails or is refused.
  let claim: ClaimResult;
  try {
    claim = await store.claim(responseId, {
      trigger: deps.trigger ?? "auto",
      retranscribe: deps.retranscribe ?? false,
      staleAfterMs: deps.staleAfterMs ?? STALE_AFTER_MS,
    });
  } catch (err) {
    const error = classifyError(err, "config");
    return {
      outcome: "failed",
      status: "failed",
      reason: "claim_failed",
      error: { code: error.code, message: error.message, retryable: error.retryable },
      failedStage: error.stage,
      stagesRun,
      retryCount,
      nextRetryAt: null,
      statusPersisted: false,
    };
  }
  if (!claim.claimed) return { outcome: "skipped", reason: claim.reason };
  retryCount = claim.retryCount;

  try {
    const context = await store.loadContext(responseId, { transcript: claim.transcript, retryCount: claim.retryCount });
    let transcript = deps.retranscribe ? undefined : context.transcript?.trim() || undefined;
    let lowConfidenceSpans: string[] | undefined;
    let transcriptionModel: string | undefined;
    let durationSeconds = context.durationSeconds;

    // 2. Transcription stage: skipped when a transcript is already saved.
    if (!transcript) {
      stage = "transcription";
      const transcribe = deps.transcribe ?? (await import("./transcribe")).transcribeFromStorage;
      const transcription = await transcribe(context.storagePath, {
        fetchAudio: deps.fetchAudio,
        language: deps.language,
        prompt: deps.prompt,
      });
      await store.markTranscribed(responseId, transcription);
      stagesRun.push("transcription");

      transcript = transcription.text;
      transcriptionModel = transcription.model;
      durationSeconds = durationSeconds ?? transcription.durationSeconds;
      lowConfidenceSpans = transcription.segments
        .filter((s) => s.avgLogprob !== undefined && s.avgLogprob < -1)
        .map((s) => s.text);
    }

    // Out of time right after transcribing: stop cleanly (status is `transcribed`, the transcript is saved),
    // so the next run only has to score. Not done when scoring was the only stage, because the claim has
    // already set the status to `scoring`.
    if (
      deps.deadline !== undefined &&
      stagesRun.includes("transcription") &&
      now().getTime() + (deps.scoringReserveMs ?? SCORING_RESERVE_MS) > deps.deadline
    ) {
      return { outcome: "deferred", status: "transcribed", stagesRun, reason: "time_budget" };
    }

    // 3. Scoring stage
    stage = "scoring";
    await store.markScoring(responseId);
    const score = deps.score ?? (await import("./score")).scoreTranscript;
    const scored = await score({ question: context.question, transcript, durationSeconds, lowConfidenceSpans });
    await store.markCompleted(responseId, {
      transcript,
      result: scored.result,
      meta: { scoringModel: scored.model, transcriptionModel, durationSeconds },
    });
    stagesRun.push("scoring");

    return { outcome: "completed", status: "completed", stagesRun };
  } catch (err) {
    // 4. Any failure: record status, retry_count, last_error and next_retry_at. The transcript is kept.
    const error = classifyError(err, stage);
    const plan = planFailure(error, retryCount, now());

    let statusPersisted = true;
    try {
      await store.markFailed(responseId, {
        status: plan.status,
        reason: plan.reason,
        error: { code: error.code, message: error.message },
        retryCount: plan.retryCount,
        nextRetryAt: plan.nextRetryAt,
      });
    } catch {
      statusPersisted = false;
    }

    return {
      outcome: "failed",
      status: plan.status,
      reason: plan.reason,
      error: { code: error.code, message: error.message, retryable: error.retryable },
      failedStage: error.stage,
      stagesRun,
      retryCount: plan.retryCount,
      nextRetryAt: plan.nextRetryAt,
      statusPersisted,
    };
  }
}
