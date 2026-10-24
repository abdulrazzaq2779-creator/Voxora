/**
 * Evaluate one recording end to end and persist every stage to `evaluations`.
 *
 *   npm run ai:supabase -- <video_storage_path>
 *   npm run ai:supabase -- <video_storage_path> --question "Question text, if the lookup fails"
 *
 * Steps (in this order):
 *   1. Look up the student_responses row by video_storage_path (id, duration_seconds, recording path)
 *      and the question text.
 *   2. Upsert an evaluations row with ai_status "processing".
 *   3. Download the recording and call transcribeAudio() ONCE.
 *   4. Save the transcript to evaluations.transcript, status still "processing".
 *   5. Score that transcript with processRecording({ question, transcript, durationSeconds });
 *      it does not transcribe again.
 *   6. Upsert the final scores, evidence, status and any error message.
 *
 * Needs in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (writes to
 * `evaluations` and reads the private bucket; server/dev machine only, never commit),
 * GROQ_API_KEY, GOOGLE_AI_API_KEY.
 * Optional: QUESTIONS_TABLE (default "questions"), QUESTION_TEXT_COLUMN (auto-detected otherwise),
 * EVALUATION_EXTENDED_STATUSES=true once the ai_status enum has the extra values.
 *
 * Exit code: 0 = completed, 2 = the evaluation was recorded as failed / needs review,
 * 1 = the script itself could not continue (setup, lookup or database error).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { classifyError } from "../lib/ai/errors";
import {
  evaluationRowFromProgress,
  saveEvaluation,
  saveEvaluationResult,
  type EvaluationsClient,
} from "../lib/ai/evaluation";
import { processRecording, statusForError, type PipelineResult } from "../lib/ai/pipeline";
import { mimeFromPath } from "../lib/ai/storage";
import { transcribeAudio } from "../lib/ai/transcribe";

const BUCKET = "interview-recordings";
const QUESTION_TEXT_CANDIDATES = ["question_text", "text", "question", "prompt", "title", "content"];

interface StudentResponse {
  id: string;
  session_id: string | null;
  question_id: number | string | null;
  duration_seconds: number | null;
  video_storage_path: string | null;
  audio_storage_path: string | null;
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function step(n: number, text: string) {
  console.log(`[${n}/6] ${text}`);
}

/** Step 1a: student_responses row for this video_storage_path (newest first if there are retakes). */
async function findResponse(supabase: SupabaseClient, videoPath: string): Promise<StudentResponse> {
  const { data, error } = await supabase
    .from("student_responses")
    .select("id, session_id, question_id, duration_seconds, video_storage_path, audio_storage_path, created_at")
    .eq("video_storage_path", videoPath)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) fail(`Could not query student_responses: ${error.message}`);
  if (!data || data.length === 0) {
    fail(
      `No student_responses row has video_storage_path = "${videoPath}".\n` +
        "If you know the row exists, the key in use may not be allowed to read it (row level security): use SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (data.length > 1) {
    console.warn(`Warning: ${data.length} rows share this path; using the newest (id ${data[0].id}).`);
  }
  return data[0] as StudentResponse;
}

/** Step 1b: question text for the response's question_id. */
async function findQuestionText(supabase: SupabaseClient, questionId: number | string): Promise<string> {
  const table = process.env.QUESTIONS_TABLE || "questions";
  const { data, error } = await supabase.from(table).select("*").eq("id", questionId).maybeSingle();
  if (error) fail(`Could not query ${table}: ${error.message}\nPass the text yourself with --question "...".`);
  if (!data) fail(`No row with id ${questionId} in ${table}.\nPass the text yourself with --question "...".`);

  const row = data as Record<string, unknown>;
  const configured = process.env.QUESTION_TEXT_COLUMN;
  const column =
    configured ?? QUESTION_TEXT_CANDIDATES.find((c) => typeof row[c] === "string" && (row[c] as string).trim());
  const value = column ? row[column] : undefined;
  if (typeof value !== "string" || !value.trim()) {
    fail(
      `Could not find the question text in ${table}. Its columns are: ${Object.keys(row).join(", ")}.\n` +
        'Set QUESTION_TEXT_COLUMN in .env.local to the right one, or pass --question "...".',
    );
  }
  return value.trim();
}

function describeDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/enum/i.test(message) && /ai_status/i.test(message)) {
    return `${message}\nThe ai_status enum probably lacks "processing". Ask Member 2 to run: alter type ai_status add value if not exists 'processing';`;
  }
  return message;
}

