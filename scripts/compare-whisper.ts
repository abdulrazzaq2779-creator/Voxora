/**
 * Compare Whisper models on your fixtures.
 *
 *   npm run ai:compare
 *   npm run ai:compare -- ai-fixtures --models whisper-large-v3-turbo,whisper-large-v3 --show
 *
 * For each audio file in the folder, the script looks for a reference transcript
 * with the same name and a .txt extension (what the speaker actually said) and
 * reports word error rate (lower is better) and time taken per model.
 * Files without a reference (e.g. silence.webm) are still transcribed and shown.
 *
 * Requires GROQ_API_KEY in .env.local.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { AIError } from "../lib/ai/errors";
import { mimeFromPath } from "../lib/ai/storage";
import { transcribeAudio, WHISPER_MODELS } from "../lib/ai/transcribe";
import { wordErrorRate } from "../lib/ai/wer";

const AUDIO_EXTENSIONS = new Set([".webm", ".mp4", ".m4a", ".mp3", ".wav", ".ogg", ".flac"]);

interface Row {
  file: string;
  model: string;
  result: string;
  wer: number | null;
  ms: number;
}

async function readReference(audioPath: string): Promise<string | null> {
  const refPath = audioPath.slice(0, audioPath.length - path.extname(audioPath).length) + ".txt";
  try {
    return await readFile(refPath, "utf8");
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const modelsFlag = args.indexOf("--models");
  const models =
    modelsFlag >= 0 && args[modelsFlag + 1] ? args[modelsFlag + 1].split(",").map((m) => m.trim()) : [...WHISPER_MODELS];
  const show = args.includes("--show");
  const dir =
    args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--models") ?? "ai-fixtures";

  const files = (await readdir(dir))
    .filter((f) => AUDIO_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error(`No audio files found in ${dir}`);
    process.exit(1);
  }

  const rows: Row[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const audio = new Uint8Array(await readFile(filePath));
    const reference = await readReference(filePath);

    for (const model of models) {
      const started = Date.now();
      let result = "ok";
      let wer: number | null = null;
      let text = "";

      try {
        const out = await transcribeAudio({ audio, filename: file, mimeType: mimeFromPath(file), model });
        text = out.text;
        if (reference !== null) wer = wordErrorRate(reference, out.text).wer;
      } catch (err) {
        result = err instanceof AIError ? err.code : "ERROR";
        if (!(err instanceof AIError)) console.error(err);
      }

      rows.push({ file, model, result, wer, ms: Date.now() - started });
      if (show && text) console.log(`\n[${file} | ${model}]\n${text}`);
    }
  }

  console.log("");
  console.table(
    rows.map((r) => ({
      file: r.file,
      model: r.model,
      result: r.result,
      "WER %": r.wer === null ? "n/a" : (r.wer * 100).toFixed(1),
      "time ms": r.ms,
    })),
  );

  console.log("\nAverage per model (files with a reference transcript only):");
  for (const model of models) {
    const scored = rows.filter((r) => r.model === model && r.wer !== null);
    if (scored.length === 0) {
      console.log(`  ${model}: no reference transcripts`);
      continue;
    }
    const avgWer = scored.reduce((sum, r) => sum + (r.wer as number), 0) / scored.length;
    const avgMs = scored.reduce((sum, r) => sum + r.ms, 0) / scored.length;
    console.log(`  ${model}: WER ${(avgWer * 100).toFixed(1)}%, ${Math.round(avgMs)} ms avg over ${scored.length} files`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
