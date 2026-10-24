// Next.js App Router. Called right after an upload completes (or by a Supabase database webhook).
// Move this file if your project keeps routes elsewhere (for example src/app/api/process/route.ts).
import { handleProcess } from "@/lib/ai/process-handler";
import { createServerPipeline } from "@/lib/ai/server";

export const runtime = "nodejs"; // needs node:crypto and the Groq/Gemini SDKs
// Maximum time this function may run. CHECK what your hosting plan allows; keep PIPELINE_BUDGET_MS below it.
export const maxDuration = 60;

export async function POST(req: Request) {
  const pipeline = createServerPipeline();
  return handleProcess(req, {
    secret: pipeline.secret,
    ensure: pipeline.ensure,
    run: pipeline.run,
    budgetMs: pipeline.budgetMs,
  });
}
