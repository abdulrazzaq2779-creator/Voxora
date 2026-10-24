/**
 * Candidate flow stage shared between the portal, the recording page, and the
 * completion page via sessionStorage (demo state in this tab only).
 */
export type CandidateStage = "invited" | "in-progress" | "complete";

const KEY = "vervue:candidate-stage";

export function readStage(): CandidateStage {
  if (typeof window === "undefined") return "invited";
  const v = window.sessionStorage.getItem(KEY);
  return v === "complete" || v === "in-progress" ? v : "invited";
}

export function writeStage(stage: CandidateStage) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, stage);
  } catch {
    /* storage may be unavailable — the demo still works without persistence */
  }
}
