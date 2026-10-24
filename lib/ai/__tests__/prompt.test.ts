import { describe, expect, it } from "vitest";
import { buildScoringPrompt } from "../prompt";
import { CRITERION_IDS, FAIRNESS_RULES, RUBRIC, RUBRIC_VERSION } from "../rubric";

describe("rubric", () => {
  it("has 4 criteria x 5 levels = 20 non-empty descriptors", () => {
    expect(RUBRIC).toHaveLength(4);
    const descriptors = RUBRIC.flatMap((c) => ([1, 2, 3, 4, 5] as const).map((n) => c.levels[n]));
    expect(descriptors).toHaveLength(20);
    expect(descriptors.every((d) => d.trim().length > 0)).toBe(true);
    expect(new Set(descriptors).size).toBe(20);
  });

  it("matches CRITERION_IDS and carries a version", () => {
    expect(RUBRIC.map((c) => c.id)).toEqual([...CRITERION_IDS]);
    expect(RUBRIC_VERSION).toMatch(/^v\d/);
  });
});

describe("buildScoringPrompt", () => {
  const built = buildScoringPrompt({ question: "Why this program?", transcript: "Because I like robotics a lot." });

  it("includes every fairness rule, every criterion id and the insufficient-evidence option", () => {
    for (const rule of FAIRNESS_RULES) expect(built.system).toContain(rule);
    for (const id of CRITERION_IDS) expect(built.user).toContain(`"${id}"`);
    expect(built.user).toContain("null");
  });

  it("wraps question and transcript in delimiters", () => {
    expect(built.user).toContain("<question>\nWhy this program?\n</question>");
    expect(built.user).toContain("<transcript>\nBecause I like robotics a lot.\n</transcript>");
  });

  it("lists low-confidence passages only when present", () => {
    expect(built.user).not.toContain("unsure about");
    const withSpans = buildScoringPrompt({
      question: "q",
      transcript: "t",
      lowConfidenceSpans: ["robo tics club"],
    });
    expect(withSpans.user).toContain("robo tics club");
  });
});
