import type { ScoringResult } from "./validate";
export function calculateOverallScore(
  scoring: ScoringResult,
): number | null {
  const scores = scoring.criteria
    .map((criterion) => criterion.score)
    .filter((score): score is number => score !== null);

  if (scores.length === 0) {
    return null;
  }
  const average =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return Math.round(average * 10) / 10;
}