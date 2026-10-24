import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { CandidateInterview } from "@/components/interview/candidate-interview";

export const metadata: Metadata = {
  title: "Candidate interview",
  description:
    "Recorded interview room: prep time, camera preview, and per-question recording controls (demo).",
};

export default function InterviewDemoPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:h-[68px] sm:px-6">
          <Logo />
          <Link
            href="/my-interviews"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} />
            Exit to my interviews
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-accent">
          Senior Frontend Engineer · Demo interview
        </p>
        <CandidateInterview />
      </main>
    </div>
  );
}
