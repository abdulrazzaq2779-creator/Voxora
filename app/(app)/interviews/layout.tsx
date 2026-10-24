import type { Metadata } from "next";

export const metadata: Metadata = {
  // Re-declare the root template so child routes (new, [interviewId]) keep
  // the "· Vervue AI" suffix too.
  title: { template: "%s · Vervue AI", default: "Interviews" },
  description:
    "Create, organize, and track structured video interviews — drafts, active invites, and completed sessions.",
};

export default function InterviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
