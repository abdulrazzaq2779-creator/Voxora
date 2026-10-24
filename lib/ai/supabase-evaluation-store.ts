import { createClient } from "@supabase/supabase-js";
import type { PipelineResult } from "./pipeline";
import { toEvaluationRow } from "./evaluation-store";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase server environment variables");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export async function saveEvaluation(
  responseId: string,
  result: PipelineResult,
): Promise<void> {
  const row = toEvaluationRow(responseId, result);

  const { error } = await supabase
    .from("evaluations")
    .upsert(row, { onConflict: "response_id" });

  if (error) {
    throw new Error(`Failed to save evaluation: ${error.message}`);
  }
}