"use client";

import { useState } from "react";
import {
  ListChecks,
  Video,
  ScanSearch,
} from "lucide-react";
import {
  StepCreatePreview,
  StepRespondPreview,
  StepReviewPreview,
} from "@/components/dashboard/previews";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";

const highlights = [
  {
    id: "create",
    icon: ListChecks,
    title: "Create with structure",
    text: "Prepare consistent questions and interview settings for every candidate.",
  },
  {
    id: "capture",
    icon: Video,
    title: "Capture responses",
    text: "Give candidates a clear, focused space to answer interview questions on video.",
  },
  {
    id: "review",
    icon: ScanSearch,
    title: "Review with context",
    text: "Explore answer summaries, transcripts, evidence, and reviewer notes in one workspace.",
  },
] as const;

const previews = {
  create: <StepCreatePreview />,
  capture: <StepRespondPreview />,
  review: <StepReviewPreview />,
};

export function Showcase() {
  const [active, setActive] = useState<(typeof highlights)[number]["id"]>("create");

  return (
    <section id="showcase" className="relative overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-24 -z-10 h-[480px] bg-[radial-gradient(ellipse_50%_45%_at_50%_0%,rgba(145,133,246,0.09),transparent_70%)]"
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Built for better conversations"
          heading="From first question to final review."
          description="See how structured interviews and thoughtful AI assistance fit into one seamless recruiting workflow."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Interactive preview */}
          <div
            className="relative rounded-2xl border border-hairline bg-gradient-to-br from-[#181b31] via-[#1c2040] to-[#22264a] p-6 sm:p-9 shadow-video"
            aria-live="polite"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(98,88,232,0.25),transparent_70%)]"
            />
            <div className="relative mx-auto max-w-md animate-fade-in" key={active}>
              {previews[active]}
            </div>
            <div className="relative mt-7 flex justify-center gap-2" aria-hidden="true">
              {highlights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setActive(h.id)}
                  aria-label={`Show ${h.title}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    active === h.id
                      ? "w-8 bg-gradient-to-r from-accent to-violet"
                      : "w-1.5 bg-white/20 hover:bg-white/35"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Workflow highlights */}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
              The workflow
            </p>
            <div className="mt-6 space-y-3">
              {highlights.map((h, i) => {
                const isActive = active === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setActive(h.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300",
                      isActive
                        ? "border-[#dedaff] bg-surface shadow-card"
                        : "border-transparent bg-transparent hover:border-hairline hover:bg-surface/70"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isActive
                          ? "bg-gradient-to-br from-accent to-violet text-white shadow-[0_4px_14px_rgba(98,88,232,0.35)]"
                          : "bg-[#eceef5] text-slate"
                      )}
                    >
                      <h.icon size={18} />
                    </span>
                    <span>
                      <span className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-ink">
                          {h.title}
                        </span>
                        <span className="text-[11px] font-medium text-[#9aa0b4]">
                          0{i + 1}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate">
                        {h.text}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
