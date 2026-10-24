export type InterviewStatus = "active" | "draft" | "closed";
export type ReviewStatus = "pending" | "in-review" | "reviewed";
export type CandidateStatus =
  | "Invited"
  | "In progress"
  | "Completed"
  | "Pending review"
  | "Reviewed"
  | "Withdrawn";

export type QuestionCategory = "technical" | "behavioral" | "situational";

export interface Question {
  id: string;
  category: QuestionCategory;
  prompt: string;
  prepSeconds: number;
  recordingLimitSeconds: number;
}

export interface Interview {
  id: string;
  title: string;
  role: string;
  createdAt: string;
  candidateCount: number;
  completed: number;
  status: InterviewStatus;
  reviewStatus: ReviewStatus;
  durationMinutes: number;
  questions: Question[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  interviewId: string;
  status: CandidateStatus;
  reviewStatus: ReviewStatus;
  completedAt?: string;
  score?: number | null;
  avatarColor: string;
}

export interface Evidence {
  quote: string;
  at: string;
}

export interface AnswerSummary {
  headline: string;
  bullets: string[];
  evidence: Evidence[];
  strengths: string[];
  clarify: string[];
}

export interface LibraryQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  roleTag: string;
  uses: number;
}
