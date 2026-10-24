import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { INTERVIEWS, CANDIDATES } from "@/lib/data";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar } from "@/components/dashboard/avatar";
import { CandidateBadge, ReviewBadge } from "@/components/ui/status-badge";
import { buttonClasses } from "@/components/ui/button";
import { CompletionChart } from "@/components/dashboard/widgets";

export function generateStaticParams() {
  return INTERVIEWS.map((i) => ({ interviewId: i.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}): Promise<Metadata> {
  const { interviewId } = await params;
  const interview = INTERVIEWS.find((i) => i.id === interviewId);
  if (!interview) return { title: "Interview" };
  return {
    title: interview.title,
    description: `${interview.role} interview with ${interview.questions.length} questions, ${interview.durationMinutes} minutes — demo data.`,
  };
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;
  const interview = INTERVIEWS.find((i) => i.id === interviewId);
  if (!interview) notFound();
  const candidates = CANDIDATES.filter((c) => c.interviewId === interview.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-10">
      <Link
        href="/interviews"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> All interviews
      </Link>
      <PageHeader
        title={interview.title}
        description={`${interview.role} · ${interview.questions.length} questions · ${interview.durationMinutes} minutes · demo data`}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] items-start">
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline bg-[#fbfbfe] text-[11.5px] uppercase tracking-wider text-[#9aa0b4]">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Review</th>
                  <th className="px-5 py-3 text-right font-medium">Review</th>
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
                        <Avatar name={c.name} color={c.avatarColor} />
                        <div>
                          <div className="font-medium text-ink">{c.name}</div>
                          <div className="text-[11.5px] text-slate">
                            {c.completedAt
                              ? `Completed Oct ${c.completedAt.slice(-2)}`
                              : "Not completed"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <CandidateBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <ReviewBadge status={c.reviewStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href="/candidates/demo"
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
                      >
                        Workspace <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-14 text-center">
                      <div className="text-[14px] font-medium text-ink">
                        No candidates invited yet
                      </div>
                      <div className="mt-1 text-[13px] text-slate">
                        This is a draft interview — invite candidates to start collecting responses.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">
            Interview activity
          </h2>
          <CompletionChart className="mt-4" />
          <Link
            href="/invite/demo"
            className={buttonClasses("secondary", "md", "mt-5 w-full justify-center")}
          >
            Open candidate invite preview
          </Link>
        </div>
      </div>
    </div>
  );
}
