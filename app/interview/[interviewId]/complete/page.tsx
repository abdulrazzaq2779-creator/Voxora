import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, ArrowRight, Home } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { MarkComplete } from "@/components/candidate/mark-complete";
import { ConfettiBurst } from "@/components/candidate/confetti-burst";
import { INVITATIONS } from "@/lib/candidate-data";

export function generateStaticParams() {
  return INVITATIONS.map((i) => ({ interviewId: i.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}): Promise<Metadata> {
  const { interviewId } = await params;
  const inv = INVITATIONS.find((i) => i.id === interviewId);
  return {
    title: "Interview submitted",
    description: "Confirmation screen after finishing an interview, with next steps.",
  };
}

export default async function CompletionPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;
  const invitation = INVITATIONS.find((i) => i.id === interviewId);
  if (!invitation) notFound();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex h-[68px] max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo href="/my-interviews" />
          <Badge tone="outline">Demo flow</Badge>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <MarkComplete />
        <ConfettiBurst>
        <span
          style={{ animationDelay: "60ms" }}
          className="stagger-rise mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e4f5ec] shadow-[0_8px_30px_rgba(23,138,91,0.15)]"
        >
          <CircleCheck size={38} className="text-success" />
        </span>
        <h1
          style={{ animationDelay: "160ms" }}
          className="stagger-rise mt-7 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl"
        >
          Interview submitted!
        </h1>
        <p
          style={{ animationDelay: "280ms" }}
          className="stagger-rise mt-3 text-[15px] leading-relaxed text-slate"
        >
          Your responses for <span className="font-medium text-ink">{invitation?.role}</span>{" "}
          at {invitation?.company} were recorded successfully. Thank you for your
          time and effort.
        </p>

        {invitation && (
          <div
            style={{ animationDelay: "380ms" }}
            className="stagger-rise mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-hairline bg-surface p-4 shadow-card"
          >
            {[
              ["Answers recorded", String(invitation.questionCount)],
              ["Format", invitation.mode === "one-way" ? "One-way video" : "Live interview"],
              ["Estimated length", `~${invitation.durationMinutes} min`],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[11.5px] text-slate">{label}</div>
                <div className="mt-0.5 text-[13px] font-semibold text-ink">{value}</div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{ animationDelay: "480ms" }}
          className="stagger-rise mt-9 rounded-2xl border border-hairline bg-surface p-5 text-left shadow-card"
        >
          <h2 className="text-[14px] font-semibold text-ink">Next steps</h2>
          <ul className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-slate">
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              You'll receive an email confirmation shortly.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              The {invitation?.company} team reviews every answer in their own
              time — real people, no auto-rejection.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              You'll be notified here and by email once there's an update.
            </li>
          </ul>
        </div>
        </ConfettiBurst>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/my-interviews" className={buttonClasses("primary", "lg", "flex-1")}>
            Back to Dashboard
            <ArrowRight size={16} />
          </Link>
          <Link href="/my-interviews/all" className={buttonClasses("outline", "lg", "flex-1")}>
            View my interviews
          </Link>
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate transition-colors hover:text-ink"
        >
          <Home size={13} />
          Explore Vervue AI
        </Link>
      </main>
    </div>
  );
}
