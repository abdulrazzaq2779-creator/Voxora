"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Plus,
  Search,
  ChevronsUpDown,
  Clock3,
  ScanSearch,
} from "lucide-react";
import { INTERVIEWS } from "@/lib/data";
import type { Interview } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  StatCard,
  CompletionChart,
  InterviewsTable,
  PendingReviews,
  PipelineCard,
} from "@/components/dashboard/widgets";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "all" | "active" | "draft";

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const interviews = useMemo(() => {
    let list: Interview[] = INTERVIEWS.slice(0, 4);
    if (tab === "active") list = list.filter((i) => i.status === "active");
    if (tab === "draft") list = list.filter((i) => i.status === "draft");
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) || i.role.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      sortAsc
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );
  }, [query, tab, sortAsc]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title="Welcome back, Alex"
        description="Here's where your pipeline stands today. Sample data for the demo workspace."
        actions={
          <Link href="/interviews/new" className={buttonClasses("primary", "md")}>
            <Plus size={15} />
            Create interview
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active interviews"
          value="4"
          meta="2 needing your review"
          icon={<LayoutDashboard size={15} />}
        />
        <StatCard
          label="Candidates"
          value="9"
          meta="3 recording this week"
          icon={
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          }
        />
        <StatCard
          label="Avg. completion"
          value="82%"
          meta="Across all roles · sample data"
          icon={<ChevronsUpDown size={15} />}
        />
        <StatCard
          label="Reviews cleared"
          value="11"
          meta="Last 6 weeks"
          icon={<ScanSearch size={15} />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Clock3 size={15} className="text-accent" />
              Weekly activity
            </h2>
            <span className="text-[11px] text-[#9aa0b4]">Sample data</span>
          </div>
          <CompletionChart className="mt-4" />
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
          <PipelineCard />
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="rounded-2xl border border-hairline bg-surface shadow-card">
          <div className="flex flex-col gap-3 border-b border-hairline px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[15px] font-semibold text-ink">
              Recent interviews
            </h2>
            <div className="flex items-center gap-2">
              <label className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa0b4]"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search interviews…"
                  aria-label="Search interviews"
                  className="h-8 w-44 rounded-lg border border-hairline bg-[#fafbfe] pl-8 pr-3 text-[13px] text-ink placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:bg-surface focus:outline-none"
                />
              </label>
              <div className="flex rounded-lg border border-hairline p-0.5">
                {(["all", "active", "draft"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    aria-pressed={tab === t}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[12px] font-medium capitalize transition-colors",
                      tab === t
                        ? "bg-lavender text-accent-strong"
                        : "text-slate hover:text-ink"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-2 py-2">
            <div className="px-3 pb-1 pt-1.5 text-right">
              <button
                onClick={() => setSortAsc((v) => !v)}
                className="text-[11.5px] font-medium text-slate transition-colors hover:text-ink"
              >
                Sort by created {sortAsc ? "↑" : "↓"}
              </button>
            </div>
            <InterviewsTable interviews={interviews} />
          </div>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
          <PendingReviews />
        </div>
      </div>
    </div>
  );
}
