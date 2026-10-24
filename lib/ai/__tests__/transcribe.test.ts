import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("groq-sdk", () => ({
  default: class {
    audio = { transcriptions: { create } };
  },
}));

import { transcribeAudio, transcribeFromStorage } from "../transcribe";

const goodResponse = {
  text: "  I led a team of four students on a robotics project and we finished on time.  ",
  language: "english",
  duration: 12.4,
  segments: [
    { start: 0, end: 6, text: " I led a team of four students on a robotics project", no_speech_prob: 0.01, avg_logprob: -0.2 },
    { start: 6, end: 12.4, text: " and we finished on time. ", no_speech_prob: 0.02, avg_logprob: -0.3 },
  ],
};

const audio = new Uint8Array([1, 2, 3, 4]);
const input = { audio, filename: "answer.webm", mimeType: "audio/webm" };

beforeEach(() => {
  create.mockReset();
  process.env.GROQ_API_KEY = "test-key";
  delete process.env.GROQ_WHISPER_MODEL;
  delete process.env.GROQ_WHISPER_LANGUAGE;
  delete process.env.GROQ_WHISPER_PROMPT;
  delete process.env.GROQ_MAX_AUDIO_MB;
});

describe("transcribeAudio", () => {
  it("returns normalized text and segments with sensible defaults", async () => {
    create.mockResolvedValue(goodResponse);
    const out = await transcribeAudio(input);

    expect(out.text).toBe("I led a team of four students on a robotics project and we finished on time.");
    expect(out.segments).toHaveLength(2);
    expect(out.segments[0].text).toBe("I led a team of four students on a robotics project");
    expect(out.durationSeconds).toBe(12.4);
    expect(out.model).toBe("whisper-large-v3-turbo");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "whisper-large-v3-turbo",
        language: "en",
        response_format: "verbose_json",
        temperature: 0,
      }),
    );
  });

  it("omits language when set to auto", async () => {
    create.mockResolvedValue(goodResponse);
    process.env.GROQ_WHISPER_LANGUAGE = "auto";
    await transcribeAudio(input);
    expect(create.mock.calls[0][0]).not.toHaveProperty("language");
  });

  it("passes the vocabulary prompt and model override", async () => {
    create.mockResolvedValue(goodResponse);
    await transcribeAudio({ ...input, prompt: "Robotics, STEM Fellowship", model: "whisper-large-v3" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Robotics, STEM Fellowship", model: "whisper-large-v3" }),
    );
  });

  it("rejects transcripts under 5 words as EMPTY_TRANSCRIPT", async () => {
    create.mockResolvedValue({ text: "Thank you.", segments: [] });
    await expect(transcribeAudio(input)).rejects.toMatchObject({ code: "EMPTY_TRANSCRIPT", retryable: false });
  });

  it("rejects hallucinated text when every segment is almost certainly non-speech", async () => {
    create.mockResolvedValue({
      text: "Thank you for watching this video today",
      segments: [{ start: 0, end: 3, text: "Thank you for watching this video today", no_speech_prob: 0.95 }],
    });
    await expect(transcribeAudio(input)).rejects.toMatchObject({ code: "EMPTY_TRANSCRIPT" });
  });

  it("rejects empty and oversized files as BAD_INPUT without calling Groq", async () => {
    await expect(transcribeAudio({ ...input, audio: new Uint8Array(0) })).rejects.toMatchObject({ code: "BAD_INPUT" });

    process.env.GROQ_MAX_AUDIO_MB = "0.001"; // about 1 KB
    await expect(transcribeAudio({ ...input, audio: new Uint8Array(5000) })).rejects.toMatchObject({
      code: "BAD_INPUT",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("fails fast with CONFIG_MISSING when the key is not set", async () => {
    delete process.env.GROQ_API_KEY;
    await expect(transcribeAudio(input)).rejects.toMatchObject({ code: "CONFIG_MISSING" });
  });
});

describe("transcribeFromStorage", () => {
  it("downloads by path, uses the file name from the path and transcribes", async () => {
    create.mockResolvedValue(goodResponse);
    const fetchAudio = vi.fn().mockResolvedValue({ data: audio });

    const out = await transcribeFromStorage("recordings/attempt-1/q1.webm", { fetchAudio });

    expect(fetchAudio).toHaveBeenCalledWith("recordings/attempt-1/q1.webm");
    expect(create.mock.calls[0][0].file.name).toBe("q1.webm");
    expect(out.text).toContain("robotics project");
  });

  it("treats a missing object (404) as a permanent BAD_INPUT error", async () => {
    const fetchAudio = vi.fn().mockRejectedValue({ statusCode: "404", message: "Object not found" });
    await expect(transcribeFromStorage("recordings/missing.webm", { fetchAudio })).rejects.toMatchObject({
      code: "BAD_INPUT",
      retryable: false,
    });
    expect(fetchAudio).toHaveBeenCalledTimes(1);
  });
});
