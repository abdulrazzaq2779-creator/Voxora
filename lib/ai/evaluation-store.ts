import type { PipelineResult } from "./pipeline";
import type { ScoringResult } from "./validate";
import { RUBRIC_VERSION } from "./rubric";
import { PROMPT_VERSION } from "./prompt";
import { calculateOverallScore } from "./evaluation-row";
export function toEvaluationRow(
  responseId: string,
  result: PipelineResult,
) {
  const scoring: ScoringResult | undefined =
    result.ok ? result.scoring : undefined;

  const criterionScore = (id: string): number | null =>
    scoring?.criteria.find((criterion) => criterion.id === id)?.score ?? null;

  const evidence = scoring
    ? {
        summary: scoring.overall_comment,
        strengths: scoring.strengths,
        weaknesses: scoring.weaknesses,
        criteria: scoring.criteria.map((criterion) => ({
          id: criterion.id,
          justification: criterion.justification,
          evidence: criterion.evidence,
        })),
        confidence: scoring.confidence,
        flags: scoring.flags,
        rubric_version: scoring.rubric_version,
        prompt_version: scoring.prompt_version,
      }
    : {
        summary: "",
        strengths: [],
        weaknesses: [],
        criteria: [],
        confidence: "low",
        flags: result.ok ? [] : [result.reason ?? result.error.code],
        rubric_version: RUBRIC_VERSION,
        prompt_version: PROMPT_VERSION,
      };

  const aiStatus = result.ok
    ? "completed"
    : result.status === "failed_permanent"
      ? "failed"
      : result.status;

  return {
    response_id: responseId,
    transcript: result.transcript ?? null,
    criterion_1_score: criterionScore("relevance"),
    criterion_2_score: criterionScore("structure"),
    criterion_3_score: criterionScore("clarity"),
    criterion_4_score: criterionScore("depth"),
    ai_overall_score: scoring ? calculateOverallScore(scoring) : null,
    ai_status: aiStatus,
    error_message: result.ok
      ? null
      : result.reason === "no_speech_detected"
        ? "no_speech_detected"
        : result.error.message,
    ai_evidence: evidence,
  };
}