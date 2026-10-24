/**
 * Scoring rubric: four criteria, each scored 1-5, with anchor descriptors for every level.
 *
 * STATUS: DRAFT. Get this wording approved by whoever owns the interview criteria
 * (faculty / admin), then change RUBRIC_VERSION from "v1-draft" to "v1".
 * Any later wording change must bump the version ("v2", ...). The version is stored
 * with every evaluation so old scores stay interpretable.
 */

export const RUBRIC_VERSION = "v1-draft";

export const CRITERION_IDS = ["relevance", "structure", "clarity", "depth"] as const;

export type CriterionId = (typeof CRITERION_IDS)[number];
export type ScoreLevel = 1 | 2 | 3 | 4 | 5;

export interface Criterion {
  id: CriterionId;
  name: string;
  measures: string;
  levels: Record<ScoreLevel, string>;
}

export const RUBRIC: readonly Criterion[] = [
  {
    id: "relevance",
    name: "Relevance and content",
    measures: "Does the answer address the question with substance?",
    levels: {
      1: "Off-topic, or does not attempt the question.",
      2: "Only loosely related to the question; most of the answer does not address what was asked.",
      3: "Addresses the question partially, with some drift away from it or parts of the question left unanswered.",
      4: "Addresses the question directly, with only minor gaps or small digressions.",
      5: "Fully and directly addresses every part of the question; nothing important is missing.",
    },
  },
  {
    id: "structure",
    name: "Structure and coherence",
    measures: "Is it organized, with a clear beginning, development and conclusion?",
    levels: {
      1: "No discernible organization; ideas are disconnected or fragmentary.",
      2: "Weak organization; ideas jump around, and the opening or ending is missing.",
      3: "Some structure is visible, but the flow is uneven, with abrupt jumps or an underdeveloped opening or ending.",
      4: "Clearly organized, with logical progression from start to finish; minor lapses in flow.",
      5: "Very well organized: a clear opening, ideas that build logically with smooth transitions, and a clear conclusion.",
    },
  },
  {
    id: "clarity",
    name: "Clarity of expression",
    measures: "Are the ideas understandable and the language precise?",
    levels: {
      1: "The meaning cannot be followed.",
      2: "The meaning is often unclear or vague; the listener must guess what is meant.",
      3: "The main ideas can be understood, but some points are vague, imprecise or repetitive.",
      4: "Ideas are clear and expressed with generally precise wording.",
      5: "Ideas are consistently clear, precise and easy to follow, with well-chosen wording.",
    },
  },
  {
    id: "depth",
    name: "Depth and examples",
    measures: "Are there specific examples, reasoning or evidence rather than generalities?",
    levels: {
      1: "No reasoning or examples; only bare statements.",
      2: "Mostly generalities, with at most a passing mention of an example or reason.",
      3: "Some reasoning or a basic example, but it is thin, generic or not fully explained.",
      4: "Specific examples or sound reasoning that support the main points, with some detail.",
      5: "Rich, specific examples and well-developed reasoning that clearly support every main point; shows insight.",
    },
  },
] as const;

/** Fairness rules. These are inserted verbatim into the scoring prompt. */
export const FAIRNESS_RULES: readonly string[] = [
  "Score only what is in the transcript. Do not infer or comment on confidence, body language, tone of voice, appearance or personality.",
  "Do not penalize accent, dialect or minor grammar slips that do not affect meaning.",
  "The transcript was produced by speech recognition and may contain errors. Do not lower a score because a phrase looks garbled or odd; instead add the flag \"possible_transcription_issues\" and lower your confidence.",
  "Do not infer anything from the speaker's name, gender, nationality or any other personal trait.",
  "If the transcript does not contain enough evidence to judge a criterion, set that criterion's score to null and explain why. Do not guess.",
];

/** Flags the model may return, and the ones the code adds itself. */
export const KNOWN_FLAGS = [
  "short_answer",
  "possible_transcription_issues",
  "insufficient_evidence",
  "off_topic",
  // Set by code only (never trusted from the model):
  "unverified_evidence",
  "suspicious_scores",
  "score_capped",
] as const;

export type Flag = (typeof KNOWN_FLAGS)[number];

/** Flags only our own checks may set. They are removed from model output and re-added by code. */
export const CODE_ONLY_FLAGS: readonly Flag[] = ["unverified_evidence", "suspicious_scores", "score_capped"];

/** Flags the model may return (and that are shown to it in the prompt). */
export const MODEL_FLAGS: readonly Flag[] = KNOWN_FLAGS.filter((f) => !CODE_ONLY_FLAGS.includes(f));

/** Answers shorter than this many words get the "short_answer" flag (added by code, not the model). */
export const SHORT_ANSWER_WORDS = 40;

/** Answers shorter than this are too thin to earn high scores: every score is capped. */
export const VERY_SHORT_ANSWER_WORDS = 15;
export const VERY_SHORT_SCORE_CAP = 3;
