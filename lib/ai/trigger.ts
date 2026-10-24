/**
 * Best-effort kick for a response that was just uploaded. The student's submission NEVER waits for it and
 * never fails because of it: the row is already `queued`, and the sweeper picks it up within a minute
 * if this call is lost, times out or the function is cut off.
 */
export async function triggerProcessing(
  responseId: string,
  options: { url?: string; secret?: string; timeoutMs?: number } = {},
): Promise<boolean> {
  const url = options.url ?? process.env.PIPELINE_TRIGGER_URL;
  const secret = options.secret ?? process.env.PIPELINE_SECRET;
  if (!url || !secret) return false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-pipeline-secret": secret },
      body: JSON.stringify({ responseId }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 2000),
    });
    return res.ok;
  } catch {
    return false; // timed out or unreachable: the sweeper will handle it
  }
}
