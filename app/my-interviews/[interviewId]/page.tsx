import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationDetails } from "@/components/candidate/invitation-details";
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
    title: inv ? `${inv.role} · ${inv.company}` : "Interview",
    description: inv
      ? `Interview details and preparation room for the ${inv.role} role at ${inv.company}.`
      : "Interview details and preparation room.",
  };
}

export default async function InvitationDetailPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;
  const invitation = INVITATIONS.find((i) => i.id === interviewId);
  if (!invitation) notFound();
  return <InvitationDetails invitation={invitation} />;
}
