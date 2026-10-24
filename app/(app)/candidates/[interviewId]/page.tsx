import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewWorkspace } from "@/components/review/review-workspace";
import { INTERVIEWS } from "@/lib/data";

export function generateStaticParams() {
  return INTERVIEWS.map((i) => ({ interviewId: i.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}): Promise<Metadata> {
  const { interviewId } = await params;
  const interview = INTERVIEWS.find((i) => i.id === interviewId);
  if (!interview) return { title: "Review" };
  return { title: `Review · ${interview.title}` };
}

export default async function InterviewCandidatesPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;
  const interview = INTERVIEWS.find((i) => i.id === interviewId);

  // The /candidates/demo route is a static page and takes precedence over
  // this segment, so any other unknown id is genuinely not found.
  if (interviewId !== "demo" && !interview) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title={interview ? `Review · ${interview.title}` : "Review · Demo"}
        description={
          interview
            ? `Candidate responses for the ${interview.role} interview. All AI feedback on this page is sample demo content.`
            : "Candidate review workspace (demo). All AI feedback shown here is sample demo content."
        }
      />
      <ReviewWorkspace interviewId={interviewId} />
    </div>
  );
}
