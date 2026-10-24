"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { CANDIDATES } from "@/lib/data";
import type { CandidateStatus } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar } from "@/components/dashboard/avatar";
import { CandidateBadge, ReviewBadge } from "@/components/ui/status-badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const filters: Array<"all" | CandidateStatus> = [
  "all",
  "Pending review",
  "In progress",
  "Reviewed",
  "Invited",
];

export default function CandidatesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | CandidateStatus>("all");
  const [sortKey, setSortKey] = useState<"name" | "date" | "role">("date");

  const candidates = useMemo(() => {
    let list = CANDIDATES;
    if (filter !== "all") list = list.filter((c) => c.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "role") return a.role.localeCompare(b.role);
      return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    });
  }, [query, filter, sortKey]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title="Candidates"
        description="Everyone in your pipeline, with live interview status and review progress."
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative lg:w-80">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0b4]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates…"
            aria-label="Search candidates"
            className="h-10 w-full rounded-xl border border-hairline bg-surface pl-9 pr-3 text-[13.5px] text-ink shadow-card placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap rounded-xl border border-hairline bg-surface p-1 shadow-card">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                  filter === f
                    ? "bg-lavender text-accent-strong"
                    : "text-slate hover:text-ink"
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              setSortKey((k) =>
                k === "date" ? "name" : k === "name" ? "role" : "date"
              )
            }
            className={buttonClasses("outline", "md", "h-10")}
          >
            <ArrowUpDown size={14} />
            Sort: {sortKey === "date" ? "Latest" : sortKey === "name" ? "Name" : "Role"}
          </button>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#d8dce8] bg-surface px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender">
            <Users size={24} className="text-accent" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-ink">
            No candidates match your filters
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate">
            Try clearing the search or picking a different status.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline bg-[#fbfbfe] text-[11.5px] uppercase tracking-wider text-[#9aa0b4]">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Completed</th>
                  <th className="px-5 py-3 font-medium">Review</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-hairline transition-colors last:border-0 hover:bg-[#fafbfe]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} color={c.avatarColor} size="sm" />
                        <div>
                          <div className="font-medium text-ink">{c.name}</div>
                          <div className="text-[11.5px] text-slate">
                            {c.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate">{c.role}</td>
                    <td className="px-5 py-3.5">
                      <CandidateBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate">
                      {c.completedAt
                        ? new Date(c.completedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <ReviewBadge status={c.reviewStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {c.completedAt ? (
                        <Link
                          href="/candidates/demo"
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
                          aria-label={`Open review workspace for ${c.name}`}
                        >
                          Review <ArrowUpRight size={13} />
                        </Link>
                      ) : (
                        <span className="text-[12px] text-[#9aa0b4]">
                          Waiting
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
