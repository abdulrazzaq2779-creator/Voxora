import { describe, expect, it } from "vitest";
import { CRITERION_IDS } from "../rubric";
import { addDerivedFlags, assertEvidence, checkEvidence, parseScoringJson } from "../validate";

const transcript =
  "I led a team of four students on a robotics project. We had a deadline problem, so I reorganised the tasks and we finished on time. " +
  "It taught me to split big goals into small weekly targets and to check in with everyone regularly so problems show up early.";

function buildOutput(overrides: Record<string, unknown> = {}) {
  return {
    criteria: CRITERION_IDS.map((id) => ({
      id,
      score: 4 as number | null,
      justification: "Clear and relevant.",
      evidence: ["I led a team of four students"],
    })),
    overall_comment: "A solid answer with a concrete example.",
    confidence: "high",
    flags: [] as string[],
    ...overrides,
  };
}

describe("parseScoringJson", () => {
  it("accepts a valid response", () => {
    const parsed = parseScoringJson(JSON.stringify(buildOutput()));
    expect(parsed.criteria).toHaveLength(CRITERION_IDS.length);
    expect(parsed.confidence).toBe("high");
  });

  it("accepts JSON wrapped in a code fence", () => {
    const raw = "```json\n" + JSON.stringify(buildOutput()) + "\n```";
    expect(() => parseScoringJson(raw)).not.toThrow();
  });

  it("rejects non-JSON as a retryable INVALID_OUTPUT", () => {
    expect(() => parseScoringJson("not json")).toThrowError(
      expect.objectContaining({ code: "INVALID_OUTPUT", retryable: true }),
    );
  });

  it("rejects scores outside 1-5 and non-integers", () => {
    const high = buildOutput();
    high.criteria[0].score = 6;
    expect(() => parseScoringJson(JSON.stringify(high))).toThrow();

    const fractional = buildOutput();
    fractional.criteria[0].score = 3.5;
    expect(() => parseScoringJson(JSON.stringify(fractional))).toThrow();
  });

  it("rejects duplicate or missing criteria", () => {
    const bad = buildOutput();
    bad.criteria[1].id = bad.criteria[0].id;
    expect(() => parseScoringJson(JSON.stringify(bad))).toThrow();
  });

  it("rejects a scored criterion with no evidence", () => {
    const bad = buildOutput();
    bad.criteria[0].evidence = [];
    expect(() => parseScoringJson(JSON.stringify(bad))).toThrow();
  });

  it("accepts a null score with no evidence (insufficient evidence)", () => {
    const output = buildOutput();
    output.criteria[3].score = null;
    output.criteria[3].evidence = [];
    const parsed = parseScoringJson(JSON.stringify(output));
    expect(parsed.criteria[3].score).toBeNull();
  });

  it("rejects an invalid confidence value", () => {
    expect(() => parseScoringJson(JSON.stringify(buildOutput({ confidence: "very high" })))).toThrow();
  });

  it("drops unknown flags and removes duplicates instead of failing", () => {
    const parsed = parseScoringJson(
      JSON.stringify(buildOutput({ flags: ["short_answer", "made_up_flag", "short_answer"] })),
    );
    expect(parsed.flags).toEqual(["short_answer"]);
  });

  it("defaults flags to an empty list when missing", () => {
    const output = buildOutput() as Record<string, unknown>;
    delete output.flags;
    expect(parseScoringJson(JSON.stringify(output)).flags).toEqual([]);
  });
});

describe("evidence checks", () => {
  it("passes when quotes appear in the transcript, ignoring case and punctuation", () => {
    const output = parseScoringJson(JSON.stringify(buildOutput()));
    output.criteria[0].evidence = ["We had a deadline problem so I reorganised the tasks"];
    expect(checkEvidence(output, transcript).ok).toBe(true);
  });

  it("flags quotes that are not in the transcript", () => {
    const output = parseScoringJson(JSON.stringify(buildOutput()));
    output.criteria[0].evidence = ["I won a national award"];
    const result = checkEvidence(output, transcript);
    expect(result.ok).toBe(false);
    expect(result.issues[0].quote).toBe("I won a national award");
    expect(() => assertEvidence(output, transcript)).toThrowError(
      expect.objectContaining({ code: "EVIDENCE_MISMATCH" }),
    );
  });
});

describe("addDerivedFlags", () => {
  it("adds short_answer and caps confidence at medium for short transcripts", () => {
    const output = parseScoringJson(JSON.stringify(buildOutput()));
    const result = addDerivedFlags(output, "I led a team of four students.");
    expect(result.flags).toContain("short_answer");
    expect(result.confidence).toBe("medium");
  });

  it("does not flag a long enough transcript", () => {
    const output = parseScoringJson(JSON.stringify(buildOutput()));
    const result = addDerivedFlags(output, transcript);
    expect(result.flags).not.toContain("short_answer");
    expect(result.confidence).toBe("high");
  });

  it("adds insufficient_evidence when any score is null", () => {
    const raw = buildOutput();
    raw.criteria[2].score = null;
    raw.criteria[2].evidence = [];
    const result = addDerivedFlags(parseScoringJson(JSON.stringify(raw)), transcript);
    expect(result.flags).toContain("insufficient_evidence");
  });

  it("keeps the model's own flags", () => {
    const output = parseScoringJson(JSON.stringify(buildOutput({ flags: ["possible_transcription_issues"] })));
    expect(addDerivedFlags(output, transcript).flags).toContain("possible_transcription_issues");
  });
});

describe("tighter schema limits", () => {
  it("rejects an over-long justification", () => {
    const bad = buildOutput();
    bad.criteria[0].justification = "x".repeat(601);
    expect(() => parseScoringJson(JSON.stringify(bad))).toThrow();
  });

  it("rejects an over-long quote and more than 3 quotes", () => {
    const long = buildOutput();
    long.criteria[0].evidence = ["y".repeat(401)];
    expect(() => parseScoringJson(JSON.stringify(long))).toThrow();

    const many = buildOutput();
    many.criteria[0].evidence = ["a b", "c d", "e f", "g h"];
    expect(() => parseScoringJson(JSON.stringify(many))).toThrow();
  });

  it("drops flags that only the code may set", () => {
    const parsed = parseScoringJson(
      JSON.stringify(buildOutput({ flags: ["unverified_evidence", "score_capped", "suspicious_scores", "off_topic"] })),
    );
    expect(parsed.flags).toEqual(["off_topic"]);
  });
});
