/**
 * Supabase implementation of PipelineStore. Server only: pass a client built with the service role key.
 *
 * Needs the Phase 6 migration (lib/ai/sql/phase6-migration.sql): the extra status values, the columns
 * retry_count, last_error, last_error_code, next_retry_at, status_changed_at, and the claim_evaluation()
 * function. The status column is `ai_status` unless EVALUATIONS_STATUS_COLUMN says otherwise (for example
 * if Member 2 renames it to processing_status).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIError, withRetry } from "./errors";
import { CRITERION_COLUMNS, evaluationRowFromResult } from "./evaluation";
import type {
  ClaimResult,
  CompletedUpdate,
  FailureUpdate,
  PipelineStore,
  ResponseContext,
} from "./run-pipeline";
import { MAX_ATTEMPTS, STALE_AFTER_MS } from "./run-pipeline";
import type { AudioFetcher } from "./storage";
import type { TranscribeOutput } from "./transcribe";

export interface SupabaseStoreOptions {
  /** Default: env EVALUATIONS_STATUS_COLUMN or "ai_status". */
  statusColumn?: string;
  /** Default: env QUESTIONS_TABLE or "questions". */
  questionsTable?: string;
  /** Default: env QUESTION_TEXT_COLUMN, otherwise detected from common names. */
  questionTextColumn?: string;
}

const QUESTION_TEXT_CANDIDATES = ["question_text", "text", "question", "prompt", "title", "content"];

type DbResult = { error: { message: string; code?: string } | null; status?: number };

/** Run a write, turning a Supabase { error } into a thrown error that carries the HTTP status, with retries for temporary ones. */
async function write(label: string, op: () => PromiseLike<DbResult>): Promise<void> {
  await withRetry(
    async () => {
      const { error, status } = await op();
      if (error) {
        throw Object.assign(new Error(`${label}: ${error.message}`), { status, code: error.code });
      }
    },
    { stage: "scoring" },
  );
}

const CLEARED_RESULTS = {
  ...Object.fromEntries(CRITERION_COLUMNS.map((c) => [c, null])),
  ai_overall_score: null,
  ai_evidence: null,
};

