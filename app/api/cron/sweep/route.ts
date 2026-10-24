// Safety net: run every minute (Supabase pg_cron, or your host's cron) to pick up anything stuck.
import { handleSweep } from "@/lib/ai/process-handler";
import { createServerPipeline } from "@/lib/ai/server";

export const runtime = "nodejs";
export const maxDuration = 60; // CHECK your hosting plan's limit; keep PIPELINE_BUDGET_MS below it.

async function handler(req: Request) {
  const pipeline = createServerPipeline();
  return handleSweep(req, {
    secret: pipeline.secret,
    findDue: pipeline.findDue,
    run: pipeline.run,
    options: { budgetMs: pipeline.budgetMs },
  });
}

export const POST = handler;
export const GET = handler; // some cron hosts can only send GET (with an Authorization: Bearer header)
