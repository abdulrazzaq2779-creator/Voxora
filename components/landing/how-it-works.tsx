"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import {
  StepCreatePreview,
  StepRespondPreview,
  StepReviewPreview,
} from "@/components/dashboard/previews";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    id: "create",
    n: 1,
    title: "Create",
    text: "Set up your interview with structured questions and clear expectations.",
    preview: <StepCreatePreview />,
  },
  {
    id: "respond",
    n: 2,
    title: "Respond",
    text: "Give candidates a focused experience for preparing and recording their answers.",
    preview: <StepRespondPreview />,
  },
  {
    id: "review",
    n: 3,
    title: "Review",
    text: "Review responses with transcripts, AI-assisted summaries, and human notes.",
    preview: <StepReviewPreview />,
  },
] as const;

export function HowItWorks() {
  const [active, setActive] = useState<(typeof steps)[number]["id"]>("create");
  const current = steps.find((s) => s.id === active)!;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-hairline bg-lavender/60 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="How it works"
          heading="One workflow. Three clear steps."
        />

        {/* Segmented control */}
        <div
          role="tablist"
          aria-label="Workflow steps"
          className="mx-auto mt-10 flex w-fit gap-1 rounded-xl border border-hairline bg-surface p-1.5 shadow-card"
        >
          {steps.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={active === s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                active === s.id
                  ? "bg-gradient-to-r from-accent to-violet text-white shadow-[0_2px_10px_rgba(98,88,232,0.3)]"
                  : "text-slate hover:bg-[#f1f2f7] hover:text-ink"
              )}
            >
              <span
                className={cn(
                  "flex h-5.5 w-5.5 items-center justify-center rounded-full text-[11px] font-semibold",
                  active === s.id ? "bg-white/20 text-white" : "bg-[#eceef5] text-slate"
                )}
              >
                {s.n}
              </span>
              {s.title}
            </button>
          ))}
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div key={current.id} className="animate-fade-up">
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-[27px]">
              Step {current.n} — {current.title}
            </h3>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate">
              {current.text}
            </p>
            <div className="mt-6 flex items-center gap-1.5">
              <span className="text-[12px] font-medium uppercase tracking-wider text-slate">
                Progress
              </span>
              <div className="ml-1 flex gap-1.5">
                {steps.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      "h-1.5 w-10 rounded-full transition-colors",
                      i === current.n - 1
                        ? "bg-gradient-to-r from-accent to-violet"
                        : "bg-[#dcdff0]"
                    )}
                  />
                ))}
              </div>
            </div>
            <Link
              href="/invite/demo"
              className={buttonClasses("secondary", "md", "mt-7")}
            >
              Try the candidate experience
              <ArrowRight size={15} />
            </Link>
          </div>

          <div
            key={`${current.id}-preview`}
            className="animate-fade-in lg:pl-4"
            aria-live="polite"
          >
            {current.preview}
          </div>
        </div>
      </div>
    </section>
  );
}
