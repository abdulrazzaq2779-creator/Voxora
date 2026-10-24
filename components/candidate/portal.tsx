"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  MessageSquareText,
  ArrowRight,
  Check,
  CircleUserRound,
  LogOut,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { readStage, type CandidateStage } from "@/lib/candidate-stage";

const details = [
  { icon: Clock, label: "Duration", value: "~18 minutes" },
  { icon: MessageSquareText, label: "Questions", value: "3 open-ended questions" },
];

const steps: Array<{ id: CandidateStage; label: string }> = [
  { id: "invited", label: "Invited" },
  { id: "in-progress", label: "Interview" },
  { id: "complete", label: "Complete" },
];

export function CandidatePortal() {
  const [stage, setStage] = useState<CandidateStage>("invited");

  useEffect(() => {
    setStage(readStage());
  }, []);

  const stepIndex = steps.findIndex((s) => s.id === stage);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Candidate portal
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
            You have an interview waiting
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-slate">
            Read the invitation whenever you're ready, test your devices, and
            record your answers in a calm, focused space.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet to-accent text-[12px] font-semibold text-white">
            SC
          </span>
          <div>
            <div className="text-[13px] font-medium text-ink">Sena Carter</div>
            <div className="text-[11.5px] text-slate">Demo candidate account</div>
          </div>
          <Link
            href="/sign-in"
            className="ml-4 flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-[#f1f2f7] hover:text-ink"
          >
            <LogOut size={13} />
            Sign out
          </Link>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="mt-8 flex items-center gap-2 sm:gap-3" aria-label="Interview progress">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          return (
            <div key={s.id} className="flex flex-1 items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold transition-colors",
                    done && "bg-success text-white",
                    current && "bg-gradient-to-br from-accent to-violet text-white shadow-[0_2px_10px_rgba(98,88,232,0.3)]",
                    !done && !current && "bg-[#eceef5] text-slate"
                  )}
                >
                  {done ? <Check size={13} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[12.5px] font-medium",
                    current ? "text-ink" : "text-slate"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "h-px flex-1",
                    i < stepIndex ? "bg-success" : "bg-hairline"
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* Invitation card */}
        <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender">
              <CircleUserRound size={20} className="text-accent" />
            </span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
                Senior Frontend Engineer
              </h2>
              <p className="text-[13px] text-slate">Nova Corp · invited you on Oct 20</p>
            </div>
            <Badge tone={stage === "complete" ? "success" : stage === "in-progress" ? "accent" : "amber"}>
              {stage === "complete" ? "Completed" : stage === "in-progress" ? "In progress" : "Awaiting you"}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-[#fbfbfe] px-3.5 py-3"
              >
                <d.icon size={15} className="text-accent" />
                <div>
                  <div className="text-[11.5px] text-slate">{d.label}</div>
                  <div className="text-[13px] font-medium text-ink">{d.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-[#f1f2f7] px-4 py-3.5 text-[13px] leading-relaxed text-slate">
            <span className="font-medium text-ink">Before you begin:</span> find a quiet,
            well-lit space. Your browser will ask for camera and microphone access —
            nothing is recorded until you press the record button, and nothing is
            uploaded in this demo.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {stage === "complete" ? (
              <>
                <Link href="/interview/demo/complete" className={buttonClasses("primary", "lg", "sm:flex-1 w-full")}>
                  View completion
                  <ArrowRight size={16} />
                </Link>
                <Link href="/interview/demo" className={buttonClasses("outline", "lg", "sm:flex-1 w-full")}>
                  Re-take demo interview
                </Link>
              </>
            ) : (
              <>
                <Link href="/interview/demo" className={buttonClasses("primary", "lg", "sm:flex-1 w-full")}>
                  {stage === "in-progress" ? "Continue interview" : "Begin interview"}
                  <ArrowRight size={16} />
                </Link>
                <Link href="/invite/demo" className={buttonClasses("outline", "lg", "sm:flex-1 w-full")}>
                  Review invitation & device test
                </Link>
              </>
            )}
          </div>
          <p className="mt-4 text-[11.5px] text-[#9aa0b4]">
            Demo flow — progress is kept in this browser tab only and no record of
            this interview is stored anywhere.
          </p>
        </div>

        {/* Side info */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card">
            <h3 className="text-[14px] font-semibold text-ink">
              What the interview looks like
            </h3>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-slate">
              {[
                "3 questions, one at a time",
                "A short prep timer before each recording",
                "You review each answer before continuing",
                "Recording always starts and stops with you",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check size={14} className="mt-0.5 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card">
            <h3 className="text-[14px] font-semibold text-ink">Questions preview</h3>
            <ol className="mt-3 space-y-2 text-[12.5px] leading-snug text-slate">
              <li className="flex gap-2">
                <span className="font-semibold text-accent">Q1.</span> Tell us about a
                project you owned end to end.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-accent">Q2.</span> Debug a page that
                renders locally but breaks in production.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-accent">Q3.</span> A teammate
                disagrees with your approach two days before a deadline.
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
