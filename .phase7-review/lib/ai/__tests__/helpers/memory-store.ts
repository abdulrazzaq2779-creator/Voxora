import { AIError } from "../../errors";
import type {
  ClaimResult,
  CompletedUpdate,
  FailureUpdate,
  PipelineStore,
  ProcessingStatus,
  ResponseContext,
} from "../../run-pipeline";
import type { TranscribeOutput } from "../../transcribe";

export interface MemoryRow {
  status: ProcessingStatus;
  transcript: string | null;
  retryCount: number;
  lastError: string | null;
  lastErrorCode: string | null;
  nextRetryAt: string | null;
  statusChangedAt: Date;
  result: unknown | null;
  question: string | null;
  storagePath: string;
  durationSeconds?: number;
}

/** In-memory PipelineStore that follows the same claim rules as the SQL function claim_evaluation(). */
export class MemoryStore implements PipelineStore {
  rows = new Map<string, MemoryRow>();
  /** Every status the row went through, in order, e.g. ["transcribing", "transcribed", "scoring", "completed"]. */
  log: string[] = [];
  now: () => Date = () => new Date();
  failMarkFailed = false;

  seed(id: string, partial: Partial<MemoryRow> = {}): MemoryRow {
    const row: MemoryRow = {
      status: "queued",
      transcript: null,
      retryCount: 0,
      lastError: null,
      lastErrorCode: null,
      nextRetryAt: null,
      statusChangedAt: this.now(),
      result: null,
      question: "Describe a project you are proud of.",
      storagePath: `${id}/1.webm`,
      durationSeconds: 15,
      ...partial,
    };
    this.rows.set(id, row);
    return row;
  }

  private set(row: MemoryRow, status: ProcessingStatus) {
    row.status = status;
    row.statusChangedAt = this.now();
    this.log.push(status);
  }

  // Check-and-set happens with no await in between, so two concurrent claims cannot both succeed.
  async claim(
    id: string,
    { trigger, retranscribe, staleAfterMs }: { trigger: "auto" | "admin"; retranscribe: boolean; staleAfterMs: number },
  ): Promise<ClaimResult> {
    const row = this.rows.get(id);
    if (!row) return { claimed: false, reason: "not_found" };

    const now = this.now().getTime();
    const running = row.status === "transcribing" || row.status === "scoring";
    const stale = running && row.statusChangedAt.getTime() < now - staleAfterMs;
    const due = row.status === "failed_retryable" && (!row.nextRetryAt || new Date(row.nextRetryAt).getTime() <= now);
    const allowed =
      (trigger === "admin" && !running) || row.status === "queued" || row.status === "transcribed" || due || stale;

    if (!allowed) {
      if (row.status === "completed") return { claimed: false, reason: "already_completed" };
      if (running) return { claimed: false, reason: "already_running" };
      if (row.status === "failed_retryable") return { claimed: false, reason: "not_due" };
      return { claimed: false, reason: "not_claimable" };
    }

    if (trigger === "admin") row.retryCount = 0;
    row.lastError = null;
    row.lastErrorCode = null;
    row.nextRetryAt = null;
    this.set(row, !retranscribe && row.transcript?.trim() ? "scoring" : "transcribing");
    return { claimed: true, transcript: row.transcript, retryCount: row.retryCount };
  }

  async loadContext(id: string, claimed: { transcript: string | null; retryCount: number }): Promise<ResponseContext> {
    const row = this.rows.get(id)!;
    if (!row.question) throw new AIError("No question for this response", "BAD_INPUT", "config", false);
    return {
      responseId: id,
      question: row.question,
      storagePath: row.storagePath,
      durationSeconds: row.durationSeconds,
      transcript: claimed.transcript?.trim() || undefined,
      retryCount: claimed.retryCount,
    };
  }

  async markTranscribed(id: string, transcription: TranscribeOutput) {
    const row = this.rows.get(id)!;
    row.transcript = transcription.text;
    this.set(row, "transcribed");
  }

  async markScoring(id: string) {
    const row = this.rows.get(id)!;
    row.result = null;
    this.set(row, "scoring");
  }

  async markCompleted(id: string, update: CompletedUpdate) {
    const row = this.rows.get(id)!;
    row.transcript = update.transcript;
    row.result = update.result;
    row.lastError = null;
    this.set(row, "completed");
  }

  async markFailed(id: string, update: FailureUpdate) {
    if (this.failMarkFailed) throw new Error("database is down");
    const row = this.rows.get(id)!;
    row.retryCount = update.retryCount;
    row.lastError = `${update.reason ?? update.error.code}: ${update.error.message}`;
    row.lastErrorCode = update.error.code;
    row.nextRetryAt = update.nextRetryAt;
    row.result = null;
    this.set(row, update.status);
  }
}
