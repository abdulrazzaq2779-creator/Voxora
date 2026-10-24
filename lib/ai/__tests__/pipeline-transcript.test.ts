import { beforeEach, describe, expect, it, vi } from "vitest";

const { transcribeAudio, scoreTranscript } = vi.hoisted(() => ({
  transcribeAudio: vi.fn(),
  scoreTranscript: vi.fn(),
}));

vi.mock("../transcribe", () => ({ transcribeAudio, transcribeFromStorage: vi.fn() }));
vi.mock("../score", () => ({ scoreTranscript }));

import { processRecording } from "../pipeline";

const scoring = {
  criteria: [],
  overall_comment: "ok",
  strengths: [],
  weaknesses: [],
  confidence: "high",
  flags: [],
  rubric_version: "v1",
  prompt_version: "p2",
};

beforeEach(() => {
  transcribeAudio.mockReset();
  scoreTranscript.mockReset();
  scoreTranscript.mockResolvedValue({ result: scoring, model: "gemini-x" });
});

describe("processRecording with an existing transcript", () => {
  it("never transcribes again, and passes duration and low-confidence passages to scoring", async () => {
    const result = await processRecording({
      question: "Why us?",
      transcript: "  I like robotics and teamwork a lot.  ",
      durationSeconds: 15,
      lowConfidenceSpans: ["robo tics"],
    });

    expect(transcribeAudio).not.toHaveBeenCalled();
    expect(scoreTranscript).toHaveBeenCalledWith({
      question: "Why us?",
      transcript: "I like robotics and teamwork a lot.",
      durationSeconds: 15,
      lowConfidenceSpans: ["robo tics"],
    });
    expect(result).toMatchObject({ ok: true, status: "scored", meta: { durationSeconds: 15 } });
  });

  it("keeps the transcript on the failure so it can still be saved", async () => {
    scoreTranscript.mockRejectedValue({ status: 429, message: "slow down" });
    const result = await processRecording({ question: "q", transcript: "my saved transcript text here" });
    expect(result).toMatchObject({ ok: false, status: "failed_retryable", transcript: "my saved transcript text here" });
  });
});
