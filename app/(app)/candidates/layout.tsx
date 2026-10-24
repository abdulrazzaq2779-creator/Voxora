import type { Metadata } from "next";

export const metadata: Metadata = {
  // Re-declare the root template so child routes (demo, [interviewId]) keep
  // the "· Vervue AI" suffix too.
  title: { template: "%s · Vervue AI", default: "Candidates" },
  description:
    "Search and filter candidates across interviews, track their status, and open review workspaces.",
};

export default function CandidatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
