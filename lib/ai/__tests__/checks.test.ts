import { describe, expect, it } from "vitest";
import {
  applySanityChecks,
  buildEvidenceFeedback,
  checkEvidence,
  finalizeScoring,
  quoteSimilarity,
} from "../checks";
import { CODE_ONLY_FLAGS, CRITERION_IDS, MODEL_FLAGS } from "../rubric";

const longTranscript =
  "I led a team of four students on a robotics project. We had a deadline problem, so I reorganised the tasks and we finished on time. " +
  "It taught me to split big goals into small weekly targets and to check in with everyone regularly so problems show up early.";

function output(scores: Array<number | null>, quote = "I led a team of four students", overrides: Record<string, unknown> = {}) {
  return {
    criteria: CRITERION_IDS.map((id, i) => ({
      id,
      score: scores[i],
      justification: "ok",
      evidence: scores[i] === null ? [] : [quote],
    })),
    overall_comment: "ok",
    strengths: [],
    weaknesses: [],
    confidence: "high" as const,
    flags: [] as any[],
    ...overrides,
  };
}

describe("quoteSimilarity", () => {
  it("is 1 for an exact quote, ignoring case, punctuation and apostrophes", () => {
    expect(quoteSimilarity("WE had a deadline problem so i reorganised the tasks", longTranscript)).toBe(1);
    expect(quoteSimilarity("we dont know", "Well, we don't know yet.")).toBe(1);
  });

  it("accepts a long quote with one wrong word (Whisper vs model quoting)", () => {
    const quote = "split big goals into small weekly targets and to check in with everyone"; // 13 words
    const drifted = "split big goals into small weekly targets and to check in with everybody";
    expect(quoteSimilarity(drifted, longTranscript)).toBeGreaterThanOrEqual(0.85);
    expect(quoteSimilarity(quote, longTranscript)).toBe(1);
  });

  it("rejects a quote that is mostly invented", () => {
    expect(quoteSimilarity("I won a national award for leadership last year", longTranscript)).toBeLessThan(0.85);
  });

  it("requires short quotes (under 4 words) to match exactly", () => {
    expect(quoteSimilarity("led a team", longTranscript)).toBe(1);
    expect(quoteSimilarity("led a crew", longTranscript)).toBe(0);
  });
});

describe("checkEvidence", () => {
  it("reports every unverified quote with its criterion and similarity", () => {
    const o = output([4, 4, 4, 4], "I won a national award");
    const result = checkEvidence(o as any, longTranscript);
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(4);
    expect(result.issues[0]).toMatchObject({ criterion_id: "relevance", quote: "I won a national award" });
  });
});

describe("buildEvidenceFeedback", () => {
  it("names the missing quote so the model can fix it", () => {
    const [line] = buildEvidenceFeedback([{ criterion_id: "depth", quote: "I won an award", similarity: 0.1 }]);
    expect(line).toContain('The quote "I won an award"');
    expect(line).toContain("was not found in the transcript");
  });
});

describe("applySanityChecks", () => {
  it("caps every score at 3 for a very short answer and records the changes", () => {
    const short = "I solved it by working hard with my team."; // 9 words
    const { output: out, adjustments } = applySanityChecks(output([5, 5, 5, 5]) as any, short);
    expect(out.criteria.map((c) => c.score)).toEqual([3, 3, 3, 3]);
    expect(adjustments).toHaveLength(4);
    expect(adjustments[0]).toEqual({ criterion_id: "relevance", from: 5, to: 3, reason: "very_short_answer" });
    expect(out.flags).toEqual(expect.arrayContaining(["score_capped", "suspicious_scores"]));
    expect(out.confidence).toBe("low");
  });

  it("flags all-5s on a short (but not very short) answer without capping", () => {
    const short = Array.from({ length: 25 }, (_, i) => `word${i}`).join(" ");
    const { output: out, adjustments } = applySanityChecks(output([5, 5, 5, 5]) as any, short);
    expect(adjustments).toEqual([]);
    expect(out.criteria.map((c) => c.score)).toEqual([5, 5, 5, 5]);
    expect(out.flags).toContain("suspicious_scores");
    expect(out.flags).not.toContain("score_capped");
    expect(out.confidence).toBe("low");
  });

  it("leaves normal scores on a full-length answer alone", () => {
    const { output: out, adjustments } = applySanityChecks(output([4, 3, 5, 4]) as any, longTranscript);
    expect(adjustments).toEqual([]);
    expect(out.flags).toEqual([]);
    expect(out.confidence).toBe("high");
  });

  it("does not raise or touch null scores", () => {
    const short = "I solved it by working hard with my team.";
    const { output: out } = applySanityChecks(output([2, null, 4, 3]) as any, short);
    expect(out.criteria.map((c) => c.score)).toEqual([2, null, 3, 3]);
  });
});

describe("finalizeScoring", () => {
  it("flags unverified evidence and drops confidence to low instead of accepting silently", () => {
    const { output: out } = finalizeScoring(output([4, 4, 4, 4]) as any, longTranscript, [
      { criterion_id: "depth", quote: "made up", similarity: 0 },
    ]);
    expect(out.flags).toContain("unverified_evidence");
    expect(out.confidence).toBe("low");
  });

  it("adds short_answer and insufficient_evidence alongside the sanity rules", () => {
    const { output: out } = finalizeScoring(output([4, null, 4, 4]) as any, "a few words only in this answer here", []);
    expect(out.flags).toEqual(expect.arrayContaining(["short_answer", "insufficient_evidence"]));
  });
});

describe("flag sets", () => {
  it("keeps code-only flags out of what the model may return", () => {
    for (const flag of CODE_ONLY_FLAGS) expect(MODEL_FLAGS).not.toContain(flag);
    expect(MODEL_FLAGS).toContain("possible_transcription_issues");
  });
});
