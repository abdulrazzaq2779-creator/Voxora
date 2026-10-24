import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("groq-sdk", () => ({
  default: class {
    audio = { transcriptions: { create } };
  },
}));

import { transcribeResponse } from "../pipeline";
import type { TranscriptStore } from "../storage";

const goodResponse = {
  text: "I led a team of four students on a robotics project and we finished on time.",
  language: "english",
  duration: 9,
  segments: [{ start: 0, end: 9, text: "I led a team of four students on a robotics project and we finished on time.", no_speech_prob: 0.01 }],
};

function makeStore() {
  const calls: string[] = [];
  const store: TranscriptStore = {
    saveTranscript: vi.fn(async () => {
      calls.push("save");
    }),
    setStatus: vi.fn(async ({ status }) => {
      calls.push(`status:${status}`);
    }),
  };
  return { store, calls };
}

const fetchAudio = vi.fn(async () => ({ data: new Uint8Array([1, 2, 3, 4]) }));

beforeEach(() => {
  create.mockReset();
  fetchAudio.mockClear();
  process.env.GROQ_API_KEY = "test-key";
});

describe("transcribeResponse", () => {
  it("saves the transcript, then sets status to transcribed", async () => {
    create.mockResolvedValue(goodResponse);
    const { store, calls } = makeStore();

    const result = await transcribeResponse({ responseId: "r1", storagePath: "recordings/a/q1.webm", fetchAudio, store });

    expect(result).toMatchObject({ ok: true, status: "transcribed" });
    expect(calls).toEqual(["save", "status:transcribed"]);
  });

  it("marks silence as needs_manual_review / no_speech_detected without saving a transcript", async () => {
    create.mockResolvedValue({ text: "", segments: [] });
    const { store, calls } = makeStore();

    const result = await transcribeResponse({ responseId: "r2", storagePath: "recordings/a/q2.webm", fetchAudio, store });

    expect(result).toMatchObject({ ok: false, status: "needs_manual_review", reason: "no_speech_detected" });
    expect(calls).toEqual(["status:needs_manual_review"]);
    expect(store.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ responseId: "r2", reason: "no_speech_detected" }),
    );
  });

  it("marks a missing recording as failed_permanent", async () => {
    const missing = vi.fn().mockRejectedValue({ statusCode: "404", message: "not found" });
    const { store } = makeStore();

    const result = await transcribeResponse({ responseId: "r3", storagePath: "recordings/a/gone.webm", fetchAudio: missing, store });

    expect(result).toMatchObject({ ok: false, status: "failed_permanent", error: { code: "BAD_INPUT" } });
  });

  it("reports when even the failure status could not be saved", async () => {
    create.mockResolvedValue({ text: "", segments: [] });
    const { store } = makeStore();
    (store.setStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("db down"));

    const result = await transcribeResponse({ responseId: "r4", storagePath: "recordings/a/q4.webm", fetchAudio, store });

    expect(result).toMatchObject({ ok: false, statusPersisted: false });
  });
});
