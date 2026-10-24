import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { InterviewWizard } from "@/components/interviews/wizard";

export const metadata: Metadata = {
  title: "New interview",
  description:
    "Four-step wizard to structure a video interview: details, questions, timing, and review.",
};

export default function NewInterviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title="Create a new interview"
        description="Structure the questions, timing, and expectations before inviting any candidates."
      />
      <InterviewWizard />
    </div>
  );
}
