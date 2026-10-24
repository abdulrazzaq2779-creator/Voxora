"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  MessageSquareText,
  Radio,
  Search,
  Timer,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INVITATIONS,
  allStatuses,
  formatDeadline,
  readInvitationProgress,
  statusLabel,
  type Invitation,
  type InvitationStatus,
} from "@/lib/candidate-data";

type Filter = "all" | InvitationStatus;

function statusTone(status: InvitationStatus): "success" | "accent" | "amber" {
  return status === "completed" ? "success" : status === "in-progress" ? "accent" : "amber";
}

export function MyInvitations() {
  const [statuses, setStatuses] = useState<Record<string, InvitationStatus>>({});
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setStatuses(allStatuses());
    setReady(true);
  }, []);

  const list = useMemo(() => {
    return INVITATIONS.filter((inv) => {
      const st = statuses[inv.id] ?? "not-started";
      if (filter !== "all" && st !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          inv.role.toLowerCase().includes(q) ||
          inv.company.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [statuses, filter, query, ready]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: INVITATIONS.length, "not-started": 0, "in-progress": 0, completed: 0 };
    INVITATIONS.forEach((inv) => {
      c[statuses[inv.id] ?? "not-started"] += 1;
    });
    return c;
  }, [statuses, ready]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
            My interviews
          </h1>
          <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-slate">
            Every invitation you've received, with its deadline, format, and
            progress.
          </p>
        </div>
        <label className="relative w-full sm:w-64">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0b4]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or role…"
            aria-label="Search invitations"
            className="h-10 w-full rounded-xl border border-hairline bg-surface pl-9 pr-3 text-[13.5px] text-ink placeholder:text-[#9aa0b4] shadow-card focus:border-[#c9c6f5] focus:outline-none"
          />
        </label>
      </div>

      {/* Status filters */}
      <div className="mt-6 flex flex-wrap gap-1 rounded-xl border border-hairline bg-surface p-1 shadow-card sm:inline-flex">
        {(
          [
            ["all", "All invites"],
            ["not-started", "Not started"],
            ["in-progress", "In progress"],
            ["completed", "Completed"],
          ] as Array<[Filter, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors",
              filter === value
                ? "bg-lavender text-accent-strong"
                : "text-slate hover:text-ink"
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px]",
                filter === value
                  ? "bg-white/70"
                  : "bg-[#eceef5] text-[#8b91a7]"
              )}
            >
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {/* Invitation boxes */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-hairline bg-surface p-8 text-center sm:col-span-2">
            <p className="text-[14px] font-medium text-ink">
              No invitations match
            </p>
            <p className="mt-1 text-[13px] text-slate">
              Try a different filter or clear the search.
            </p>
          </div>
        )}
        {list.map((inv) => {
          const st: InvitationStatus = statuses[inv.id] ?? "not-started";
          const urgent = st !== "completed" && inv.daysLeft >= 0 && inv.daysLeft <= 2;
          const progress = ready ? readInvitationProgress(inv) : null;
          return (
            <Link
              key={inv.id}
              href={`/my-interviews/${inv.id}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c9c6f5] hover:shadow-lift"
            >
              {/* Hover accent rail */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-gradient-to-b from-accent to-violet transition-transform duration-300 group-hover:scale-y-100"
              />

              <div className="flex items-start gap-3.5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold text-white transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: inv.companyColor }}
                >
                  {inv.companyInitials}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[15px] font-semibold text-ink">
                      {inv.role}
                    </span>
                    <Badge tone={statusTone(st)}>{statusLabel(st)}</Badge>
                    {urgent && (
                      <Badge tone="neutral" className="text-[#c23b3b]">
                        Closing soon
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-slate">
                    {inv.company} · invited Oct {inv.invitedAt.slice(-2)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-[#fbfbfe] p-3 text-[12px] text-slate">
                <span
                  className={cn(
                    "flex items-center gap-1.5",
                    st === "completed"
                      ? ""
                      : inv.daysLeft < 0
                        ? "text-[#c23b3b]"
                        : urgent
                          ? "text-[#c23b3b] font-medium"
                          : "text-amber"
                  )}
                >
                  <Clock size={12} className="shrink-0" />
                  {st === "completed"
                    ? `Done · was due ${formatDeadline(inv.deadline)}`
                    : `Due ${formatDeadline(inv.deadline)}`}
                </span>
                <span className="flex items-center gap-1.5">
                  {inv.mode === "one-way" ? <Video size={12} className="shrink-0" /> : <Radio size={12} className="shrink-0" />}
                  {inv.mode === "one-way" ? "One-way video" : "Live interview"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer size={12} className="shrink-0" />~{inv.durationMinutes} min
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquareText size={12} className="shrink-0" />
                  {inv.questionCount} questions
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3.5">
                <span
                  className={cn(
                    "text-[12px] font-medium text-slate transition-colors group-hover:text-ink"
                  )}
                >
                  {st === "in-progress" && progress
                    ? `${progress.answered} of ${progress.total} answered`
                    : st === "completed"
                      ? "Your answers are with the team"
                      : "Ready when you are"}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white transition-all duration-200 group-hover:bg-accent-strong group-hover:shadow-[0_4px_14px_rgba(98,88,232,0.35)]"
                  )}
                >
                  {st === "completed"
                    ? "View"
                    : st === "in-progress"
                      ? `Continue · Q${(progress?.answered ?? 0) + 1}`
                      : "Start"}
                  <ArrowRight
                    size={13}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
