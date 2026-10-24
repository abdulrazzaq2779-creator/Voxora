import { describe, expect, it, vi } from "vitest";
import { AIError } from "../errors";
import { planFailure, runPipeline, MAX_ATTEMPTS } from "../run-pipeline";
import type { TranscribeOutput } from "../transcribe";
import { MemoryStore } from "./helpers/memory-store";

const T0 = new Date("2026-10-24T10:00:00.000Z");
const at = (ms: number) => new Date(T0.getTime() + ms);

const transcription: TranscribeOutput = {
  text: "I led a team of four students on a robotics project and we finished on time.",
  segments: [{ start: 0, end: 5, text: "I led a team", avgLogprob: -0.2 }],
  model: "whisper-x",
  durationSeconds: 12,
};
const scored = { result: { criteria: [], rubric_version: "v1", prompt_version: "p2" } as any, model: "gemini-x" };

function setup(seed: Parameters<MemoryStore["seed"]>[1] = {}, id = "resp-1") {
  const store = new MemoryStore();
  store.now = () => T0;
  store.seed(id, seed);
  const transcribe = vi.fn().mockResolvedValue(transcription);
  const score = vi.fn().mockResolvedValue(scored);
  const run = (extra: Record<string, unknown> = {}, responseId = id) =>
    runPipeline(responseId, { store, fetchAudio: vi.fn(), transcribe, score, now: () => store.now(), ...extra } as any);
  return { store, transcribe, score, run, row: () => store.rows.get(id)! };
}

describe("runPipeline stages", () => {
  it("runs both stages and writes every status in order", async () => {
    const { store, run, row, transcribe, score } = setup();
    const result = await run();
    expect(result).toEqual({ outcome: "completed", status: "completed", stagesRun: ["transcription", "scoring"] });
    expect(store.log).toEqual(["transcribing", "transcribed", "scoring", "completed"]);
    expect(row().transcript).toBe(transcription.text);
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(score).toHaveBeenCalledWith(expect.objectContaining({ transcript: transcription.text, durationSeconds: 15 }));
  });

  it("skips transcription when a transcript is already saved", async () => {
    const { run, transcribe, score, row } = setup({ status: "failed_retryable", transcript: "saved earlier text here", retryCount: 1 });
    const result = await run();
    expect(result).toMatchObject({ outcome: "completed", stagesRun: ["scoring"] });
    expect(transcribe).not.toHaveBeenCalled();
    expect(score).toHaveBeenCalledWith(expect.objectContaining({ transcript: "saved earlier text here" }));
    expect(row().retryCount).toBe(1);
  });

  it("re-transcribes only when forced", async () => {
    const { run, transcribe } = setup({ status: "failed", transcript: "old text of the answer here" });
    await run({ trigger: "admin", retranscribe: true });
    expect(transcribe).toHaveBeenCalledTimes(1);
  });
});

