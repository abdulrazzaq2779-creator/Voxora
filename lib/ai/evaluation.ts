/**
 * Maps AI results onto Member 2's `evaluations` table and saves them.
 *
 * Columns: response_id (unique), transcript, ai_status, criterion_1..4_score (numeric),
 * ai_overall_score (numeric), ai_evidence (jsonb), error_message. created_at/updated_at are
 * left to the database defaults.
 *
 * The AI module does not import Supabase. Member 2's server code passes a client built with
 * the service role key; it only needs `from(table).upsert(row, { onConflict })`.
 */
import { AIError, classifyError, withRetry } from "./errors";
import { CRITERION_IDS, type CriterionId } from "./rubric";
import type { PipelineResult } from "./pipeline";
import type { ScoringResult } from "./validate";

/**
 * Which criterion goes in which column, in order. AGREE THIS WITH MEMBER 2 and keep their
 * column comments / dashboard labels in sync: criterion_1 = relevance, 2 = structure,
 * 3 = clarity, 4 = depth. The order is the order of CRITERION_IDS in rubric.ts.
 */
export const CRITERION_COLUMNS = [
  "criterion_1_score",
  "criterion_2_score",
  "criterion_3_score",
  "criterion_4_score",
] as const satisfies readonly string[];

export type CriterionColumn = (typeof CRITERION_COLUMNS)[number];

/** Statuses the pipeline produces. The table's enum decides which ones can be stored. */
export type PipelineStatus =
  | "completed"
  | "processing"
  | "needs_manual_review"
  | "failed_retryable"
  | "failed";

export interface EvaluationRow {
  response_id: string;
  transcript: string | null;
  ai_status: PipelineStatus;
  criterion_1_score: number | null;
  criterion_2_score: number | null;
  criterion_3_score: number | null;
  criterion_4_score: number | null;
  ai_overall_score: number | null;
  ai_evidence: Record<string, unknown> | null;
  error_message: string | null;
}

export interface RowOptions {
  /**
   * false (default): the table's enum only has 'completed' and 'failed'. needs_manual_review and
   * failed_retryable are stored as 'failed' with the reason in error_message.
   * true: Member 2 extended the enum, so the real values are stored.
   * Also controlled by EVALUATION_EXTENDED_STATUSES=true.
   */
  extendedStatuses?: boolean;
}