export function createSupabaseStore(client: SupabaseClient, options: SupabaseStoreOptions = {}): PipelineStore {
  const statusColumn = options.statusColumn ?? process.env.EVALUATIONS_STATUS_COLUMN ?? "ai_status";
  const questionsTable = options.questionsTable ?? process.env.QUESTIONS_TABLE ?? "questions";
  const configuredTextColumn = options.questionTextColumn ?? process.env.QUESTION_TEXT_COLUMN;
  const nowIso = () => new Date().toISOString();

  const update = (label: string, responseId: string, values: Record<string, unknown>) =>
    write(label, () =>
      client
        .from("evaluations")
        .update({ ...values, status_changed_at: nowIso() })
        .eq("response_id", responseId),
    );

  async function questionText(questionId: number | string): Promise<string> {
    const { data, error } = await client.from(questionsTable).select("*").eq("id", questionId).maybeSingle();
    if (error) throw Object.assign(new Error(`Could not read ${questionsTable}: ${error.message}`), { status: 500 });
    if (!data) throw new AIError(`No question with id ${questionId} in ${questionsTable}`, "BAD_INPUT", "config", false);

    const row = data as Record<string, unknown>;
    const column =
      configuredTextColumn ?? QUESTION_TEXT_CANDIDATES.find((c) => typeof row[c] === "string" && (row[c] as string).trim());
    const value = column ? row[column] : undefined;
    if (typeof value !== "string" || !value.trim()) {
      throw new AIError(
        `Cannot find the question text in ${questionsTable} (columns: ${Object.keys(row).join(", ")}). Set QUESTION_TEXT_COLUMN.`,
        "BAD_INPUT",
        "config",
        false,
      );
    }
    return value.trim();
  }

  return {
    async claim(responseId, { trigger, retranscribe, staleAfterMs }): Promise<ClaimResult> {
      const { data, error } = await client.rpc("claim_evaluation", {
        p_response_id: responseId,
        p_admin: trigger === "admin",
        p_retranscribe: retranscribe,
        p_stale_seconds: Math.round(staleAfterMs / 1000),
      });
      if (error) throw Object.assign(new Error(`claim_evaluation failed: ${error.message}`), { code: error.code });

      const claimed = Array.isArray(data) ? data[0] : data;
      if (claimed) {
        return { claimed: true, transcript: claimed.out_transcript ?? null, retryCount: claimed.out_retry_count ?? 0 };
      }

      // Not claimed: say why, so callers can tell "already running" from "nothing to do".
      const { data: current } = await client
        .from("evaluations")
        .select(`${statusColumn}`)
        .eq("response_id", responseId)
        .maybeSingle();
      if (!current) return { claimed: false, reason: "not_found" };
      const status = (current as unknown as Record<string, string>)[statusColumn];
      if (status === "completed") return { claimed: false, reason: "already_completed" };
      if (status === "transcribing" || status === "scoring") return { claimed: false, reason: "already_running" };
      if (status === "failed_retryable") return { claimed: false, reason: "not_due" };
      return { claimed: false, reason: "not_claimable" };
    },

    async loadContext(responseId, claimed): Promise<ResponseContext> {
      // evaluations.response_id is student_responses.id
      const { data, error } = await client
        .from("student_responses")
        .select("id, question_id, duration_seconds, video_storage_path, audio_storage_path")
        .eq("id", responseId)
        .maybeSingle();
      if (error) throw Object.assign(new Error(`Could not read student_responses: ${error.message}`), { status: 500 });
      if (!data) throw new AIError(`No student_responses row ${responseId}`, "BAD_INPUT", "config", false);

      const storagePath = data.audio_storage_path || data.video_storage_path;
      if (!storagePath) throw new AIError("The response has no recording path", "BAD_INPUT", "config", false);
      if (data.question_id === null || data.question_id === undefined) {
        throw new AIError("The response has no question_id", "BAD_INPUT", "config", false);
      }

      return {
        responseId,
        question: await questionText(data.question_id),
        storagePath,
        durationSeconds: data.duration_seconds ?? undefined,
        transcript: claimed.transcript?.trim() || undefined,
        retryCount: claimed.retryCount,
      };
    },

    markTranscribed: (responseId: string, transcription: TranscribeOutput) =>
      update("save transcript", responseId, { transcript: transcription.text, [statusColumn]: "transcribed" }),

    markScoring: (responseId: string) =>
      update("start scoring", responseId, { [statusColumn]: "scoring", ...CLEARED_RESULTS }),

    markCompleted(responseId: string, { transcript, result, meta }: CompletedUpdate) {
      const { response_id: _id, ai_status, ...columns } = evaluationRowFromResult(responseId, transcript, result, meta);
      return update("save result", responseId, {
        ...columns,
        [statusColumn]: ai_status,
        last_error: null,
        last_error_code: null,
        next_retry_at: null,
      });
    },

    markFailed(responseId: string, failure: FailureUpdate) {
      const detail = `${failure.reason ?? failure.error.code}: ${failure.error.message}`;
      return update("save failure", responseId, {
        [statusColumn]: failure.status,
        retry_count: failure.retryCount,
        last_error: detail,
        last_error_code: failure.error.code,
        error_message: detail,
        next_retry_at: failure.nextRetryAt,
        ...CLEARED_RESULTS,
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers for triggering and sweeping (Phase 7)
// ---------------------------------------------------------------------------

/**
 * Make sure the response has an evaluations row (status `queued`). Safe to call repeatedly: an existing row
 * is left alone, so a webhook, the submit handler and the sweeper can all call it.
 */
export async function ensureEvaluationRow(
  client: SupabaseClient,
  responseId: string,
  options: { statusColumn?: string } = {},
): Promise<void> {
  const statusColumn = options.statusColumn ?? process.env.EVALUATIONS_STATUS_COLUMN ?? "ai_status";
  await write("create evaluation row", () =>
    client
      .from("evaluations")
      .upsert({ response_id: responseId, [statusColumn]: "queued" }, { onConflict: "response_id", ignoreDuplicates: true }),
  );
}

/** Responses that need a run now: queued, transcribed, retries that are due, and runs that look crashed. */
export async function findDueResponses(
  client: SupabaseClient,
  limit: number,
  options: { now?: Date; staleAfterMs?: number; statusColumn?: string } = {},
): Promise<string[]> {
  const statusColumn = options.statusColumn ?? process.env.EVALUATIONS_STATUS_COLUMN ?? "ai_status";
  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const staleIso = new Date(now.getTime() - (options.staleAfterMs ?? STALE_AFTER_MS)).toISOString();

  const { data, error } = await client
    .from("evaluations")
    .select("response_id")
    .or(
      [
        `${statusColumn}.in.(queued,transcribed)`,
        `and(${statusColumn}.eq.failed_retryable,next_retry_at.lte.${nowIso},retry_count.lt.${MAX_ATTEMPTS})`,
        `and(${statusColumn}.in.(transcribing,scoring),status_changed_at.lt.${staleIso})`,
      ].join(","),
    )
    .order("status_changed_at", { ascending: true })
    .limit(limit);

  if (error) throw Object.assign(new Error(`Could not find due responses: ${error.message}`), { status: 500 });
  return (data ?? []).map((row) => (row as { response_id: string }).response_id);
}

/** Download helper for the private bucket (service role client). Throws errors that carry the HTTP status. */
export function createAudioFetcher(client: SupabaseClient, bucket = "interview-recordings"): AudioFetcher {
  return async (storagePath) => {
    const { data, error } = await client.storage.from(bucket).download(storagePath);
    if (error || !data) {
      const e = error as { statusCode?: string | number; status?: number; message?: string } | null;
      throw Object.assign(new Error(`Could not download ${storagePath}: ${e?.message ?? "no data"}`), {
        status: e?.statusCode ?? e?.status,
      });
    }
    return { data: new Uint8Array(await data.arrayBuffer()) };
  };
}
