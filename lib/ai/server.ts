/**
 * Server-side wiring for the API routes: Supabase service role client, store, audio download and secret.
 * Server only. Never import this from client code.
 */
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./errors";
import { runPipeline, type RunPipelineResult, type Trigger } from "./run-pipeline";
import { createAudioFetcher, createSupabaseStore, ensureEvaluationRow, findDueResponses } from "./supabase-store";

export function createServerPipeline() {
  const client = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  const store = createSupabaseStore(client);
  const fetchAudio = createAudioFetcher(client);
  const staleMinutes = Number(process.env.PIPELINE_STALE_MINUTES);

  return {
    client,
    secret: process.env.PIPELINE_SECRET,
    budgetMs: Number(process.env.PIPELINE_BUDGET_MS) || 50_000,
    run: (responseId: string, options: { deadline?: number; trigger?: Trigger; retranscribe?: boolean } = {}): Promise<RunPipelineResult> =>
      runPipeline(responseId, {
        store,
        fetchAudio,
        trigger: options.trigger,
        retranscribe: options.retranscribe,
        deadline: options.deadline,
        staleAfterMs: staleMinutes > 0 ? staleMinutes * 60_000 : undefined,
      }),
    ensure: (responseId: string) => ensureEvaluationRow(client, responseId),
    findDue: (limit: number) => findDueResponses(client, limit),
  };
}