async function main() {
  const args = process.argv.slice(2);
  const questionOverride = flag(args, "--question");
  const [videoPath] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
  if (!videoPath) fail('Usage: npm run ai:supabase -- <video_storage_path> [--question "text"]');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) fail("Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
  if (!key) fail("Set SUPABASE_SERVICE_ROLE_KEY in .env.local (server/dev machine only, never commit it).");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const evaluations = supabase as unknown as EvaluationsClient;

  // 1. student_responses -> id, duration_seconds, recording path (+ question text)
  step(1, `Looking up student_responses for ${videoPath}`);
  const response = await findResponse(supabase, videoPath);
  const recordingPath = response.audio_storage_path || response.video_storage_path;
  if (!recordingPath) fail(`Response ${response.id} has no audio_storage_path or video_storage_path.`);

  let question = questionOverride?.trim();
  if (!question) {
    if (response.question_id === null || response.question_id === undefined) {
      fail('This response has no question_id. Pass the text with --question "...".');
    }
    question = await findQuestionText(supabase, response.question_id);
  }
  const responseId = response.id;
  console.log(`      response ${responseId} | recording ${recordingPath} | ${response.duration_seconds ?? "?"} s`);
  console.log(`      question: ${question}`);

  // 2. processing row
  step(2, 'Upserting evaluation row with ai_status "processing"');
  try {
    await saveEvaluation(evaluations, evaluationRowFromProgress(responseId));
  } catch (err) {
    fail(`Could not write the processing row: ${describeDbError(err)}`);
  }

  // 3. download + transcribe, exactly once
  step(3, "Downloading the recording and transcribing it (once)");
  let transcription;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(recordingPath);
    if (error || !data) {
  const downloadError = error as
    | {
        message?: string;
        status?: number | string;
        statusCode?: number | string;
        code?: string;
      }
    | null;

  const status = downloadError?.status ?? downloadError?.statusCode;

  throw Object.assign(
    new Error(
      downloadError?.message ??
        `Download failed: no data returned for ${recordingPath}`,
    ),
    {
      ...(status !== undefined ? { status } : {}),
      ...(downloadError?.statusCode !== undefined
        ? { statusCode: downloadError.statusCode }
        : {}),
      ...(downloadError?.code ? { code: downloadError.code } : {}),
    },
  );
}
    const bytes = new Uint8Array(await data.arrayBuffer());
    console.log(`      downloaded ${(bytes.byteLength / 1024).toFixed(0)} KB`);

    // Keep a local copy (gitignored) so you can play it back.
    const localPath = path.join("ai-fixtures", "downloaded", recordingPath.replace(/\//g, "_"));
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, bytes);

    transcription = await transcribeAudio({
      audio: bytes,
      filename: recordingPath.split("/").pop() ?? "recording.webm",
      mimeType: mimeFromPath(recordingPath),
    });
  } catch (err) {
    // Silence, a missing file, a bad key... are recorded on the evaluation row, not just printed.
    const error = classifyError(err, "transcription");
    const { status, reason } = statusForError(error);
    const failure: PipelineResult = {
      ok: false,
      status,
      reason,
      failedStage: error.stage,
      error: { code: error.code, message: error.message, retryable: error.retryable },
    };
    try {
      const row = await saveEvaluationResult(evaluations, responseId, failure);
      console.log(`      FAILED (${error.code}): ${error.message}`);
      console.log(`[6/6] Recorded as ${row.ai_status}: ${row.error_message}`);
      process.exitCode = 2;
    } catch (saveErr) {
      fail(`Transcription failed (${error.message}) and the failure could not be saved: ${describeDbError(saveErr)}`);
    }
    return;
  }
  console.log(`      ${transcription.text.split(/\s+/).length} words, ${transcription.durationSeconds ?? "?"} s of audio`);

  // 4. save the transcript, still processing
  step(4, 'Saving the transcript to evaluations.transcript (status stays "processing")');
  try {
    await saveEvaluation(evaluations, evaluationRowFromProgress(responseId, transcription.text));
  } catch (err) {
    fail(`Could not save the transcript: ${describeDbError(err)}`);
  }

  // 5. score the existing transcript (no second transcription)
  step(5, "Scoring the transcript");
  const durationSeconds = response.duration_seconds ?? transcription.durationSeconds;
  const lowConfidenceSpans = transcription.segments
    .filter((s) => s.avgLogprob !== undefined && s.avgLogprob < -1)
    .map((s) => s.text);
  const result = await processRecording({
    question,
    transcript: transcription.text,
    durationSeconds,
    lowConfidenceSpans,
  });

  // 6. final upsert
  step(6, "Saving the final result");
  try {
    const row = await saveEvaluationResult(evaluations, responseId, result, {
      transcriptionModel: transcription.model,
      durationSeconds,
    });
    console.log(
      JSON.stringify(
        {
          response_id: row.response_id,
          ai_status: row.ai_status,
          scores: [row.criterion_1_score, row.criterion_2_score, row.criterion_3_score, row.criterion_4_score],
          ai_overall_score: row.ai_overall_score,
          error_message: row.error_message,
          ai_evidence: row.ai_evidence,
        },
        null,
        2,
      ),
    );
    process.exitCode = result.ok ? 0 : 2;
  } catch (err) {
    fail(`Could not save the final result: ${describeDbError(err)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
