import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, ArrowRight, Home } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { MarkComplete } from "@/components/candidate/mark-complete";

export const metadata: Metadata = {
  title: "Interview complete",
  description:
    "Confirmation screen after finishing a demo interview, with next steps for the candidate.",
};

export default function CompletePage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex h-[68px] max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Badge tone="outline">Demo flow</Badge>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20 text-center">
        <MarkComplete />
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e4f5ec] shadow-[0_8px_30px_rgba(23,138,91,0.15)]">
          <CircleCheck size={38} className="text-success" />
        </span>
        <h1 className="mt-7 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
          Interview complete
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">
          Your demo interview responses were handled entirely in this browser
          session — nothing was uploaded. <span className="font-medium text-ink">Senior
          Frontend Engineer</span> · demo invite from Nova.
        </p>

        <div className="mt-9 rounded-2xl border border-hairline bg-surface p-5 text-left shadow-card">
          <h2 className="text-[14px] font-semibold text-ink">What happens next</h2>
          <ul className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-slate">
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              In the real product, the recruiting team reviews your responses
              in their own time.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              This demo makes no prediction of an outcome — recruiters, not
              software, make all decisions.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              You can close this tab; no further action is needed.
            </li>
          </ul>
        </div>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/my-interviews" className={buttonClasses("outline", "lg")}>
            Back to my interviews
          </Link>
          <Link href="/interview/demo" className={buttonClasses("outline", "lg")}>
            <Home size={16} />
            Retake the demo interview
          </Link>
          <Link href="/" className={buttonClasses("primary", "lg")}>
            Explore Vervue AI
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    </div>
  );
}
