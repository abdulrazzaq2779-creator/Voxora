/**
 * Error classification + retry helper for the AI pipeline.
 *
 * Every failure is converted to an AIError with a `retryable` flag so the
 * backend can store a retryable vs permanent status without parsing messages.
 */

export type AIStage = "config" | "transcription" | "scoring";

export type AIErrorCode =
  | "CONFIG_MISSING" // env var not set
  | "BAD_INPUT" // unsupported/oversized audio, malformed request
  | "AUTH" // invalid API key / permission
  | "RATE_LIMITED" // 429
  | "TIMEOUT"
  | "PROVIDER_UNAVAILABLE" // 5xx / network errors
  | "EMPTY_TRANSCRIPT" // silence or unintelligible audio -> needs human review
  | "INVALID_OUTPUT" // LLM returned malformed JSON / failed schema
  | "EVIDENCE_MISMATCH" // evidence quote not found in transcript
  | "SCORING_FAILED" // output still invalid after the repair attempts
  | "AUDIO_MISSING"
  | "AUDIO_CORRUPT"
  | "UNSUPPORTED_FORMAT"
  | "UNKNOWN";

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly stage: AIStage;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: AIErrorCode,
    stage: AIStage,
    retryable: boolean,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AIError";
    this.code = code;
    this.stage = stage;
    this.retryable = retryable;
  }
}

/** Read a required server-side env var. Never call this from client code. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AIError(
      `Missing required environment variable ${name}`,
      "CONFIG_MISSING",
      "config",
      false,
    );
  }
  return value;
}

const TIMEOUT_CODES = new Set(["ETIMEDOUT", "ESOCKETTIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"]);
const NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
  "UND_ERR_SOCKET",
]);

function readStatus(err: unknown): number | undefined {
  const e = err as { status?: unknown; statusCode?: unknown; response?: { status?: unknown } };
  const candidate = e?.status ?? e?.statusCode ?? e?.response?.status;
  // Supabase storage errors report statusCode as a string, e.g. "404".
  const n = typeof candidate === "string" ? Number(candidate) : candidate;
  return typeof n === "number" && Number.isInteger(n) && n >= 100 ? n : undefined;
}

/** Convert any thrown value into an AIError. AIErrors pass through unchanged. */
/** Convert any thrown value into an AIError. AIErrors pass through unchanged. */
export function classifyError(err: unknown, stage: AIStage): AIError {
  // Preserve errors that have already been classified.
  if (err instanceof AIError) return err;

  const message = err instanceof Error ? err.message : String(err);
  const status = readStatus(err);
  const raw = err as {
    code?: unknown;
    name?: unknown;
    error?: { code?: unknown; message?: unknown };
  };

  const code = String(raw?.code ?? raw?.error?.code ?? "").toUpperCase();
  const name = String(raw?.name ?? "");
  const lowerMessage = [
    message,
    typeof raw?.error?.message === "string" ? raw.error.message : "",
  ].join(" ").toLowerCase();

  const opts = { cause: err };

  // Configuration errors: missing server-side credentials.
  if (
    /missing required environment variable/i.test(message) ||
    /api key.*(missing|not set|required)/i.test(message)
  ) {
    return new AIError(message, "CONFIG_MISSING", "config", false, opts);
  }

  // Authentication and authorization failures are not automatically retried.
  if (status === 401 || status === 403) {
    return new AIError(message, "AUTH", stage, false, opts);
  }

  // Explicitly identified missing recordings.
  // Do not treat every HTTP 404 as a missing recording.
  if (
    code === "AUDIO_MISSING" ||
    code === "OBJECT_NOT_FOUND" ||
    code === "NOT_FOUND" &&
      /audio|recording|storage object|file/i.test(lowerMessage)
  ) {
    return new AIError(
      message,
      "AUDIO_MISSING",
      "transcription",
      false,
      opts,
    );
  }

  // Invalid or unsupported audio.
  if (
    status === 415 ||
    code === "UNSUPPORTED_FORMAT" ||
    /unsupported (audio )?format|unsupported file type|invalid audio format/i.test(lowerMessage)
  ) {
    return new AIError(
      message,
      "UNSUPPORTED_FORMAT",
      "transcription",
      false,
      opts,
    );
  }

  if (
    code === "AUDIO_CORRUPT" ||
    /corrupt audio|invalid audio data|unable to decode audio|audio file is empty/i.test(lowerMessage)
  ) {
    return new AIError(
      message,
      "AUDIO_CORRUPT",
      "transcription",
      false,
      opts,
    );
  }

  // Rate limits are temporary.
  if (status === 429) {
    return new AIError(message, "RATE_LIMITED", stage, true, opts);
  }

  // Timeout failures are usually retryable.
  if (
    status === 408 ||
    name === "AbortError" ||
    name === "TimeoutError" ||
    TIMEOUT_CODES.has(code)
  ) {
    return new AIError(message, "TIMEOUT", stage, true, opts);
  }

  // Provider/server failures are usually temporary.
  if (status !== undefined && status >= 500) {
    return new AIError(
      message,
      "PROVIDER_UNAVAILABLE",
      stage,
      true,
      opts,
    );
  }

  // Other clearly invalid input responses are permanent.
  if (
  status === 400 ||
  status === 404 ||
  status === 413 ||
  status === 422
) {
  return new AIError(message, "BAD_INPUT", stage, false, opts);
}

  // Network failures are usually retryable.
  if (NETWORK_CODES.has(code)) {
    return new AIError(
      message,
      "PROVIDER_UNAVAILABLE",
      stage,
      true,
      opts,
    );
  }

  return new AIError(message, "UNKNOWN", stage, false, opts);
}

export interface RetryOptions {
  stage: AIStage;
  maxAttempts?: number;
  delaysMs?: number[];
  onRetry?: (error: AIError, attempt: number, delayMs: number) => void;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Run `fn`, retrying only errors classified as retryable, with exponential
 * backoff and jitter. Throws the final AIError when attempts are exhausted.
 */

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const {
    stage,
    maxAttempts = 3,
    delaysMs = [2000, 8000],
    onRetry,
  } = options;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      const error = classifyError(err, stage);

      if (!error.retryable || attempt >= maxAttempts) {
        throw error;
      }

      const delayMs = delaysMs[attempt - 1] ?? delaysMs[delaysMs.length - 1] ?? 0;

      onRetry?.(error, attempt, delayMs);

      await sleep(delayMs);
    }
  }
}

// ---------------------------------------------------------------------------
// Mapping an error to the status the response ends up in
// ---------------------------------------------------------------------------

export type FailureStatus = "failed_retryable" | "failed_permanent" | "needs_manual_review";

/** Silence / no speech goes to a human; everything else is retryable or permanent. */
export function statusForError(
  error: AIError,
): { status: FailureStatus; reason?: string } {
  switch (error.code) {
    case "EMPTY_TRANSCRIPT":
      return {
        status: "needs_manual_review",
        reason: "no_speech_detected",
      };

    case "AUDIO_MISSING":
      return {
        status: "needs_manual_review",
        reason: "audio_missing",
      };

    case "AUDIO_CORRUPT":
      return {
        status: "needs_manual_review",
        reason: "audio_corrupt",
      };

    case "SCORING_FAILED":
      return {
        status: "failed_permanent",
        reason: "scoring_failed",
      };

    case "UNSUPPORTED_FORMAT":
      return {
        status: "failed_permanent",
        reason: "unsupported_format",
      };

    default:
      return {
        status: error.retryable ? "failed_retryable" : "failed_permanent",
      };
  }
}
