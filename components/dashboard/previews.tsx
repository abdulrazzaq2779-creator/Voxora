import { Sparkles, Clock, ChevronRight, GripVertical, Mic, MessageSquareText, Check, CircleUserRound, Video } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

/* ---------- Feature/step previews (marketing) ---------- */

export function MiniQuestionEditor() {
  const questions = [
    "Tell us about a project you owned end to end.",
    "Walk us through debugging a production break.",
    "A teammate disagrees with your approach — how do you handle it?",
  ];
  return (
    <div className="rounded-xl border border-hairline bg-[#fbfbfe] p-4 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
          Interview · Frontend Engineer
        </span>
        <span className="flex items-center gap-1 text-[10.5px] text-slate">
          <Clock size={11} /> 18 min
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {questions.map((q, i) => (
          <div
            key={q}
            className="flex items-start gap-2 rounded-lg border border-hairline bg-surface px-2.5 py-2"
          >
            <GripVertical size={12} className="mt-0.5 text-[#b7bccb]" />
            <span className="text-[10px] font-medium text-accent">{i + 1}</span>
            <span className="text-[11px] leading-snug text-ink">{q}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-dashed border-[#d8dce8] px-2.5 py-1.5 text-[10.5px] font-medium text-slate">
        + Add question
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eceef5]">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-accent to-violet" />
        </div>
        <span className="text-[10px] font-medium text-slate">3 questions</span>
      </div>
    </div>
  );
}

export function MiniSummaryPanel() {
  return (
    <div className="rounded-xl border border-hairline bg-[#fbfbfe] p-4 text-left">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
        Answer summary
      </span>
      <div className="mt-3 space-y-1.5">
        <div className="rounded-md bg-[#eef0f6] px-2.5 py-1.5 text-[10.5px] leading-snug text-slate">
          <span className="mr-1.5 font-medium text-slate">01:52</span>
          “…tickets dropped by roughly forty percent the following quarter…”
          <span className="ml-1 rounded bg-[#fcf0d8] px-1 py-px text-[9.5px] font-medium text-amber">
            cited
          </span>
        </div>
        <div className="rounded-md bg-[#eef0f6] px-2.5 py-1.5 text-[10.5px] leading-snug text-slate">
          <span className="mr-1.5 font-medium text-slate">00:41</span>
          “…I made the call to cut scope on the integrations…”
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-[#dedaff] bg-lavender px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-accent" />
          <span className="text-[9.5px] font-semibold uppercase tracking-wider text-accent-strong">
            AI-assisted
          </span>
        </div>
        <p className="mt-1.5 text-[11px] font-medium leading-snug text-ink">
          “Owned a scoped product decision and shipped it early, with
          quantified impact.”
        </p>
      </div>
    </div>
  );
}

export function MiniReviewPanel() {
  const rows = [
    { name: "Maya Chen", status: "Reviewed", tone: "bg-success" },
    { name: "Priya Nair", status: "Pending", tone: "bg-amber" },
    { name: "Sam Okafor", status: "Reviewed", tone: "bg-success" },
    { name: "Leo Fontaine", status: "Recording", tone: "bg-accent" },
  ];
  return (
    <div className="rounded-xl border border-hairline bg-[#fbfbfe] p-4 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
          Candidates
        </span>
        <span className="text-[10.5px] font-medium text-accent">11 of 14</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-2.5 py-2"
          >
            <div className="flex items-center gap-2">
              <CircleUserRound size={14} className="text-[#b7bccb]" />
              <span className="text-[11px] font-medium text-ink">
                {r.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", r.tone)} />
              <span className="text-[10px] text-slate">{r.status}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-[#eef0f6] px-2.5 py-1.5">
        <span className="text-[10px] font-medium text-slate">
          2 pending review
        </span>
        <ChevronRight size={12} className="text-slate" />
      </div>
    </div>
  );
}

/* ---------- How-it-works step previews ---------- */

export function StepCreatePreview() {
  return (
    <div className="rounded-xl border border-hairline bg-[#fbfbfe] p-5 text-left shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
          New interview · step 2 of 3
        </span>
        <span className="rounded-full bg-lavender px-2 py-0.5 text-[10px] font-medium text-accent-strong">
          Draft saved
        </span>
      </div>
      <div className="mt-3 rounded-lg border border-hairline bg-surface px-3 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-wider text-[#9aa0b4]">
          Job title
        </div>
        <div className="mt-0.5 text-[13px] font-medium text-ink">
          Senior Frontend Engineer
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {[
          ["60s", "Prep time"],
          ["3 min", "Per answer"],
          ["1 take", "Retakes"],
        ].map(([v, l]) => (
          <div
            key={l}
            className="rounded-lg border border-hairline bg-surface px-2 py-2 text-center"
          >
            <div className="text-[12px] font-semibold text-ink">{v}</div>
            <div className="text-[9.5px] text-slate">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 space-y-1.5">
        {["Ownership story", "Production debugging", "Deadline disagreement"].map(
          (q, i) => (
            <div
              key={q}
              className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-2.5 py-2 text-[11.5px] text-ink"
            >
              <span className="text-[10px] font-medium text-accent">
                Q{i + 1}
              </span>
              {q}
              <Video size={11} className="ml-auto text-[#b7bccb]" />
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function StepRespondPreview() {
  return (
    <div className="rounded-xl border border-hairline bg-[#fbfbfe] p-5 text-left shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
          Interview · Sena, candidate
        </span>
        <span className="text-[10px] font-medium text-slate">Question 2 of 3</span>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-hairline bg-gradient-to-br from-[#1c2040] to-[#2b2f52]">
        <div className="relative flex h-36 flex-col justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(145,133,246,0.3),transparent_62%)]" />
          <div className="relative mx-auto h-14 w-14 rounded-full bg-gradient-to-b from-[#8f88e0] to-[#5a52b8]" />
          <div className="relative mx-auto mt-2 h-10 w-24 rounded-t-full bg-gradient-to-b from-[#6d65c4] to-[#453f8f]" />
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5d5d]" />
            <span className="text-[9px] font-medium text-white/90">
              REC · {formatTime(38)}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-lg border border-hairline bg-surface px-3 py-2.5 text-[11.5px] leading-snug text-ink">
        “Describe a time you had to make a decision with incomplete
        information. What did you learn?”
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate">
          <Mic size={12} /> Microphone ready
        </span>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[11.5px] font-medium text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Recording
        </span>
      </div>
    </div>
  );
}

export function StepReviewPreview() {
  return (
    <div className="rounded-xl border border-hairline bg-[#fbfbfe] p-5 text-left shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
          Review · Sena, candidate
        </span>
        <span className="rounded-full bg-[#e4f5ec] px-2 py-0.5 text-[10px] font-medium text-success">
          ✓ Reviewed
        </span>
      </div>
      <div className="mt-3 rounded-lg border border-hairline bg-surface px-3 py-2 text-[10.5px] leading-snug text-slate">
        <span className="mr-1.5 font-medium">01:52</span>
        “…tickets dropped by roughly forty percent the following quarter…”
      </div>
      <div className="mt-2 rounded-lg border border-[#dedaff] bg-lavender px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-accent" />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-accent-strong">
            AI-assisted summary
          </span>
        </div>
        <p className="mt-1 text-[11px] font-medium leading-snug text-ink">
          Quantified real-world outcome with clear ownership.
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-hairline bg-surface p-2">
          <div className="text-[9.5px] font-semibold uppercase tracking-wider text-success">
            Strengths
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {["Ownership", "Metrics", "Clarity"].map((s) => (
              <span
                key={s}
                className="rounded bg-[#e4f5ec] px-1.5 py-0.5 text-[9px] font-medium text-success"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-hairline bg-surface p-2">
          <div className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-accent">
            <MessageSquareText size={10} /> Note
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] leading-snug text-slate">
            <Check size={10} className="text-success" />
            Saved: “ask about the rework”
          </div>
        </div>
      </div>
    </div>
  );
}
