import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  MessageSquareText,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Camera as CameraIcon, Mic } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { DeviceTest } from "@/components/interview/device-test";

export const metadata: Metadata = {
  title: "Your interview invitation",
  description:
    "What candidates see when invited: interview details, instructions, and a device test before starting.",
};

const details = [
  { icon: Clock, label: "Expected duration", value: "~18 minutes" },
  { icon: MessageSquareText, label: "Questions", value: "3 open-ended questions" },
  { icon: CameraIcon, label: "Camera", value: "Required while recording answers" },
  { icon: Mic, label: "Microphone", value: "Required while recording answers" },
];

export default function InvitePage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex h-[68px] max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Badge tone="outline">Frontend demo</Badge>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge tone="accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Interview invitation
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
          You're invited: <span className="text-accent-strong">Senior Frontend Engineer</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">
          Before you start, take a moment to read how this interview works. You
          control every recording — you start it, you stop it, and you can
          review each answer before continuing.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {details.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-3.5 rounded-2xl border border-hairline bg-surface p-4 shadow-card"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender">
                <d.icon size={17} className="text-accent" />
              </span>
              <div>
                <div className="text-[12px] text-slate">{d.label}</div>
                <div className="text-[13.5px] font-medium text-ink">
                  {d.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">
            Candidate instructions
          </h2>
          <ol className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-slate">
            <li>
              <span className="font-medium text-ink">1 ·</span> Find a quiet,
              well-lit space where you won't be interrupted.
            </li>
            <li>
              <span className="font-medium text-ink">2 ·</span> Each question
              shows first, then a short prep timer, then your recording window.
            </li>
            <li>
              <span className="font-medium text-ink">3 ·</span> You can review
              each answer before moving to the next question.
            </li>
          </ol>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#f1f2f7] px-3.5 py-3 text-[12.5px] leading-relaxed text-slate">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" />
            Recording starts only when <span className="font-medium text-ink">you</span> press
            the record button. Nothing is uploaded in this demo — recordings
            stay in your browser and are discarded when you leave.
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/interview/demo" className={buttonClasses("primary", "lg", "flex-1 justify-center w-full")}>
            Begin the interview
            <ArrowRight size={16} />
          </Link>
          <Link
            href="#consent"
            className={buttonClasses("outline", "lg", "flex-1 justify-center w-full")}
          >
            Read consent details
          </Link>
        </div>
        <div id="consent" className="mt-6 scroll-mt-6">
          <DeviceTest />
        </div>
        <p className="mt-4 text-center text-[12.5px] text-[#9aa0b4]">
          By beginning, you agree to record your answers for this demo
          interview. You can stop at any time.
        </p>
      </main>
    </div>
  );
}
