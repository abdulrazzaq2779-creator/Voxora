"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ArrowUpDown,
  ClipboardList,
  ArrowUpRight,
  Trash2,
  Edit3,
} from "lucide-react";
import { INTERVIEWS } from "@/lib/data";
import type { InterviewStatus } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusFilters: Array<"all" | InterviewStatus> = [
  "all",
  "active",
  "draft",
  "closed",
];

export default function InterviewsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | InterviewStatus>("all");
  const [sortKey, setSortKey] = useState<"date" | "candidates">("date");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);

  const interviews = useMemo(() => {
    let list = INTERVIEWS.filter((i) => !deleted.includes(i.id));
    if (status !== "all") list = list.filter((i) => i.status === status);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) || i.role.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      sortKey === "date"
        ? b.createdAt.localeCompare(a.createdAt)
        : b.candidateCount - a.candidateCount
    );
  }, [query, status, sortKey, deleted]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title="Interviews"
        description="Manage interview templates, track candidate progress, and keep reviews moving."
        actions={
          <Link href="/interviews/new" className={buttonClasses("primary", "md")}>
            <Plus size={15} />
            New interview
          </Link>
        }
      />

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative sm:w-72">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0b4]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or role…"
            aria-label="Search interviews"
            className="h-10 w-full rounded-xl border border-hairline bg-surface pl-9 pr-3 text-[13.5px] text-ink shadow-card placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl border border-hairline bg-surface p-1 shadow-card">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                  status === s
                    ? "bg-lavender text-accent-strong"
                    : "text-slate hover:text-ink"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              setSortKey((k) => (k === "date" ? "candidates" : "date"))
            }
            className={buttonClasses("outline", "md", "h-10")}
          >
            <ArrowUpDown size={14} />
            Sort: {sortKey === "date" ? "Newest" : "Candidates"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {interviews.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#d8dce8] bg-surface px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender">
            <ClipboardList size={24} className="text-accent" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-ink">
            {query || status !== "all"
              ? "No interviews match your filters"
              : "No interviews yet"}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate">
            {query || status !== "all"
              ? "Try a different search term or clear a filter to see more of your pipeline."
              : "Create your first structured interview and invite candidates to record responses."}
          </p>
          <Link
            href="/interviews/new"
            className={buttonClasses("primary", "md", "mt-6")}
          >
            <Plus size={15} />
            New interview
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline bg-[#fbfbfe] text-[11.5px] uppercase tracking-wider text-[#9aa0b4]">
                  <th className="px-5 py-3 font-medium">Interview</th>
                  <th className="px-5 py-3 font-medium">Candidates</th>
                  <th className="px-5 py-3 font-medium">Completion</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Review</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((it) => {
                  const pct =
                    it.candidateCount > 0
                      ? Math.round((it.completed / it.candidateCount) * 100)
                      : 0;
                  return (
                    <tr
                      key={it.id}
                      className="border-b border-hairline transition-colors last:border-0 hover:bg-[#fafbfe]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lavender">
                            <ClipboardList size={15} className="text-accent" />
                          </span>
                          <div>
                            <div className="font-medium text-ink">
                              {it.title}
                            </div>
                            <div className="mt-0.5 text-xs text-slate">
                              {it.role} · Created{" "}
                              {new Date(it.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate">
                        {it.candidateCount}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#eceef5]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-accent to-violet"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            it.status === "active"
                              ? "success"
                              : it.status === "draft"
                                ? "outline"
                                : "neutral"
                          }
                        >
                          {it.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <ReviewBadge status={it.reviewStatus} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Edit"
                            aria-label={`Edit ${it.title}`}
                            className="rounded-lg p-2 text-slate transition-colors hover:bg-[#f1f2f7] hover:text-ink"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            title="Delete"
                            aria-label={`Delete ${it.title}`}
                            onClick={() => setConfirmDelete(it.id)}
                            className="rounded-lg p-2 text-slate transition-colors hover:bg-[#fdf3f3] hover:text-[#c23b3b]"
                          >
                            <Trash2 size={15} />
                          </button>
                          <Link
                            href={`/candidates/${it.id}`}
                            className="inline-flex items-center gap-1 pl-1 text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
                          >
                            Open <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete interview?"
        description="This demo action only removes the item from this page's local state — no data is stored anywhere."
      >
        <div className="flex justify-end gap-2.5">
          <button
            className={buttonClasses("outline", "md")}
            onClick={() => setConfirmDelete(null)}
          >
            Cancel
          </button>
          <button
            className={buttonClasses("primary", "md", "bg-[#c23b3b] hover:bg-[#a32f2f]")}
            onClick={() => {
              if (confirmDelete) setDeleted((d) => [...d, confirmDelete]);
              setConfirmDelete(null);
            }}
          >
            Delete interview
          </button>
        </div>
      </Modal>
    </div>
  );
}
