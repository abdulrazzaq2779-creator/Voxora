import type { Metadata } from "next";
import { TrendingUp, Clock3, Users, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CompletionChart } from "@/components/dashboard/widgets";
import { CANDIDATES, INTERVIEWS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Reports",
  description:
    "Aggregate interview analytics: completion rates, review throughput, and role-level trends (demo data).",
};

const cards = [
  {
    icon: ClipboardCheck,
    label: "Interviews sent",
    value: String(INTERVIEWS.reduce((s, i) => s + i.candidateCount, 0)),
    meta: "All time · sample data",
  },
  {
    icon: TrendingUp,
    label: "Completion rate",
    value: "74%",
    meta: "Sample demo metric",
  },
  {
    icon: Users,
    label: "Candidates reviewed",
    value: String(CANDIDATES.filter((c) => c.reviewStatus === "reviewed").length),
    meta: "Sample demo metric",
  },
  {
    icon: Clock3,
    label: "Median review time",
    value: "1.4 days",
    meta: "Sample demo metric",
  },
];

const roleBreakdown = [
  { role: "Engineering", sent: 14, completed: 11 },
  { role: "Design", sent: 9, completed: 9 },
  { role: "Data", sent: 12, completed: 8 },
  { role: "Operations", sent: 6, completed: 2 },
  { role: "Marketing", sent: 8, completed: 8 },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title="Reports"
        description="Trends across your interviews in this demo. Every number on this page is sample data — no real analytics are tracked."
        actions={<Badge tone="amber">Sample data only</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-hairline bg-surface p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-slate">
                {c.label}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f2f7] text-slate">
                <c.icon size={15} />
              </span>
            </div>
            <div className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-ink">
              {c.value}
            </div>
            <div className="mt-1 text-[12px] text-slate">{c.meta}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr] items-start">
        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink">
              Interviews vs reviews over time
            </h2>
            <span className="text-[11px] text-[#9aa0b4]">Sample data</span>
          </div>
          <CompletionChart className="mt-5" />
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">
            Completion by role
          </h2>
          <div className="mt-5 space-y-4">
            {roleBreakdown.map((r) => (
              <div key={r.role}>
                <div className="flex justify-between text-[12.5px]">
                  <span className="font-medium text-ink">{r.role}</span>
                  <span className="text-slate">
                    {r.completed}/{r.sent}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f1f2f7]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-violet"
                    style={{ width: `${(r.completed / r.sent) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-xl bg-[#f1f2f7] px-3 py-2.5 text-[11.5px] leading-relaxed text-slate">
            Sample data generated for this demo frontend. Wire real analytics
            later by replacing this component's data source.
          </p>
        </div>
      </div>
    </div>
  );
}
