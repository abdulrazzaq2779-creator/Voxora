import { CRITERION_IDS, MODEL_FLAGS } from "./rubric";

/**
 * JSON Schema sent to Gemini as its structured-output response schema, so the model is
 * constrained to this shape. The zod schema in validate.ts is still the source of truth:
 * Gemini's schema support is a subset of JSON Schema, and the evidence check cannot be
 * expressed in a schema.
 *
 * Within each criterion, evidence and justification come BEFORE the score on purpose, so the
 * model writes its reasoning before committing to a number.
 */
export const SCORING_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    criteria: {
      type: "array",
      minItems: CRITERION_IDS.length,
      maxItems: CRITERION_IDS.length,
      items: {
        type: "object",
        properties: {
          id: { type: "string", enum: [...CRITERION_IDS] },
          evidence: { type: "array", items: { type: "string" }, maxItems: 3 },
          justification: { type: "string" },
          score: { type: ["integer", "null"], minimum: 1, maximum: 5 },
        },
        required: ["id", "evidence", "justification", "score"],
      },
    },
    overall_comment: { type: "string" },
    strengths: { type: "array", items: { type: "string" }, maxItems: 5 },
    weaknesses: { type: "array", items: { type: "string" }, maxItems: 5 },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    flags: { type: "array", items: { type: "string", enum: [...MODEL_FLAGS] } },
  },
  required: ["criteria", "overall_comment", "strengths", "weaknesses", "confidence", "flags"],
} as const;
