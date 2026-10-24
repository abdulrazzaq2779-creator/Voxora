import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonClasses } from "@/components/ui/button";
import {
  StatCard,
  CompletionChart,
  RecentInterviewsCard,
  PendingReviews,
  PipelineCard,
} from "@/components/dashboard/widgets";

export function ProductPreview() {
  return (
    <section
      id="product-preview"
      className="scroll-mt-20 border-t border-hairline py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="A calm workspace"
          heading="A clearer view of every interview."
          description="Bring your interview pipeline, candidate responses, and review workflow together in one calm, organized workspace."
        />

        <div className="mt-14">
          {/* Browser-style frame */}
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-lift">
            <div className="flex items-center gap-2 border-b border-hairline bg-[#fbfbfe] px-5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#eceef5]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#eceef5]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#eceef5]" />
              <span className="ml-3 flex items-center gap-1.5 rounded-md bg-[#f1f2f7] px-3 py-1 text-[11px] text-slate">
                <LayoutDashboard size={11} />
                vervue.ai/dashboard
              </span>
            </div>

            <div className="bg-bg p-4 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Active interviews"
                  value="4"
                  meta="2 with pending reviews"
                  icon={<LayoutDashboard size={15} />}
                />
                <StatCard
                  label="Candidates in progress"
                  value="3"
                  meta="Recording right now"
                  icon={<span className="h-2 w-2 animate-pulse rounded-full bg-accent" />}
                />
                <StatCard
                  label="Avg. completion"
                  value="82%"
                  meta="Across all roles · sample data"
                  icon={<ArrowRight size={15} />}
                />
              </div>

              <div className="mt-4">
                <RecentInterviewsCard />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
                  <h3 className="text-[15px] font-semibold text-ink">
                    Weekly activity
                  </h3>
                  <CompletionChart className="mt-4" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 content-start">
                  <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
                    <PipelineCard />
                  </div>
                  <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
                    <PendingReviews />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link href="/dashboard" className={buttonClasses("secondary", "lg")}>
              Explore the dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