describe("failure handling", () => {
  it("a scoring failure keeps the transcript, counts the retry and schedules the next run; the next run only scores", async () => {
    const { store, run, row, transcribe, score } = setup();
    score.mockRejectedValueOnce({ status: 429, message: "slow down" });

    const first = await run();
    expect(first).toMatchObject({
      outcome: "failed",
      status: "failed_retryable",
      failedStage: "scoring",
      retryCount: 1,
      nextRetryAt: at(30_000).toISOString(),
      statusPersisted: true,
    });
    expect(row().transcript).toBe(transcription.text);
    expect(row().lastErrorCode).toBe("RATE_LIMITED");

    // Too early: refused. After the delay: only scoring runs, Groq is not called again.
    expect(await run()).toEqual({ outcome: "skipped", reason: "not_due" });
    store.now = () => at(31_000);
    const second = await run();
    expect(second).toMatchObject({ outcome: "completed", stagesRun: ["scoring"] });
    expect(transcribe).toHaveBeenCalledTimes(1);
  });

  it("uses the longer delay after the second failure and gives up on the third", async () => {
    expect(planFailure(new AIError("x", "RATE_LIMITED", "scoring", true), 1, T0)).toMatchObject({
      status: "failed_retryable",
      retryCount: 2,
      nextRetryAt: at(120_000).toISOString(),
    });
    expect(planFailure(new AIError("x", "RATE_LIMITED", "scoring", true), MAX_ATTEMPTS - 1, T0)).toEqual({
      status: "failed",
      reason: "retries_exhausted",
      retryCount: MAX_ATTEMPTS,
      nextRetryAt: null,
    });
  });

  it("silence goes to manual review without touching the retry count or the LLM", async () => {
    const { run, row, score, transcribe } = setup();
    transcribe.mockRejectedValue(new AIError("No speech", "EMPTY_TRANSCRIPT", "transcription", false));
    const result = await run();
    expect(result).toMatchObject({ outcome: "failed", status: "needs_manual_review", reason: "no_speech_detected", retryCount: 0 });
    expect(score).not.toHaveBeenCalled();
    expect(row().lastError).toContain("no_speech_detected");
  });

  it("a permanent error (bad key) is not scheduled for retry", async () => {
    const { run, score } = setup({ transcript: "saved earlier text here", status: "transcribed" });
    score.mockRejectedValue({ status: 401, message: "bad key" });
    expect(await run()).toMatchObject({ status: "failed", nextRetryAt: null, retryCount: 0, error: { code: "AUTH" } });
  });

  it("a response whose question is missing fails as BAD_INPUT before any API call", async () => {
    const { run, transcribe } = setup({ question: null });
    expect(await run()).toMatchObject({ outcome: "failed", status: "failed", error: { code: "BAD_INPUT" } });
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("never throws, even when the failure cannot be saved", async () => {
    const { store, run } = setup();
    store.failMarkFailed = true;
    store.rows.get("resp-1")!.question = null;
    expect(await run()).toMatchObject({ outcome: "failed", statusPersisted: false });
  });
});

describe("claiming and idempotency", () => {
  it("only one of two simultaneous runs processes the response", async () => {
    const { run, transcribe, store } = setup();
    const [a, b] = await Promise.all([run(), run()]);
    expect([a.outcome, b.outcome].sort()).toEqual(["completed", "skipped"]);
    expect([a, b].find((r) => r.outcome === "skipped")).toMatchObject({ reason: "already_running" });
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(store.rows.size).toBe(1);
  });

  it("refuses completed, failed (automatic) and missing responses", async () => {
    expect(await setup({ status: "completed" }).run()).toEqual({ outcome: "skipped", reason: "already_completed" });
    expect(await setup({ status: "failed" }).run()).toEqual({ outcome: "skipped", reason: "not_claimable" });
    expect(await setup({ status: "needs_manual_review" }).run()).toEqual({ outcome: "skipped", reason: "not_claimable" });
    expect(await setup().run({}, "does-not-exist")).toEqual({ outcome: "skipped", reason: "not_found" });
  });

  it("takes over a run that crashed (stale transcribing/scoring), but not a fresh one", async () => {
    const stale = setup({ status: "scoring", transcript: "saved earlier text here", statusChangedAt: at(-11 * 60_000) });
    expect(await stale.run()).toMatchObject({ outcome: "completed" });

    const fresh = setup({ status: "scoring", statusChangedAt: at(-60_000) });
    expect(await fresh.run()).toEqual({ outcome: "skipped", reason: "already_running" });
  });

  it("an admin retry resets the retry count and reruns a failed response; re-running keeps a single row", async () => {
    const { store, run, row } = setup({ status: "failed", retryCount: 3, transcript: "saved earlier text here" });
    const result = await run({ trigger: "admin" });
    expect(result).toMatchObject({ outcome: "completed", stagesRun: ["scoring"] });
    expect(row().retryCount).toBe(0);

    // Re-running a completed response overwrites it; there is still exactly one row.
    await run({ trigger: "admin" });
    expect(store.rows.size).toBe(1);
    expect(row().status).toBe("completed");
  });

  it("an admin cannot start a second run while one is active", async () => {
    const { run } = setup({ status: "transcribing", statusChangedAt: at(-1_000) });
    expect(await run({ trigger: "admin" })).toEqual({ outcome: "skipped", reason: "already_running" });
  });
});

describe("time budget (serverless limit)", () => {
  it("stops after transcription when scoring cannot finish in time, and the next run only scores", async () => {
    const { store, run, row, transcribe, score } = setup();
    // The host cuts the run off 10 s from now; scoring needs 20 s.
    const first = await run({ deadline: T0.getTime() + 10_000 });
    expect(first).toEqual({ outcome: "deferred", status: "transcribed", stagesRun: ["transcription"], reason: "time_budget" });
    expect(row().status).toBe("transcribed");
    expect(row().transcript).toBe(transcription.text);
    expect(score).not.toHaveBeenCalled();

    const second = await run({ deadline: T0.getTime() + 60_000 });
    expect(second).toMatchObject({ outcome: "completed", stagesRun: ["scoring"] });
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(store.rows.size).toBe(1);
  });

  it("does not defer when there is enough time", async () => {
    const { run } = setup();
    expect(await run({ deadline: T0.getTime() + 60_000 })).toMatchObject({ outcome: "completed" });
  });

  it("does not defer a scoring-only run (the claim already set the status to scoring)", async () => {
    const { run } = setup({ status: "transcribed", transcript: "saved earlier text here" });
    expect(await run({ deadline: T0.getTime() + 1_000 })).toMatchObject({ outcome: "completed", stagesRun: ["scoring"] });
  });
});
