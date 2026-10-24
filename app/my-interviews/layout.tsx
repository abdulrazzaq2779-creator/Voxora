import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { CandidateNav } from "@/components/candidate/candidate-nav";

export const metadata: Metadata = {
  title: "Candidate portal",
  description:
    "Candidate home: profile completion, upcoming deadlines, invitations, and notifications.",
};

export default function CandidatePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg">
      <CandidateNav />
      <main id="main">{children}</main>
      <footer className="border-t border-hairline bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6">
          <Logo href="/my-interviews" compact />
          <p className="text-[11.5px] text-[#9aa0b4]">
            Demo candidate portal — progress is kept in this browser only and
            nothing is uploaded.
          </p>
        </div>
      </footer>
    </div>
  );
}
