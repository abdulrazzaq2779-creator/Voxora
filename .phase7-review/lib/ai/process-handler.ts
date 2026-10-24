/**
 * Request handlers behind the API routes, written with the standard Request/Response types so they can be
 * unit-tested and used from any host. Only trusted callers (your own server code, a Supabase webhook,
 * cron) may call them: every request must carry the shared secret.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import type { RunPipelineResult } from "./run-pipeline";
import { sweep, type SweepDeps, type SweepOptions } from "./sweep";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Secret from the `x-pipeline-secret` header or `Authorization: Bearer <secret>`, compared in constant time. */
export function isAuthorized(req: Request, secret: string | undefined): boolean {
  if (!secret) return false; // a missing secret must never mean "open to everyone"
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const provided = req.headers.get("x-pipeline-secret") ?? bearer;
  if (!provided) return false;
  return timingSafeEqual(digest(provided), digest(secret));
}

/** The response id from `{ responseId }` (own code) or a Supabase database webhook payload (`record.id`). */
export function responseIdFromBody(body: unknown): string | null {
  const b = body as { responseId?: unknown; record?: { id?: unknown } } | null;
  const candidate = b?.responseId ?? b?.record?.id;
  return typeof candidate === "string" && UUID.test(candidate) ? candidate : null;
}

export interface ProcessDeps {
  secret: string | undefined;
  /** Create the `queued` evaluation row if it does not exist yet. */
  ensure(responseId: string): Promise<void>;
  run(responseId: string, options: { deadline: number }): Promise<RunPipelineResult>;
  /** Time budget for one request, below the function's time limit. Default 50 s. */
  budgetMs?: number;
  now?: () => number;
}

/** POST /api/process  { responseId }  (or a database webhook payload) */
export async function handleProcess(req: Request, deps: ProcessDeps): Promise<Response> {
  if (!isAuthorized(req, deps.secret)) return json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const responseId = responseIdFromBody(body);
  if (!responseId) return json({ error: "a valid responseId is required" }, 400);

  const now = deps.now ?? Date.now;
  try {
    await deps.ensure(responseId);
    const result = await deps.run(responseId, { deadline: now() + (deps.budgetMs ?? 50_000) });
    // 500 only when the failure itself could not be recorded, so the caller (webhook) retries.
    // A recorded failure is a normal outcome and returns 200.
    if (result.outcome === "failed" && !result.statusPersisted) return json({ responseId, ...result }, 500);
    return json({ responseId, ...result });
  } catch (err) {
    return json({ responseId, error: err instanceof Error ? err.message : String(err) }, 500);
  }
}

export interface SweepHandlerDeps extends Pick<SweepDeps, "findDue" | "run"> {
  secret: string | undefined;
  options?: SweepOptions;
  now?: () => number;
}

/** POST or GET /api/cron/sweep */
export async function handleSweep(req: Request, deps: SweepHandlerDeps): Promise<Response> {
  if (!isAuthorized(req, deps.secret)) return json({ error: "unauthorized" }, 401);
  try {
    const summary = await sweep({ findDue: deps.findDue, run: deps.run, now: deps.now }, deps.options);
    return json(summary);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
}
