import type { ScoringOutput } from "./validate";
import { AIError } from "./errors";
import {
  CODE_ONLY_FLAGS,
  CRITERION_IDS,
  SHORT_ANSWER_WORDS,
  VERY_SHORT_ANSWER_WORDS,
  VERY_SHORT_SCORE_CAP,
  type CriterionId,
  type Flag,
} from "./rubric";

export interface EvidenceIssue {
  criterion_id: CriterionId;
  quote: string;
  similarity: number;
}

export interface ScoreAdjustment {
  criterion_id: CriterionId;
  from: number;
  to: number;
  reason: "very_short_answer";
}

export interface EvidenceCheckResult {
  ok: boolean;
  issues: EvidenceIssue[];
}

/** Normalize text so punctuation, case, and apostrophes do not affect matching. */
function normalizeText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Calculate Levenshtein edit distance between two strings. */
function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + cost,
      );

      diagonal = above;
    }
  }

  return previous[b.length];
}

/**
 * Return how closely a quoted passage matches the transcript.
 * Exact normalized matches score 1; longer quotes may tolerate small word errors.
 */
export function quoteSimilarity(quote: string, transcript: string): number {
  const q = normalizeText(quote);
  const t = normalizeText(transcript);

  if (q.length === 0 || t.length === 0) return 0;

  const normalizedQuote = q.join(" ");
  const normalizedTranscript = t.join(" ");

  if (normalizedTranscript.includes(normalizedQuote)) return 1;

  // Short quotes must match exactly to avoid accidental matches.
  if (q.length < 4) return 0;

  // Compare the quote against transcript windows of approximately the same length.
  let best = 0;
  const minWindow = Math.max(1, q.length - 2);
  const maxWindow = Math.min(t.length, q.length + 2);

  for (let size = minWindow; size <= maxWindow; size++) {
    for (let start = 0; start + size <= t.length; start++) {
      const candidate = t.slice(start, start + size);
      const distance = editDistance(q.join(" "), candidate.join(" "));
      const similarity = 1 - distance / Math.max(q.join(" ").length, candidate.join(" ").length);

      if (similarity > best) best = similarity;
      if (best >= 0.85) return best;
    }
  }

  return best;
}

/** Find evidence quotes that cannot be verified against the transcript. */
export function checkEvidence(
  output: ScoringOutput,
  transcript: string,
): EvidenceCheckResult {
  const issues: EvidenceIssue[] = [];

  for (const criterion of output.criteria) {
    for (const quote of criterion.evidence) {
      const similarity = quoteSimilarity(quote, transcript);

      if (similarity < 0.85) {
        issues.push({
          criterion_id: criterion.id,
          quote,
          similarity,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Return only unverified quotes for the scoring pipeline. */
export function findUnverifiedEvidence(
  output: ScoringOutput,
  transcript: string,
): EvidenceIssue[] {
  return checkEvidence(output, transcript).issues;
}

/** Build model feedback describing the evidence that needs to be corrected. */
export function buildEvidenceFeedback(issues: EvidenceIssue[]): string[] {
  return issues.map(
    ({ quote }) =>
      `The quote "${quote}" was not found in the transcript. Use an exact or closely matching quote from the transcript, or remove the unsupported evidence and set the score to null if there is insufficient evidence.`,
  );
}

/** Throw a structured error if any evidence quote is not verifiable. */
export function assertEvidence(
  output: ScoringOutput,
  transcript: string,
): void {
  const result = checkEvidence(output, transcript);

  if (!result.ok) {
    throw new AIError(
  `Unverified evidence: ${result.issues
    .map((issue) => `${issue.criterion_id}: "${issue.quote}"`)
    .join("; ")}`,
  "EVIDENCE_MISMATCH",
  "scoring",
  false,
);
  }
}

/** Add flags derived from transcript length and the presence of null scores. */
export function addDerivedFlags(
  output: ScoringOutput,
  transcript: string,
): ScoringOutput {
  const result = {
    ...output,
    criteria: output.criteria.map((criterion) => ({ ...criterion })),
    flags: [...output.flags] as Flag[],
    confidence: output.confidence,
  };

  const wordCount = normalizeText(transcript).length;

  if (wordCount < SHORT_ANSWER_WORDS && !result.flags.includes("short_answer")) {
    result.flags.push("short_answer");

    if (result.confidence === "high") {
      result.confidence = "medium";
    }
  }

  if (
    result.criteria.some((criterion) => criterion.score === null) &&
    !result.flags.includes("insufficient_evidence")
  ) {
    result.flags.push("insufficient_evidence");
  }

  return result;
}

/** Apply score caps and identify suspiciously high scores on short answers. */
export function applySanityChecks(
  output: ScoringOutput,
  transcript: string,
): { output: ScoringOutput; adjustments: ScoreAdjustment[] } {
  const result: ScoringOutput = {
    ...output,
    criteria: output.criteria.map((criterion) => ({ ...criterion })),
    flags: [...output.flags] as Flag[],
    confidence: output.confidence,
  };

  const adjustments: ScoreAdjustment[] = [];
  const wordCount = normalizeText(transcript).length;
  const allScoresAreFive = result.criteria.every(
  (criterion) => criterion.score === 5,
);
  if (wordCount < VERY_SHORT_ANSWER_WORDS) {
    for (const criterion of result.criteria) {
      if (
        criterion.score !== null &&
        criterion.score > VERY_SHORT_SCORE_CAP
      ) {
        adjustments.push({
          criterion_id: criterion.id,
          from: criterion.score,
          to: VERY_SHORT_SCORE_CAP,
          reason: "very_short_answer",
        });

        criterion.score = VERY_SHORT_SCORE_CAP;
      }
    }

    if (adjustments.length > 0 && !result.flags.includes("score_capped")) {
      result.flags.push("score_capped");
    }
  }

  if (wordCount < SHORT_ANSWER_WORDS && allScoresAreFive) {
    if (!result.flags.includes("suspicious_scores")) {
      result.flags.push("suspicious_scores");
    }
  }

  if (
    adjustments.length > 0 ||
    result.flags.includes("suspicious_scores") ||
    result.flags.includes("unverified_evidence")
  ) {
    result.confidence = "low";
  }

  return { output: result, adjustments };
}

/** Combine evidence validation, derived flags, and sanity checks. */
export function finalizeScoring(
  output: ScoringOutput,
  transcript: string,
  unverified: EvidenceIssue[],
): { output: ScoringOutput; adjustments: ScoreAdjustment[] } {
  let result: ScoringOutput = {
    ...output,
    criteria: output.criteria.map((criterion) => ({ ...criterion })),
    flags: output.flags.filter(
      (flag) => !CODE_ONLY_FLAGS.includes(flag as (typeof CODE_ONLY_FLAGS)[number]),
    ) as Flag[],
  };

  result = addDerivedFlags(result, transcript);

  if (unverified.length > 0) {
    if (!result.flags.includes("unverified_evidence")) {
      result.flags.push("unverified_evidence");
    }
    result.confidence = "low";
  }

  const sanity = applySanityChecks(result, transcript);

  return {
    output: sanity.output,
    adjustments: sanity.adjustments,
  };
}