"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  Clock3,
  ScanSearch,
  Users,
} from "lucide-react";
import type { Interview } from "@/lib/types";
import { INTERVIEWS, CANDIDATES, WEEKLY_ACTIVITY } from "@/lib/data";
import { CandidateBadge, ReviewBadge } from "@/components/ui/status-badge";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-slate">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f2f7] text-slate">
          {icon}
        </span>
      </div>
      <div className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-ink">
        {value}
      </div>
      <div className="mt-1 text-[12px] text-slate">{meta}</div>
    </div>
  );
}

export function InterviewsTable({
  interviews,
  onRowClick,
}: {
  interviews: Interview[];
  onRowClick?: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-hairline text-[11.5px] uppercase tracking-wider text-[#9aa0b4]">
            <th className="px-4 py-2.5 font-medium">Interview</th>
            <th className="px-4 py-2.5 font-medium">Candidates</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Review</th>
            <th className="px-4 py-2.5 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {interviews.map((it) => (
            <tr
              key={it.id}
              className={cn(
                "border-b border-hairline last:border-0 transition-colors hover:bg-[#f8f8fd]",
                onRowClick && "cursor-pointer"
              )}
              onClick={onRowClick ? () => onRowClick(it.id) : undefined}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-ink">{it.title}</div>
                <div className="mt-0.5 text-xs text-slate">
                  {it.role} · {new Date(it.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </td>
              <td className="px-4 py-3 text-slate">
                {it.completed}/{it.candidateCount} done
              </td>
              <td className="px-4 py-3">
                {it.status === "active" && (
                  <span className="text-[13px] font-medium text-success">● Active</span>
                )}
                {it.status === "draft" && (
                  <span className="text-[13px] font-medium text-slate">○ Draft</span>
                )}
                {it.status === "closed" && (
                  <span className="text-[13px] font-medium text-[#9aa0b4]">◌ Closed</span>
                )}
              </td>
              <td className="px-4 py-3">
                <ReviewBadge status={it.reviewStatus} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/candidates/${it.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
                >
                  Review <ArrowUpRight size={13} />
                </Link>
              </td>
            </tr>
          ))}
          {interviews.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate">
                No interviews match your search yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function CompletionChart({ className }: { className?: string }) {
  const max = Math.max(...WEEKLY_ACTIVITY.map((w) => w.interviews));
  return (
    <div className={className}>
      <div className="flex h-36 items-end gap-3 sm:gap-4">
        {WEEKLY_ACTIVITY.map((w, i) => (
          <div key={w.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-full max-w-[16px] rounded-t-md bg-gradient-to-t from-accent to-violet"
                style={{ height: `${(w.interviews / max) * 100}%` }}
              />
              <div
                className="w-full max-w-[16px] rounded-t-md bg-[#dcdff0] transition-colors hover:bg-[#c9cddc]"
                style={{ height: `${(w.reviews / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate">{w.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-gradient-to-t from-accent to-violet" />
          Interviews
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[#dcdff0]" />
          Reviews completed
        </span>
        <span className="ml-auto text-[11px] text-[#9aa0b4]">Sample data</span>
      </div>
    </div>
  );
}

export function PendingReviews() {
  const pending = CANDIDATES.filter(
    (c) => c.status === "Pending review"
  ).slice(0, 3);
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <ScanSearch size={15} className="text-accent" />
          Pending your review
        </span>
        <Link
          href="/candidates"
          className="text-[12px] font-medium text-accent hover:text-accent-strong"
        >
          View all
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {pending.map((c) => (
          <Link
            key={c.id}
            href={`/candidates/${c.interviewId}`}
            className="flex items-center justify-between rounded-xl border border-hairline bg-[#fafbfe] px-3.5 py-2.5 transition-colors hover:border-[#dedaff] hover:bg-lavender/60"
          >
            <div className="flex items-center gap-2.5">
              <Avatar name={c.name} color={c.avatarColor} />
              <div>
                <div className="text-[13px] font-medium text-ink">{c.name}</div>
                <div className="text-[11px] text-slate">{c.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {c.completedAt && (
                <span className="hidden items-center gap-1 text-[11px] text-slate sm:flex">
                  <Clock3 size={11} />
                  Oct {c.completedAt.slice(-2)}
                </span>
              )}
              <ArrowUpRight size={14} className="text-slate" />
            </div>
          </Link>
        ))}
        {pending.length === 0 && (
          <div className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center">
            <p className="text-[13px] text-slate">
              All caught up — nothing waiting for review. 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PipelineCard() {
  const stages = [
    { label: "Invited", count: CANDIDATES.filter((c) => c.status === "Invited").length, tone: "bg-[#dcdff0]" },
    { label: "In progress", count: CANDIDATES.filter((c) => c.status === "In progress").length, tone: "bg-accent" },
    { label: "Completed", count: CANDIDATES.filter((c) => c.status === "Completed").length, tone: "bg-violet" },
    { label: "Pending review", count: CANDIDATES.filter((c) => c.status === "Pending review").length, tone: "bg-amber" },
    { label: "Reviewed", count: CANDIDATES.filter((c) => c.status === "Reviewed").length, tone: "bg-success" },
  ];
  const max = 12;
  return (
    <div>
      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <Users size={15} className="text-accent" />
        Candidate pipeline
      </span>
      <div className="mt-4 space-y-2.5">
        {stages.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[12px] text-slate">{s.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f1f2f7]">
              <div
                className={cn("h-full rounded-full", s.tone)}
                style={{ width: `${(s.count / max) * 100}%`, minWidth: s.count > 0 ? 14 : 0 }}
              />
            </div>
            <span className="w-5 text-right text-[12px] font-medium text-ink">
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentInterviewsCard({ onRowClick }: { onRowClick?: (id: string) => void }) {
  return (
    <section
      aria-labelledby="recent-interviews"
      className="rounded-2xl border border-hairline bg-surface shadow-card"
    >
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <h2
          id="recent-interviews"
          className="flex items-center gap-2 text-[15px] font-semibold text-ink"
        >
          <ClipboardList size={16} className="text-accent" />
          Recent interviews
        </h2>
        <Link
          href="/interviews"
          className="text-[12.5px] font-medium text-accent transition-colors hover:text-accent-strong"
        >
          View all
        </Link>
      </div>
      <div className="px-2 py-2">
        <InterviewsTable interviews={INTERVIEWS.slice(0, 4)} onRowClick={onRowClick} />
      </div>
    </section>
  );
}
