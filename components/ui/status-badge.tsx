import type { CandidateStatus, ReviewStatus } from "@/lib/types";
import { Badge, type BadgeTone } from "./badge";

const candidateTones: Record<CandidateStatus, BadgeTone> = {
  Invited: "outline",
  "In progress": "accent",
  Completed: "neutral",
  "Pending review": "amber",
  Reviewed: "success",
  Withdrawn: "neutral",
};

const reviewTones: Record<ReviewStatus, BadgeTone> = {
  pending: "amber",
  "in-review": "accent",
  reviewed: "success",
};

export function CandidateBadge({ status }: { status: CandidateStatus }) {
  return <Badge tone={candidateTones[status]}>{status}</Badge>;
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  return <Badge tone={reviewTones[status]}>{status}</Badge>;
}
