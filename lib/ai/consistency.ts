import { CRITERION_IDS, type CriterionId } from "./rubric";
import type { ScoringResult } from "./validate";

export interface CriterionConsistency {
  criterion_id: CriterionId;
  scores: number[];
  min: number;
  max: number;
  /** max - min across runs. */
  range: number;
  /** True when the range exceeds the allowed spread (default 1). */
  unstable: boolean;
}

export interface ConsistencyReport {
  runs: number;
  criteria: CriterionConsistency[];
  /** True when every criterion stayed within the allowed spread. */
  consistent: boolean;
}

/** Compare the scores from repeated runs on the same transcript. */
export function summarizeConsistency(results: readonly ScoringResult[], maxRange = 1): ConsistencyReport {
  const criteria = CRITERION_IDS.map((id): CriterionConsistency => {
    const scores = results
      .map((r) => r.criteria.find((c) => c.id === id)?.score)
      .filter((s): s is number => typeof s === "number");
    const min = scores.length ? Math.min(...scores) : 0;
    const max = scores.length ? Math.max(...scores) : 0;
    return { criterion_id: id, scores, min, max, range: max - min, unstable: max - min > maxRange };
  });
  return { runs: results.length, criteria, consistent: criteria.every((c) => !c.unstable) };
}
