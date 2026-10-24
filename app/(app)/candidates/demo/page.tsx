import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewWorkspace } from "@/components/review/review-workspace";

export const metadata: Metadata = {
  title: "Review workspace",
  description:
    "Review a candidate's answers, transcripts, and sample AI-assisted summaries with evidence.",
};

export default function CandidateReviewPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title="Review workspace"
        description="Play back each answer, read the transcript, and record your own judgment — every AI element is clearly labeled demo content."
      />
      <ReviewWorkspace />
    </div>
  );
}
