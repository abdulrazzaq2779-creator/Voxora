/**
 * Word error rate, for comparing Whisper output with what the speaker actually said.
 * Case, punctuation and apostrophes are ignored. Numbers are NOT normalised
 * ("10" vs "ten" counts as an error), so write references the way Whisper would.
 */

export function toWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export interface WerResult {
  /** edits / referenceWords. Can exceed 1 when the hypothesis has many insertions. */
  wer: number;
  edits: number;
  referenceWords: number;
}

/** Levenshtein distance over two word lists (insert, delete or replace = 1), two rolling rows. */
export function editDistance(a: readonly string[], b: readonly string[]): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

export function wordErrorRate(reference: string, hypothesis: string): WerResult {
  const ref = toWords(reference);
  const hyp = toWords(hypothesis);

  if (ref.length === 0) {
    return { wer: hyp.length === 0 ? 0 : 1, edits: hyp.length, referenceWords: 0 };
  }

  const edits = editDistance(ref, hyp);
  return { wer: edits / ref.length, edits, referenceWords: ref.length };
}
