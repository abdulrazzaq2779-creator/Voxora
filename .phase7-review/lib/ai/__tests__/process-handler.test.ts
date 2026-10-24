import { describe, expect, it, vi } from "vitest";
import { handleProcess, handleSweep, isAuthorized, responseIdFromBody } from "../process-handler";
import type { RunPipelineResult } from "../run-pipeline";

const ID = "00000000-0000-0000-0000-000000000001";
const SECRET = "s3cret-value";
const completed: RunPipelineResult = { outcome: "completed", status: "completed", stagesRun: ["transcription", "scoring"] };

const post = (body: unknown, headers: Record<string, string> = { "x-pipeline-secret": SECRET }) =>
  new Request("http://localhost/api/process", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });

function deps(run = vi.fn().mockResolvedValue(completed)) {
  return { secret: SECRET, ensure: vi.fn().mockResolvedValue(undefined), run, now: () => 1000, budgetMs: 50_000 };
}

describe("isAuthorized", () => {
  it("accepts the secret in the header or as a bearer token", () => {
    expect(isAuthorized(post({}), SECRET)).toBe(true);
    expect(isAuthorized(post({}, { authorization: `Bearer ${SECRET}` }), SECRET)).toBe(true);
  });
  it("rejects wrong, missing and unconfigured secrets", () => {
    expect(isAuthorized(post({}, { "x-pipeline-secret": "nope" }), SECRET)).toBe(false);
    expect(isAuthorized(post({}, {}), SECRET)).toBe(false);
    expect(isAuthorized(post({}), undefined)).toBe(false);
    expect(isAuthorized(post({}, { "x-pipeline-secret": "" }), "")).toBe(false);
  });
});

describe("responseIdFromBody", () => {
  it("reads responseId or a Supabase webhook record", () => {
    expect(responseIdFromBody({ responseId: ID })).toBe(ID);
    expect(responseIdFromBody({ type: "INSERT", table: "student_responses", record: { id: ID } })).toBe(ID);
  });
  it("rejects anything that is not a uuid", () => {
    expect(responseIdFromBody({ responseId: "1; drop table" })).toBeNull();
    expect(responseIdFromBody(null)).toBeNull();
    expect(responseIdFromBody({})).toBeNull();
  });
});

describe("handleProcess", () => {
  it("returns 401 without the secret and does no work", async () => {
    const d = deps();
    const res = await handleProcess(post({ responseId: ID }, {}), d);
    expect(res.status).toBe(401);
    expect(d.ensure).not.toHaveBeenCalled();
    expect(d.run).not.toHaveBeenCalled();
  });

  it("returns 400 for a bad body or id", async () => {
    expect((await handleProcess(post("not json"), deps())).status).toBe(400);
    expect((await handleProcess(post({ responseId: "x" }), deps())).status).toBe(400);
  });

  it("ensures the row, runs the pipeline with a deadline and returns the outcome", async () => {
    const d = deps();
    const res = await handleProcess(post({ responseId: ID }), d);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ responseId: ID, outcome: "completed" });
    expect(d.ensure).toHaveBeenCalledWith(ID);
    expect(d.run).toHaveBeenCalledWith(ID, { deadline: 51_000 });
  });

  it("treats a recorded failure as a normal 200 so webhooks do not retry it", async () => {
    const failed: RunPipelineResult = {
      outcome: "failed",
      status: "failed_retryable",
      error: { code: "RATE_LIMITED", message: "x", retryable: true },
      failedStage: "scoring",
      stagesRun: [],
      retryCount: 1,
      nextRetryAt: null,
      statusPersisted: true,
    };
    expect((await handleProcess(post({ responseId: ID }), deps(vi.fn().mockResolvedValue(failed)))).status).toBe(200);
  });

  it("returns 500 when the failure could not even be recorded, so the caller retries", async () => {
    const lost: RunPipelineResult = {
      outcome: "failed",
      status: "failed",
      error: { code: "UNKNOWN", message: "x", retryable: false },
      failedStage: "scoring",
      stagesRun: [],
      retryCount: 0,
      nextRetryAt: null,
      statusPersisted: false,
    };
    expect((await handleProcess(post({ responseId: ID }), deps(vi.fn().mockResolvedValue(lost)))).status).toBe(500);
  });
});

describe("handleSweep", () => {
  it("requires the secret", async () => {
    const res = await handleSweep(post({}, {}), { secret: SECRET, findDue: async () => [], run: vi.fn() });
    expect(res.status).toBe(401);
  });

  it("returns a summary of what it processed", async () => {
    const run = vi.fn().mockResolvedValue(completed);
    const res = await handleSweep(post({}), { secret: SECRET, findDue: async () => [ID], run, now: () => 0 });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ found: 1, attempted: 1, completed: 1 });
  });
});
