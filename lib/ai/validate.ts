import { z } from "zod";
import type { EvidenceIssue, ScoreAdjustment } from "./checks";
import { AIError } from "./errors";
import { CRITERION_IDS, MODEL_FLAGS, type Flag } from "./rubric";

// Evidence and sanity checks live in checks.ts (no schema library needed); re-exported for callers.
export { addDerivedFlags, assertEvidence, checkEvidence, type EvidenceIssue, type ScoreAdjustment } from "./checks";

const MODEL_FLAG_SET: ReadonlySet<string> = new Set(MODEL_FLAGS);

export const MAX_JUSTIFICATION_CHARS = 600;
export const MAX_QUOTE_CHARS = 400;

export const CriterionResultSchema = z
  .object({
    id: z.enum(CRITERION_IDS),
    /** null = insufficient evidence to judge this criterion */
    score: z.number().int().min(1).max(5).nullable(),
    justification: z.string().trim().min(1).max(MAX_JUSTIFICATION_CHARS),
    // 1 to 3 quotes per scored criterion; may be empty only when score is null.
    evidence: z.array(z.string().trim().min(1).max(MAX_QUOTE_CHARS)).max(3),
  })
  .superRefine((value, ctx) => {
    if (value.score !== null && value.evidence.length === 0) {
      ctx.addIssue({ code: "custom", path: ["evidence"], message: "A scored criterion needs at least one evidence quote" });
    }
  });

/** Shape the LLM must return. rubric_version is added by our code, not trusted from the model. */
export const ScoringOutputSchema = z
  .object({
    criteria: z.array(CriterionResultSchema).length(CRITERION_IDS.length),
    overall_comment: z.string().trim().min(1),
    // Short reviewer-facing phrases; optional so a model that skips them does not fail the whole response.
    strengths: z.array(z.string().trim().min(1)).max(5).default([]),
    weaknesses: z.array(z.string().trim().min(1)).max(5).default([]),
    confidence: z.enum(["high", "medium", "low"]),
    // Unknown flags, and flags only our code may set, are dropped instead of failing the response.
    flags: z
      .array(z.string())
      .default([])
      .transform((flags) => [...new Set(flags.filter((f): f is Flag => MODEL_FLAG_SET.has(f)))]),
  })
  .superRefine((value, ctx) => {
    const seen = new Set(value.criteria.map((c) => c.id));
    for (const id of CRITERION_IDS) {
      if (!seen.has(id)) ctx.addIssue({ code: "custom", message: `Missing criterion: ${id}` });
    }
    if (seen.size !== value.criteria.length) {
      ctx.addIssue({ code: "custom", message: "Duplicate criterion id" });
    }
  });

export type CriterionResult = z.infer<typeof CriterionResultSchema>;
export type ScoringOutput = z.infer<typeof ScoringOutputSchema>;

/** Final stored/returned result. */
export type ScoringResult = ScoringOutput & {
  rubric_version: string;
  prompt_version: string;
  /** Quotes that could not be found in the transcript (the result is also flagged "unverified_evidence"). */
  unverified_evidence?: EvidenceIssue[];
  /** Scores changed by the sanity rules (original and new value). */
  adjustments?: ScoreAdjustment[];
};

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1] : trimmed;
}

/** Parse and schema-validate raw LLM text. Throws an INVALID_OUTPUT AIError describing what is wrong. */
export function parseScoringJson(raw: string): ScoringOutput {
  let json: unknown;
  try {
    json = JSON.parse(stripCodeFence(raw));
  } catch (cause) {
    throw new AIError("The response was not valid JSON", "INVALID_OUTPUT", "scoring", true, { cause });
  }

  const parsed = ScoringOutputSchema.safeParse(json);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    throw new AIError(`The response failed schema validation: ${detail}`, "INVALID_OUTPUT", "scoring", true, {
      cause: parsed.error,
    });
  }
  return parsed.data;
}
