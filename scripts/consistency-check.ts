/**
 * Run the scorer several times on the SAME transcript and flag unstable criteria.
 *
 *   npm run ai:consistency -- ai-fixtures/strong-answer.txt "Tell us about a time you led a team."
 *   npm run ai:consistency -- ai-fixtures/strong-answer.txt "Question text" --runs 5 --duration 15
 *
 * A criterion is flagged when its score varies by more than 1 point across runs.
 * If that happens: tighten the level wording in rubric.ts, or lower GEMINI_TEMPERATURE.
 * Requires GOOGLE_AI_API_KEY in .env.local. Runs are sequential to stay inside rate limits.
 */
import { readFile } from "node:fs/promises";
import { summarizeConsistency } from "../lib/ai/consistency";
import { AIError } from "../lib/ai/errors";
import { PROMPT_VERSION } from "../lib/ai/prompt";
import { RUBRIC_VERSION } from "../lib/ai/rubric";
import { scoreTranscript } from "../lib/ai/score";
import type { ScoringResult } from "../lib/ai/validate";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const runs = Number(flag(args, "--runs") ?? 5);
  const duration = flag(args, "--duration") ? Number(flag(args, "--duration")) : undefined;
  const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
  const [file, question = "Tell us about yourself."] = positional;

  if (!file || !Number.isInteger(runs) || runs < 2) {
    console.error('Usage: npm run ai:consistency -- <transcript.txt> "<question>" [--runs 5] [--duration seconds]');
    process.exit(1);
  }

  const transcript = (await readFile(file, "utf8")).trim();
  console.log(`rubric ${RUBRIC_VERSION} | prompt ${PROMPT_VERSION} | ${runs} runs\n`);

  const results: ScoringResult[] = [];
  for (let i = 1; i <= runs; i++) {
    try {
      const out = await scoreTranscript({ question, transcript, durationSeconds: duration });
      results.push(out.result);
      console.log(`run ${i}: ${out.result.criteria.map((c) => `${c.id}=${c.score}`).join("  ")}`);
    } catch (err) {
      const code = err instanceof AIError ? err.code : "ERROR";
      console.log(`run ${i}: FAILED (${code}) ${err instanceof Error ? err.message : err}`);
    }
  }

  if (results.length < 2) {
    console.error("\nFewer than 2 successful runs; cannot compare.");
    process.exitCode = 2;
    return;
  }

  const report = summarizeConsistency(results);
  console.log("");
  console.table(
    report.criteria.map((c) => ({
      criterion: c.criterion_id,
      scores: c.scores.join(","),
      range: c.range,
      status: c.unstable ? "UNSTABLE" : "ok",
    })),
  );
  console.log(
    report.consistent
      ? "Consistent: every criterion stayed within 1 point."
      : "Unstable criteria found. Tighten the rubric wording for them, or lower GEMINI_TEMPERATURE.",
  );
  process.exitCode = report.consistent ? 0 : 3;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
