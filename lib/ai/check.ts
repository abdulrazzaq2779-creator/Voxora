
export type ScoreCheckResult = {
  scores: number[];
  flags: string[];
  adjustments: string[];
  needsManualReview: boolean;
};

export function checkScores(
  transcript: string,
  scores: number[],
): ScoreCheckResult {
  const wordCount = transcript
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const result: ScoreCheckResult = {
    scores: [...scores],
    flags: [],
    adjustments: [],
    needsManualReview: false,
  };

  if (wordCount < 5) {
    result.flags.push("answer_too_short");
    result.needsManualReview = true;
    return result;
  }

  if (scores.length !== 4) {
    result.flags.push("invalid_criterion_count");
    result.needsManualReview = true;
    return result;
  }

  if (scores.some((score) =>
    !Number.isInteger(score) || score < 1 || score > 5
  )) {
    result.flags.push("invalid_score_range");
    result.needsManualReview = true;
    return result;
  }

  if (wordCount < 15) {
    result.scores = result.scores.map((score) =>
      Math.min(score, 3)
    );
    result.flags.push("score_capped");
    result.adjustments.push(
      "Scores capped at 3 because the answer contains fewer than 15 words."
    );
  }

  if (
    wordCount < 40 &&
    result.scores.every((score) => score === 5)
  ) {
    result.flags.push("suspicious_scores");
  }

  return result;
}
