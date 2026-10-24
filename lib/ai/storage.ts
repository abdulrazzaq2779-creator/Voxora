/**
 * Integration contracts between the AI module (Member 3) and the backend (Member 2).
 *
 * The AI module never imports Supabase directly. Member 2 supplies these two
 * small server-side helpers, built on the service role key, and passes them in.
 */
import type { TranscribeOutput } from "./transcribe";

export interface FetchedAudio {
  data: Uint8Array;
  /** Optional; inferred from the file extension when missing. */
  mimeType?: string;
}

/**
 * Download a recording from the private bucket, e.g. "recordings/<attempt>/<question>.webm".
 * Should THROW on failure (a Supabase `{ error }` result must be turned into a thrown
 * error carrying `status` or `statusCode`) so retries and classification work.
 */
export type AudioFetcher = (storagePath: string) => Promise<FetchedAudio>;

export type ResponseStatus =
  | "transcribed"
  | "needs_manual_review"
  | "failed_retryable"
  | "failed_permanent";

export interface TranscriptStore {
  /** Insert or update the row in `transcripts` for this response. Must throw on failure. */
  saveTranscript(args: { responseId: string; transcript: TranscribeOutput }): Promise<void>;
  /** Update the response/attempt status. `reason` e.g. "no_speech_detected". Must throw on failure. */
  setStatus(args: {
    responseId: string;
    status: ResponseStatus;
    reason?: string;
    error?: { code: string; message: string };
  }): Promise<void>;
}

const MIME_BY_EXT: Record<string, string> = {
  webm: "audio/webm",
  mp4: "video/mp4",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
};

export function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
