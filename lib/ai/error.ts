
export type ErrorCategory =
  | "transcription"
  | "scoring"
  | "database"
  | "validation"
  | "unknown";

export type ErrorCode =
  | "NETWORK_ERROR"
  | "RATE_LIMIT"
  | "PROVIDER_ERROR"
  | "INVALID_AUDIO"
  | "NO_SPEECH"
  | "RECORDING_NOT_FOUND"
  | "INVALID_OUTPUT"
  | "SCORING_FAILED"
  | "DATABASE_ERROR"
  | "UNKNOWN_ERROR";

export type ClassifiedError = {
  code: ErrorCode;
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  needsManualReview: boolean;
};

export function classifyError(error: unknown): ClassifiedError {
  const message =
    error instanceof Error
      ? error.message
      : String(error ?? "Unknown error");

  const normalized = message.toLowerCase();

  if (
    normalized.includes("recording not found") ||
    normalized.includes("object not found") ||
    normalized.includes("404")
  ) {
    return {
      code: "RECORDING_NOT_FOUND",
      category: "transcription",
      message,
      retryable: false,
      needsManualReview: true,
    };
  }

  if (
    normalized.includes("no speech") ||
    normalized.includes("no audio") ||
    normalized.includes("silent audio")
  ) {
    return {
      code: "NO_SPEECH",
      category: "transcription",
      message,
      retryable: false,
      needsManualReview: true,
    };
  }

  if (
    normalized.includes("invalid audio") ||
    normalized.includes("unsupported audio")
  ) {
    return {
      code: "INVALID_AUDIO",
      category: "transcription",
      message,
      retryable: false,
      needsManualReview: true,
    };
  }

  if (
    normalized.includes("429") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return {
      code: "RATE_LIMIT",
      category: "scoring",
      message,
      retryable: true,
      needsManualReview: false,
    };
  }

  if (
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("fetch failed") ||
    normalized.includes("econnreset") ||
    normalized.includes("temporarily unavailable")
  ) {
    return {
      code: "NETWORK_ERROR",
      category: "unknown",
      message,
      retryable: true,
      needsManualReview: false,
    };
  }

  if (
    normalized.includes("database") ||
    normalized.includes("supabase")
  ) {
    return {
      code: "DATABASE_ERROR",
      category: "database",
      message,
      retryable: true,
      needsManualReview: false,
    };
  }

  if (
    normalized.includes("validation") ||
    normalized.includes("invalid output") ||
    normalized.includes("schema")
  ) {
    return {
      code: "INVALID_OUTPUT",
      category: "validation",
      message,
      retryable: false,
      needsManualReview: false,
    };
  }

  if (
    normalized.includes("scoring_failed") ||
    normalized.includes("scoring failed")
  ) {
    return {
      code: "SCORING_FAILED",
      category: "scoring",
      message,
      retryable: false,
      needsManualReview: true,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    category: "unknown",
    message,
    retryable: false,
    needsManualReview: true,
  };
}
