"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  Quote,
  StickyNote,
  ThumbsUp,
  MessageCircleQuestion,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
} from "lucide-react";
import {
  CANDIDATES,
  REVIEW_STEPS,
  REVIEWER_NOTE,
} from "@/lib/data";
import { Avatar } from "@/components/dashboard/avatar";
import { ReviewBadge } from "@/components/ui/status-badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewWorkspace({
  interviewId,
}: {
  interviewId?: string;
}) {
  const pool = useMemo(
    () =>
      interviewId
        ? CANDIDATES.filter(
            (c) => c.interviewId === interviewId && c.completedAt
          )
        : CANDIDATES,
    [interviewId]
  );
  const initial =
    (interviewId && pool[0]) || CANDIDATES.find((c) => c.id === "maya")!;
  const [candidateId, setCandidateId] = useState(initial.id);
  const [stepIndex, setStepIndex] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({
    [initial.id]: REVIEWER_NOTE.initial,
  });
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(pool.map((c) => [c.id, c.reviewStatus]))
  );

  const candidate =
    CANDIDATES.find((c) => c.id === candidateId) ?? initial;
  const step = REVIEW_STEPS[Math.min(stepIndex, REVIEW_STEPS.length - 1)];
  const note = notes[candidate.id] ?? "";
  const statusEntry = (statuses[candidate.id] ?? candidate.reviewStatus) as
    | "pending"
    | "in-review"
    | "reviewed";

  const setNote = (v: string) =>
    setNotes((n) => ({ ...n, [candidate.id]: v }));

  const setStatus = (s: "pending" | "in-review" | "reviewed") =>
    setStatuses((st) => ({ ...st, [candidate.id]: s }));

  return (
    <div className="grid gap-4 xl:grid-cols-[240px_1fr] xl:items-start">
      {/* Candidate rail */}
      <aside className="rounded-2xl border border-hairline bg-surface p-3 shadow-card">
        <h2 className="px-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9aa0b4]">
          {interviewId ? "Your candidates" : "Recent candidates"}
        </h2>
        <div className="flex gap-2 overflow-x-auto xl:flex-col xl:overflow-visible">
          {(pool.length ? pool : CANDIDATES.slice(0, 4)).map((c) => {
            const active = c.id === candidate.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCandidateId(c.id);
                  setStepIndex(0);
                }}
                aria-pressed={active}
                className={cn(
                  "flex w-44 shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                  active
                    ? "border-[#dedaff] bg-lavender/70 shadow-card"
                    : "border-transparent hover:bg-[#f6f7fc]"
                )}
              >
                <Avatar name={c.name} color={c.avatarColor} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-ink">
                    {c.name}
                  </span>
                  <span className="block truncate text-[10.5px] text-slate">
                    {c.role}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-4">
        {/* Candidate overview */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-hairline bg-surface p-4 shadow-card sm:p-5">
          <Avatar name={candidate.name} color={candidate.avatarColor} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-[-0.01em] text-ink">
                {candidate.name}
              </h1>
              <ReviewBadge status={statusEntry} />
            </div>
            <p className="mt-0.5 text-[13px] text-slate">
              {candidate.role} · Interview: Senior Frontend Engineer (demo)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                ["pending", "Pending"],
                ["in-review", "In review"],
                ["reviewed", "Reviewed"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                aria-pressed={statusEntry === key}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all",
                  statusEntry === key
                    ? "border-accent bg-lavender text-accent-strong"
                    : "border-hairline text-slate hover:text-ink"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Video + question nav */}
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa0b4]">
                {step.label}
              </span>
              <span className="text-[11.5px] font-medium text-slate">
                Recorded {step.duration}
              </span>
            </div>
            {/* Video frame (demo content) */}
            <div className="relative mt-3 overflow-hidden rounded-xl bg-gradient-to-br from-[#15182c] to-[#232743]">
              <div className="flex h-56 items-center justify-center sm:h-64">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <CircleUserRound size={28} className="text-white/80" />
                  </div>
                  <p className="mt-3 text-[12.5px] text-white/65">
                    Demo content — the real product plays the recorded answer
                    here
                  </p>
                  <p className="mt-1 text-[11px] text-white/40">
                    {step.at} · {REVIEW_STEPS[stepIndex]?.at}
                  </p>
                </div>
              </div>
              <div className="absolute inset-x-4 bottom-3 flex items-center gap-2">
                <button
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  disabled={stepIndex === 0}
                  aria-label="Previous question"
                  className="rounded-full bg-black/40 p-1.5 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-30"
                >
                  <ChevronLeft size={15} />
                </button>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-violet transition-all duration-500"
                    style={{
                      width: `${((stepIndex + 1) / REVIEW_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
                <button
                  onClick={() =>
                    setStepIndex((i) =>
                      Math.min(REVIEW_STEPS.length - 1, i + 1)
                    )
                  }
                  disabled={stepIndex === REVIEW_STEPS.length - 1}
                  aria-label="Next question"
                  className="rounded-full bg-black/40 p-1.5 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-30"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Transcript */}
            <div className="mt-4 rounded-xl border border-hairline bg-[#fbfbfe] p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa0b4]">
                Transcript
              </h3>
              <div className="mt-2.5 space-y-2.5 whitespace-pre-line text-[13.5px] leading-relaxed text-ink">
                {step.transcript}
              </div>
              <p className="mt-3 border-t border-hairline pt-2.5 text-[11px] text-[#9aa0b4]">
                Sample transcript for the demo interview · {candidate.name}
              </p>
            </div>
          </div>

          {/* Side panels */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#dedaff] bg-surface p-4 shadow-card sm:p-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-strong">
                <Sparkles size={10} />
                AI-assisted summary
              </span>
              <p className="mt-3 text-[14px] font-semibold leading-snug text-ink">
                {step.summary.headline}
              </p>
              <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-snug text-slate">
                {step.summary.bullets.map((b) => (
                  <li key={b} className="flex gap-1.5">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-[#f1f2f7] px-2.5 py-2 text-[10.5px] leading-snug text-slate">
                Demo content — shown for this preview; real summaries come from
                a configured AI service.
              </p>
            </div>

            <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-card sm:p-5">
              <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#9aa0b4]">
                <Quote size={12} /> Evidence
              </h3>
              <div className="mt-3 space-y-2">
                {step.summary.evidence.map((e) => (
                  <button
                    key={e.quote}
                    className="flex w-full items-start gap-2 rounded-xl bg-[#f6f7fc] px-3 py-2 text-left transition-colors hover:bg-[#eef0f8]"
                  >
                    <span className="rounded bg-lavender px-1.5 py-0.5 text-[10px] font-medium text-accent-strong">
                      {e.at}
                    </span>
                    <span className="text-[12.5px] leading-snug text-slate">
                      “{e.quote}”
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-card">
                <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-success">
                  <ThumbsUp size={12} /> Strengths
                </h3>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {step.summary.strengths.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[#e4f5ec] px-2.5 py-1 text-[11.5px] font-medium text-success"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-card">
                <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-amber">
                  <MessageCircleQuestion size={12} /> Clarify
                </h3>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {step.summary.clarify.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[#fbf1de] px-2.5 py-1 text-[11.5px] font-medium text-amber"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recruiter notes */}
            <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-card sm:p-5">
              <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#9aa0b4]">
                <StickyNote size={12} /> Recruiter notes
              </h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add your own notes from this interview…"
                aria-label={`Notes for ${candidate.name}`}
                className="mt-2.5 w-full resize-none rounded-xl border border-hairline bg-[#fbfbfe] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11.5px] text-[#9aa0b4]">
                  Saved to this browser only (demo)
                </span>
                <button
                  onClick={() => setStatus("reviewed")}
                  className={buttonClasses("primary", "sm")}
                >
                  <Check size={13} />
                  Mark reviewed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

