"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Video,
  Sparkles,
  StickyNote,
  LayoutDashboard,
  MessageSquareText,
  CircleUserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { LogoMark } from "@/components/layout/logo";

const scenes = [
  {
    label: "Recruiter opens the dashboard",
    icon: LayoutDashboard,
    render: (
      <>
        <div className="flex h-8 items-center gap-2 rounded-md bg-white/[0.05] px-2">
          <CircleUserRound size={11} className="text-[#8a92ff]" />
          <span className="text-[9px] text-white/60">Welcome back, Alex</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[["14", "Interviews"], ["9", "To review"], ["82%", "Completion"]].map(
            ([n, l]) => (
              <div
                key={l}
                className="rounded-md bg-white/[0.05] px-2 py-2.5 text-center"
              >
                <div className="text-sm font-semibold text-white/90">{n}</div>
                <div className="text-[8.5px] text-white/45">{l}</div>
              </div>
            )
          )}
        </div>
        <div className="mt-2 space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8a92ff]" />
              <span className="h-1 w-full max-w-[70%] rounded bg-white/15" />
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    label: "Creates a structured interview",
    icon: Plus,
    render: (
      <div className="space-y-2">
        <div className="space-y-1.5">
          <div className="h-3 w-2/3 rounded bg-white/15" />
          <div className="h-2 w-1/3 rounded bg-white/10" />
        </div>
        {["1 · Tell us about a project you owned end to end…", "2 · Walk us through a production break…", "3 · A teammate disagrees with your approach…"].map(
          (q) => (
            <div
              key={q}
              className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1.5 text-[9px] leading-snug text-white/65"
            >
              {q}
            </div>
          )
        )}
        <div className="flex items-center gap-1.5 rounded-md bg-[#6258e8]/30 px-2 py-1.5">
          <Plus size={10} className="text-[#8a92ff]" />
          <span className="text-[9px] font-medium text-[#b9b2ff]">
            Add question
          </span>
        </div>
      </div>
    ),
  },
  {
    label: "Candidate answers on video",
    icon: Video,
    render: (
      <div className="flex items-center justify-center py-1">
        <div className="relative h-24 w-40 overflow-hidden rounded-md border border-white/10 bg-gradient-to-br from-[#2b2f52] to-[#1b1e33]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(145,133,246,0.3),transparent_62%)]" />
          <div className="absolute left-1/2 top-[30%] h-8 w-8 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#8f88e0] to-[#5a52b8]" />
          <div className="absolute left-2 top-2 flex items-center gap-1 bg-black/45 px-1.5 py-0.5 rounded-full">
            <span className="h-1 w-1 animate-pulse rounded-full bg-[#ff5d5d]" />
            <span className="text-[7.5px] text-white/90">REC 00:38</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "Transcript and AI-assisted summary appear",
    icon: Sparkles,
    render: (
      <div className="space-y-1.5">
        <div className="rounded-md bg-white/[0.05] px-2 py-1.5 text-[9px] leading-snug text-white/60">
          <span className="mr-1 font-medium text-[#8a92ff]">01:52</span>
          “…tickets dropped by roughly forty percent the following quarter…”
        </div>
        <div className="rounded-md border border-[#8a92ff]/30 bg-[#6258e8]/15 px-2 py-1.5">
          <div className="flex items-center gap-1">
            <Sparkles size={9} className="text-[#a99fff]" />
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-[#b9b2ff]">
              AI-assisted
            </span>
          </div>
          <p className="mt-1 text-[9px] leading-snug text-white/75">
            “Systematic, risk-first debugging approach — starts with
            environment parity, diffs deployed bundles…”
          </p>
        </div>
      </div>
    ),
  },
  {
    label: "Recruiter reviews and adds notes",
    icon: StickyNote,
    render: (
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5 rounded-md border border-white/10 bg-white/[0.05] p-2">
          {["Ownership", "Prioritization", "Quantified outcomes"].map((s) => (
            <div key={s} className="flex items-center gap-1 text-[9px] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#59c98f]" />
              {s}
            </div>
          ))}
        </div>
        <div className="rounded-md border border-[#8a92ff]/30 bg-[#6258e8]/12 p-2">
          <div className="flex items-center gap-1 text-[9px] font-medium text-[#b9b2ff]">
            <MessageSquareText size={9} /> Recruiter note
          </div>
          <p className="mt-1 text-[9px] leading-snug text-white/65">
            “Strong ownership story — ask about the integration rework on a
            live call.”
          </p>
          <div className="mt-1.5 inline-block rounded bg-[#59c98f]/20 px-1.5 py-0.5 text-[8px] font-medium text-[#7fe0b1]">
            ✓ Reviewed
          </div>
        </div>
      </div>
    ),
  },
];

export function DemoPreviewModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % scenes.length),
      2600
    );
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const scene = scenes[index];
  const SceneIcon = scene.icon;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Interactive demo preview"
      description="A frontend prototype walkthrough of the Vervue AI workflow — no video recording exists yet."
      wide
    >
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#15182c] to-[#20233f] p-4 sm:p-6">
        <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
          <LogoMark className="h-6 w-6" />
          <span className="text-xs font-semibold text-white/80">
            Vervue AI · workflow
          </span>
        </div>
        <div
          key={index}
          className="min-h-[190px] animate-fade-in sm:min-h-[210px]"
        >
          {scene.render}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SceneIcon size={15} className="text-accent" />
          <p className="text-sm font-medium text-ink">
            {index + 1}. {scene.label}
          </p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {scenes.map((s, i) => (
            <button
              key={s.label}
              tabIndex={-1}
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index
                  ? "w-6 bg-accent"
                  : "w-1.5 bg-hairline hover:bg-[#c9cddc]"
              )}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
