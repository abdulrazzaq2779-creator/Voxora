/**
 * The sweeper: finds responses that need processing and runs them one after another inside a time budget.
 * It is the safety net behind the immediate triggers: whatever a webhook or submit handler missed, a
 * crashed run, a due retry, is picked up here within a minute.
 */
import type { RunPipelineResult } from "./run-pipeline";

export interface SweepDeps {
  /** Ids of responses that need a run now (see findDueResponses). */
  findDue(limit: number): Promise<string[]>;
  run(responseId: string, options: { deadline: number }): Promise<RunPipelineResult>;
  now?: () => number;
}

export interface SweepOptions {
  /** Most responses to pick up per sweep. Default 5. */
  limit?: number;
  /** Total time for the whole sweep, a bit under the function's time limit. Default 50 s. */
  budgetMs?: number;
  /** Do not start another response with less than this left. Default 25 s. */
  minPerResponseMs?: number;
}

export interface SweepSummary {
  found: number;
  attempted: number;
  completed: number;
  deferred: number;
  skipped: number;
  failed: number;
  /** Found but left for the next sweep because time ran out. */
  leftForNext: number;
  results: Array<{ responseId: string; outcome: RunPipelineResult["outcome"]; status?: string; reason?: string }>;
}

export async function sweep(deps: SweepDeps, options: SweepOptions = {}): Promise<SweepSummary> {
  const now = deps.now ?? Date.now;
  const limit = options.limit ?? 5;
  const budgetMs = options.budgetMs ?? 50_000;
  const minPerResponseMs = options.minPerResponseMs ?? 25_000;
  const started = now();
  const deadline = started + budgetMs;

  const ids = await deps.findDue(limit);
  const summary: SweepSummary = {
    found: ids.length,
    attempted: 0,
    completed: 0,
    deferred: 0,
    skipped: 0,
    failed: 0,
    leftForNext: 0,
    results: [],
  };

  for (let i = 0; i < ids.length; i++) {
    if (deadline - now() < minPerResponseMs) {
      summary.leftForNext = ids.length - i;
      break;
    }
    const result = await deps.run(ids[i], { deadline });
    summary.attempted++;
    if (result.outcome === "completed") summary.completed++;
    else if (result.outcome === "deferred") summary.deferred++;
    else if (result.outcome === "skipped") summary.skipped++;
    else summary.failed++;

    summary.results.push({
      responseId: ids[i],
      outcome: result.outcome,
      status: "status" in result ? result.status : undefined,
      reason: "reason" in result ? result.reason : undefined,
    });
  }
  return summary;
}
