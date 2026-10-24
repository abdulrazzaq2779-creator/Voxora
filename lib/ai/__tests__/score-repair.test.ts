import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { CRITERION_IDS } from "../rubric";
import { MAX_REPAIR_ATTEMPTS, scoreTranscript } from "../score";

const transcript =
  "I led a team of four students on a robotics project and we finished on time after reorganising the tasks. " +
  "It taught me to split big goals into small weekly targets and to check in with everyone regularly so problems show up early.";

function reply(overrides: Record<string, unknown> = {}, quote = "I led a team of four students") {
  return {
    text: JSON.stringify({
      criteria: CRITERION_IDS.map((id) => ({ id, score: 4, justification: "ok", evidence: [quote] })),
      overall_comment: "Good.",
      strengths: [],
      weaknesses: [],
      confidence: "high",
      flags: [],
      ...overrides,
    }),
  };
}

const input = { question: "Describe a project.", transcript };
const sentPrompt = (call: number) => generateContent.mock.calls[call][0].contents as string;

beforeEach(() => {
  generateContent.mockReset();
  process.env.GOOGLE_AI_API_KEY = "test-key";
});

describe("scoreTranscript repair loop", () => {
  it("accepts a valid response on the first call", async () => {
    generateContent.mockResolvedValueOnce(reply());
    const out = await scoreTranscript(input);
    expect(out.attempts).toBe(1);
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(out.result.flags).not.toContain("unverified_evidence");
    expect(out.result.unverified_evidence).toEqual([]);
  });

  it("retries invalid JSON and tells the model what was wrong", async () => {
    generateContent.mockResolvedValueOnce({ text: "Sure! Here are the scores" }).mockResolvedValueOnce(reply());
    const out = await scoreTranscript(input);
    expect(out.attempts).toBe(2);
    expect(sentPrompt(1)).toContain("was not valid JSON");
    expect(sentPrompt(1)).toContain("<previous_response>");
  });

  it("retries a schema error (score out of range) with the validation message", async () => {
    const bad = reply();
    const parsed = JSON.parse(bad.text);
    parsed.criteria[0].score = 9;
    generateContent.mockResolvedValueOnce({ text: JSON.stringify(parsed) }).mockResolvedValueOnce(reply());
    const out = await scoreTranscript(input);
    expect(out.attempts).toBe(2);
    expect(sentPrompt(1)).toContain("failed schema validation");
  });

  it("retries once when a quote is not in the transcript, naming the quote", async () => {
    generateContent.mockResolvedValueOnce(reply({}, "I won a national award for leadership")).mockResolvedValueOnce(reply());
    const out = await scoreTranscript(input);
    expect(out.attempts).toBe(2);
    expect(sentPrompt(1)).toContain('The quote "I won a national award for leadership"');
    expect(out.result.flags).not.toContain("unverified_evidence");
  });

  it("flags unverified_evidence after the single evidence retry instead of accepting silently", async () => {
    generateContent.mockResolvedValue(reply({}, "I won a national award for leadership"));
    const out = await scoreTranscript(input);
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(out.result.flags).toContain("unverified_evidence");
    expect(out.result.confidence).toBe("low");
    expect(out.result.unverified_evidence).toHaveLength(CRITERION_IDS.length);
  });

  it("throws SCORING_FAILED after the repair attempts are used up", async () => {
    generateContent.mockResolvedValue({ text: "not json" });
    await expect(scoreTranscript(input)).rejects.toMatchObject({ code: "SCORING_FAILED", retryable: false });
    expect(generateContent).toHaveBeenCalledTimes(MAX_REPAIR_ATTEMPTS + 1);
  });

  it("caps and flags perfect scores on a very short answer", async () => {
    const short = "I solved it by working hard with my team.";
    generateContent.mockResolvedValueOnce(
      reply(
        {
          criteria: CRITERION_IDS.map((id) => ({ id, score: 5, justification: "ok", evidence: [short] })),
        },
        short,
      ),
    );
    const out = await scoreTranscript({ question: "q", transcript: short });
    expect(out.result.criteria.map((c) => c.score)).toEqual([3, 3, 3, 3]);
    expect(out.result.flags).toEqual(expect.arrayContaining(["score_capped", "suspicious_scores", "short_answer"]));
    expect(out.result.adjustments).toHaveLength(4);
  });

  it("ignores code-only flags that the model tries to set", async () => {
    generateContent.mockResolvedValueOnce(reply({ flags: ["unverified_evidence", "suspicious_scores", "off_topic"] }));
    const out = await scoreTranscript(input);
    expect(out.result.flags).toEqual(["off_topic"]);
  });
});
