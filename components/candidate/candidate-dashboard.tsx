"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  CircleCheck,
  CircleUserRound,
  Clock,
  MessageSquareText,
  Radio,
  Timer,
  TriangleAlert,
  Video,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INVITATIONS,
  NOTIFICATIONS,
  allStatuses,
  formatDeadline,
  markNotificationRead,
  profileCompletion,
  readInvitationProgress,
  readProfile,
  readUnreadNotificationIds,
  statusLabel,
  type Invitation,
  type InvitationStatus,
} from "@/lib/candidate-data";

/* Live countdown to the end of the deadline day. */
function deadlinePhrase(deadline: string, now: Date | null): string {
  if (!now) return "";
  const end = new Date(`${deadline}T23:59:59`).getTime();
  const ms = end - now.getTime();
  if (ms <= 0) return "closed";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days >= 1) return `${days}d ${hours}h left`;
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return hours >= 1 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export function CandidateDashboard() {
  const [statuses, setStatuses] = useState<Record<string, InvitationStatus>>({});
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof readProfile>> | null>(null);
  const [unreadIds, setUnreadIds] = useState<ReadonlySet<string>>(new Set());
  const [now, setNow] = useState<Date | null>(null);
  const [ringOn, setRingOn] = useState(false);

  useEffect(() => {
    setStatuses(allStatuses());
    setProfile(readProfile());
    setUnreadIds(readUnreadNotificationIds());
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000); // live countdown, ticks every minute
    setRingOn(true);
    return () => clearInterval(t);
  }, []);

  const completion = profile ? profileCompletion(profile) : { percent: 0, missing: [] };
  const statusOf = (inv: Invitation): InvitationStatus => statuses[inv.id] ?? "not-started";

  const active = INVITATIONS.filter((i) => statusOf(i) !== "completed");
  const upcoming = [...active].sort((a, b) => b.daysLeft - a.daysLeft);
  const inProgress = INVITATIONS.filter((i) => statusOf(i) === "in-progress");
  const completedCount = INVITATIONS.length - active.length;
  const unread = unreadIds.size;
  const mostUrgent = active
    .filter((i) => i.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0];

  const h = now?.getHours() ?? 12;
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
    {/* Welcome + profile completion */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1
                suppressHydrationWarning
                className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl"
              >
                {greeting}, {(profile?.name ?? "there").split(" ")[0]}👋
              </h1>
              <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-slate">
                Here's your interview overview. You have{" "}
                <span className="font-medium text-ink">{active.length}</span>{" "}
                interviews waiting and{" "}
                <span className="font-medium text-ink">{completedCount}</span>{" "}
                completed.
              </p>
            </div>
            {unread > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#fdf7ea] px-3 py-1.5 text-[12px] font-medium text-amber">
                <Bell size={13} />
                {unread} new notification{unread === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Profile completion — animated ring */}
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-hairline bg-[#fbfbfe] p-4">
            <span className="relative h-14 w-14 shrink-0">
              <svg
                viewBox="0 0 44 44"
                role="img"
                aria-label={`Profile ${completion.percent}% complete`}
                className="h-14 w-14 -rotate-90"
              >
                <circle
                  cx="22" cy="22" r="19"
                  fill="none" stroke="#e6e8f0" strokeWidth="4"
                />
                <circle
                  cx="22" cy="22" r="19"
                  fill="none"
                  stroke="url(#completionGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={ringOn ? 2 * Math.PI * 19 * (1 - completion.percent / 100) : 2 * Math.PI * 19}
                  style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)" }}
                />
                <defs>
                  <linearGradient id="completionGradient" gradientTransform="rotate(90)">
                    <stop offset="0%" stopColor="#6258e8" />
                    <stop offset="100%" stopColor="#9185f6" />
                  </linearGradient>
                </defs>
              </svg>
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center text-[12.5px] font-semibold text-accent-strong"
              >
                {ringOn ? `${completion.percent}%` : "…"}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-ink">
                Complete your profile
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-slate">
                {completion.percent >= 100
                  ? "Everything's in — nice work. Recruiters see a complete picture."
                  : `Add ${completion.missing.join(" and ").toLowerCase()} to get better matches.`}
              </p>
              <Link
                href="/my-interviews/settings"
                className={buttonClasses("secondary", "sm", "mt-2.5")}
              >
                <CircleUserRound size={13} />
                {completion.percent >= 100 ? "Review profile" : "Complete Profile"}
              </Link>
            </div>
          </div>
        </div>

        {/* Most urgent deadline */}
        <aside className="rounded-3xl border border-accent/25 bg-gradient-to-br from-[#f4f2ff] to-surface p-5 shadow-card">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent-strong">
            <CalendarClock size={13} />
            Next deadline
          </span>
          {mostUrgent ? (
            <>
              <h2 className="mt-2.5 text-[16px] font-semibold leading-snug text-ink">
                {mostUrgent.role}
              </h2>
              <p className="mt-0.5 text-[12.5px] text-slate">
                {mostUrgent.company} interview
              </p>
              <p
                suppressHydrationWarning
                className={cn(
                  "mt-3 flex items-center gap-1.5 text-[13px] font-medium",
                  mostUrgent.daysLeft <= 2 ? "text-[#c23b3b]" : "text-amber"
                )}
              >
                <Timer size={13} className="animate-pulse" />
                Due {formatDeadline(mostUrgent.deadline)} ·{" "}
                <span className="animate-tick">{deadlinePhrase(mostUrgent.deadline, now)}</span>
              </p>
              <Link
                href={`/my-interviews/${mostUrgent.id}`}
                className={buttonClasses("primary", "md", "mt-4 w-full justify-center")}
              >
                Start Interview
                <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <p className="mt-2 text-[13.5px] text-slate">
              No pending deadlines — you're all caught up.
            </p>
          )}
        </aside>
      </div>

      {/* Upcoming interviews */}
      <section className="mt-8" aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="upcoming-heading" className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
            Upcoming interviews
          </h2>
          <Link
            href="/my-interviews/all"
            className="text-[12.5px] font-medium text-accent transition-colors hover:text-accent-strong"
          >
            View all
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {upcoming.length === 0 && (
            <p className="rounded-2xl border border-dashed border-hairline bg-surface p-5 text-[13px] text-slate sm:col-span-2">
              Nothing waiting — every invitation on your list is completed.
            </p>
          )}
          {upcoming.map((inv, i) => {
            const st = statusOf(inv);
            return (
              <Link
                key={inv.id}
                href={`/my-interviews/${inv.id}`}
                style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}
                className="stagger-rise group rounded-2xl border border-hairline bg-surface p-4 shadow-card transition-all hover:border-[#c9c6f5] hover:shadow-lift"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-semibold text-white"
                    style={{ backgroundColor: inv.companyColor }}
                  >
                    {inv.companyInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-ink">
                      {inv.role}
                    </div>
                    <div className="text-[12px] text-slate">{inv.company}</div>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-[#9aa0b4] transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate">
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      inv.daysLeft < 0
                        ? "text-[#c23b3b]"
                        : inv.daysLeft <= 2
                          ? "text-[#c23b3b] font-medium"
                          : "text-amber"
                    )}
                    suppressHydrationWarning
                  >
                    <Clock size={12} />
                    {inv.daysLeft < 0
                      ? `Due ${formatDeadline(inv.deadline)} (passed)`
                      : `Closes in ${deadlinePhrase(inv.deadline, now)}`}
                  </span>
                  <span className="flex items-center gap-1">
                    {inv.mode === "one-way" ? <Video size={12} /> : <Radio size={12} />}
                    {inv.mode === "one-way" ? "One-way" : "Live"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquareText size={12} />
                    {inv.questionCount} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer size={12} />~{inv.durationMinutes} min
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge tone={st === "in-progress" ? "accent" : "amber"}>
                    {statusLabel(st)}
                  </Badge>
                  <span
                    className={cn(
                      buttonClasses("primary", "sm"),
                      "pointer-events-none group-hover:shadow-lift"
                    )}
                  >
                    {st === "in-progress" ? "Continue" : "Start"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Progress + notifications */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="progress-heading">
          <h2 id="progress-heading" className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
            Your interviews
          </h2>
          <div className="mt-3 divide-y divide-hairline rounded-2xl border border-hairline bg-surface shadow-card">
            {INVITATIONS.map((inv) => {
              const st = statusOf(inv);
              return (
                <Link
                  key={inv.id}
                  href={st === "completed" ? `/my-interviews/${inv.id}` : `/my-interviews/${inv.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#fafbfe]"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      st === "completed"
                        ? "bg-[#e4f5ec] text-success"
                        : st === "in-progress"
                          ? "bg-lavender text-accent-strong"
                          : "bg-[#eceef5] text-slate"
                    )}
                  >
                    {st === "completed" ? (
                      <CircleCheck size={15} />
                    ) : st === "in-progress" ? (
                      <Clock size={14} />
                    ) : (
                      <Video size={14} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium text-ink">
                      {inv.role}
                    </div>
                    <div className="text-[11.5px] text-slate">
                      {inv.company} ·{" "}
                      {st === "completed"
                        ? "Completed"
                        : st === "in-progress"
                          ? "In progress"
                          : inv.daysLeft < 0
                            ? "Deadline passed"
                            : `Due ${formatDeadline(inv.deadline)}`}
                    </div>
                  </div>
                  <Badge
                    tone={
                      st === "completed"
                        ? "success"
                        : st === "in-progress"
                          ? "accent"
                          : "amber"
                    }
                  >
                    {statusLabel(st)}
                  </Badge>
                </Link>
              );
            })}
          </div>
          {inProgress.length > 0 && (
            <div className="mt-3 rounded-2xl border border-hairline bg-surface p-4 shadow-card">
              <h3 className="text-[13px] font-semibold text-ink">Recent activity</h3>
              {inProgress.map((inv) => {
                const p = readInvitationProgress(inv);
                return (
                  <p key={inv.id} className="mt-1.5 flex items-center gap-2 text-[12.5px] text-slate">
                    <Check size={13} className="text-success" />
                    {inv.role} — {p && p.answered > 0 ? `${p.answered} of ${p.total} answers recorded` : "started but nothing recorded yet"}
                  </p>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="notif-heading">
          <h2 id="notif-heading" className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
            Notifications & reminders
          </h2>
          <div className="mt-3 space-y-2.5">
            {NOTIFICATIONS.map((n) => {
              const isUnread = unreadIds.has(n.id);
              return (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => {
                  if (isUnread) {
                    markNotificationRead(n.id);
                    setUnreadIds((prev) => {
                      const next = new Set(prev);
                      next.delete(n.id);
                      return next;
                    });
                  }
                }}
                className={cn(
                  "flex gap-3 rounded-2xl border p-4 shadow-card transition-colors hover:bg-[#fafbfe]",
                  isUnread ? "border-[#e0dcfa] bg-[#fbfaff]" : "border-hairline bg-surface"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    n.kind === "reminder"
                      ? "bg-[#fdf0f0] text-[#c23b3b]"
                      : n.kind === "tip"
                        ? "bg-[#fdf7ea] text-amber"
                        : "bg-lavender text-accent-strong"
                  )}
                >
                  {n.kind === "reminder" ? (
                    <TriangleAlert size={14} />
                  ) : n.kind === "tip" ? (
                    <Video size={14} />
                  ) : (
                    <CircleCheck size={14} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-medium text-ink">
                      {n.title}
                    </span>
                    {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate">
                    {n.body}
                  </p>
                  <span className="mt-1 block text-[11px] text-[#9aa0b4]">
                    {n.daysAgo === 0 ? "Today" : `${n.daysAgo} day${n.daysAgo === 1 ? "" : "s"} ago`}
                  </span>
                </div>
              </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
