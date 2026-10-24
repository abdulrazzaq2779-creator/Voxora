/**
 * Manual end-to-end check against the real APIs.
 *
 *   npm run ai:try -- ai-fixtures/sample.webm "Tell us about a time you led a team."
 *   npm run ai:try -- --transcript ai-fixtures/sample.txt "Tell us about a time you led a team."
 *
 * Requires GROQ_API_KEY and GOOGLE_AI_API_KEY in .env.local.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { processRecording } from "../lib/ai/pipeline";

const MIME_BY_EXT: Record<string, string> = {
  ".webm": "audio/webm",
  ".mp4": "video/mp4",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

async function main() {
  const args = process.argv.slice(2);
  const transcriptMode = args[0] === "--transcript";
  const [filePath, question = "Tell us about yourself."] = transcriptMode ? args.slice(1) : args;

  if (!filePath) {
    console.error("Usage: npm run ai:try -- [--transcript] <file> [question]");
    process.exit(1);
  }

  const buffer = await readFile(filePath);
  const result = transcriptMode
    ? await processRecording({ question, transcript: buffer.toString("utf8") })
    : await processRecording({
        question,
        audio: {
          data: new Uint8Array(buffer),
          filename: path.basename(filePath),
          mimeType: MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
        },
      });

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