function useExtended(options?: RowOptions): boolean {
  return options?.extendedStatuses ?? process.env.EVALUATION_EXTENDED_STATUSES === "true";
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Mean of the non-null scores, to one decimal. null when no criterion could be scored. */
export function overallScore(scores: ReadonlyArray<number | null>): number | null {
  const valid = scores.filter((s): s is number => typeof s === "number");
  if (valid.length === 0) return null;
  return round1(valid.reduce((sum, s) => sum + s, 0) / valid.length);
}

function emptyScores(): Pick<EvaluationRow, CriterionColumn> {
  return { criterion_1_score: null, criterion_2_score: null, criterion_3_score: null, criterion_4_score: null };
}

export interface ResultMeta {
  scoringModel?: string;
  transcriptionModel?: string;
  durationSeconds?: number;
}

/** A successfully scored answer -> `completed` row. */
export function evaluationRowFromResult(
  responseId: string,
  transcript: string,
  result: ScoringResult,
  meta?: ResultMeta,
): EvaluationRow {
  const scoreById = new Map<CriterionId, number | null>(result.criteria.map((c) => [c.id, c.score]));
  const scores = CRITERION_IDS.map((id) => scoreById.get(id) ?? null);

  return {
    response_id: responseId,
    transcript,
    ai_status: "completed",
    criterion_1_score: scores[0],
    criterion_2_score: scores[1],
    criterion_3_score: scores[2],
    criterion_4_score: scores[3],
    ai_overall_score: overallScore(scores),
    ai_evidence: {
      summary: result.overall_comment,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      criteria: result.criteria.map((c) => ({
        id: c.id,
        column: CRITERION_COLUMNS[CRITERION_IDS.indexOf(c.id)],
        score: c.score,
        justification: c.justification,
        evidence: c.evidence,
      })),
      confidence: result.confidence,
      flags: result.flags,
      rubric_version: result.rubric_version,
      prompt_version: result.prompt_version,
      // Present only when something needs the reviewer's attention:
      ...(result.unverified_evidence?.length ? { unverified_evidence: result.unverified_evidence } : {}),
      ...(result.adjustments?.length ? { adjustments: result.adjustments } : {}),
      ...(meta ? { meta } : {}),
    },
    error_message: null,
  };
}

export interface FailureInfo {
  status: "failed" | "failed_permanent" | "failed_retryable" | "needs_manual_review";
  /** e.g. "no_speech_detected" */
  reason?: string;
  error: { code: string; message: string };
}

/** A failed or manual-review outcome -> row with null scores and an error_message. */
export function evaluationRowFromFailure(
  responseId: string,
  transcript: string | undefined,
  failure: FailureInfo,
  options?: RowOptions,
): EvaluationRow {
  const extended = useExtended(options);
  const detail = `${failure.reason ?? failure.error.code}: ${failure.error.message}`;

  let aiStatus: PipelineStatus;
  let errorMessage = detail;
  if (failure.status === "failed" || failure.status === "failed_permanent") {
    aiStatus = "failed";
  } else if (extended) {
    aiStatus = failure.status;
  } else {
    // The enum has no such value yet: store 'failed' and keep the real reason in error_message.
    aiStatus = "failed";
    errorMessage = failure.status === "failed_retryable" ? `[retryable] ${detail}` : `[needs_manual_review] ${detail}`;
  }

  return {
    response_id: responseId,
    transcript: transcript ?? null,
    ai_status: aiStatus,
    ...emptyScores(),
    ai_overall_score: null,
    ai_evidence: null,
    error_message: errorMessage,
  };
}

/**
 * Work-in-progress row: status `processing`, optionally with the transcript already saved.
 * REQUIRES `processing` to exist in the ai_status enum (ask Member 2:
 * `alter type ai_status add value if not exists 'processing';`).
 * Scores are cleared, so re-running an evaluation never leaves stale scores next to a new transcript.
 */
export function evaluationRowFromProgress(responseId: string, transcript?: string): EvaluationRow {
  return {
    response_id: responseId,
    transcript: transcript ?? null,
    ai_status: "processing",
    ...emptyScores(),
    ai_overall_score: null,
    ai_evidence: null,
    error_message: null,
  };
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

/** The small slice of the supabase-js client that is used. */
export interface EvaluationsClient {
  from(table: string): {
    upsert(
      row: Record<string, unknown>,
      options: { onConflict: string },
    ): PromiseLike<{ error: { message: string; code?: string } | null; status?: number }>;
  };
}

/**
 * Insert or update the evaluation for this response (response_id must be unique, so a re-run
 * updates the same row). Throws on failure, retrying temporary errors.
 */
export async function saveEvaluation(client: EvaluationsClient, row: EvaluationRow): Promise<void> {
  await withRetry(
    async () => {
      const { error, status } = await client
        .from("evaluations")
        .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "response_id" });
      if (error) {
        throw Object.assign(new Error(`Could not save evaluation: ${error.message}`), {
          status,
          code: error.code,
        });
      }
    },
    { stage: "scoring" },
  );
}

/**
 * Turn a pipeline result (success or failure) into the final `evaluations` row and upsert it.
 * `meta` adds details the pipeline result does not carry, e.g. the transcription model when
 * the transcript was produced in an earlier step. Returns the row that was saved.
 */
export async function saveEvaluationResult(
  client: EvaluationsClient,
  responseId: string,
  result: PipelineResult,
  meta?: ResultMeta,
  options?: RowOptions,
): Promise<EvaluationRow> {
  const row = result.ok
    ? evaluationRowFromResult(responseId, result.transcript, result.scoring, {
        scoringModel: result.meta.scoringModel,
        durationSeconds: result.meta.durationSeconds,
        ...meta,
      })
    : evaluationRowFromFailure(
        responseId,
        result.transcript,
        { status: result.status, reason: result.reason, error: { code: result.error.code, message: result.error.message } },
        options,
      );
  await saveEvaluation(client, row);
  return row;
}

/** Convenience: wraps any thrown value in an AIError (used by callers that report save failures). */
export function asSaveError(err: unknown): AIError {
  return classifyError(err, "scoring");
}
