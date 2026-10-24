import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InterviewRoom } from "@/components/interview/interview-room";
import { INVITATIONS } from "@/lib/candidate-data";

export function generateStaticParams() {
  return INVITATIONS.map((i) => ({ interviewId: i.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}): Promise<Metadata> {
  const { interviewId } = await params;
  const inv = INVITATIONS.find((i) => i.id === interviewId);
  return {
    title: inv ? `Interview · ${inv.role}` : "Interview",
    description: "Interview room: prep countdown, recording controls, and progress.",
  };
}

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;
  const invitation = INVITATIONS.find((i) => i.id === interviewId);
  if (!invitation) notFound();
  return <InterviewRoom invitation={invitation} />;
}
