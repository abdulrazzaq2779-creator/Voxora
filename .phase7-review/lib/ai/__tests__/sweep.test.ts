import { describe, expect, it, vi } from "vitest";
import type { RunPipelineResult } from "../run-pipeline";
import { sweep } from "../sweep";

const completed: RunPipelineResult = { outcome: "completed", status: "completed", stagesRun: ["scoring"] };

describe("sweep", () => {
  it("runs due responses one after another and tallies the outcomes", async () => {
    const outcomes: RunPipelineResult[] = [
      completed,
      { outcome: "skipped", reason: "already_running" },
      { outcome: "deferred", status: "transcribed", stagesRun: ["transcription"], reason: "time_budget" },
      {
        outcome: "failed",
        status: "failed_retryable",
        error: { code: "RATE_LIMITED", message: "x", retryable: true },
        failedStage: "scoring",
        stagesRun: [],
        retryCount: 1,
        nextRetryAt: null,
        statusPersisted: true,
      },
    ];
    const run = vi.fn();
    outcomes.forEach((o) => run.mockResolvedValueOnce(o));
    const summary = await sweep({ findDue: async () => ["a", "b", "c", "d"], run, now: () => 0 }, { limit: 4 });

    expect(run.mock.calls.map((c) => c[0])).toEqual(["a", "b", "c", "d"]);
    expect(summary).toMatchObject({ found: 4, attempted: 4, completed: 1, skipped: 1, deferred: 1, failed: 1, leftForNext: 0 });
  });

  it("passes the sweep deadline to every run", async () => {
    const run = vi.fn().mockResolvedValue(completed);
    await sweep({ findDue: async () => ["a"], run, now: () => 1000 }, { budgetMs: 50_000 });
    expect(run).toHaveBeenCalledWith("a", { deadline: 51_000 });
  });

  it("stops starting new responses when the time budget is nearly used up", async () => {
    let clock = 0;
    const run = vi.fn().mockImplementation(async () => {
      clock += 30_000; // each response takes 30 s
      return completed;
    });
    const summary = await sweep(
      { findDue: async () => ["a", "b", "c"], run, now: () => clock },
      { budgetMs: 50_000, minPerResponseMs: 25_000 },
    );
    expect(run).toHaveBeenCalledTimes(1); // only 20 s left after the first, below the 25 s minimum
    expect(summary).toMatchObject({ attempted: 1, leftForNext: 2 });
  });

  it("does nothing when nothing is due", async () => {
    const run = vi.fn();
    const summary = await sweep({ findDue: async () => [], run });
    expect(run).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ found: 0, attempted: 0 });
  });
});
