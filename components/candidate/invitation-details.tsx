"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CircleHelp,
  Clock,
  Globe,
  Lightbulb,
  MessageSquareText,
  Mic,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sun,
  Timer,
  Video,
  Wifi,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeviceTest } from "@/components/interview/device-test";
import { cn } from "@/lib/utils";
import {
  readInvitationProgress,
  readInvitationStatus,
  readProfile,
  writeInvitationStatus,
  formatDeadline,
  type Invitation,
  type InvitationProgress,
  type InvitationStatus,
} from "@/lib/candidate-data";

type ConnectionCheck = "unchecked" | "checking" | "good" | "weak";

function RuleRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-[#fbfbfe] px-3.5 py-3">
      <Icon size={15} className="shrink-0 text-accent" />
      <div>
        <div className="text-[11.5px] text-slate">{label}</div>
        <div className="text-[13px] font-medium text-ink">{value}</div>
      </div>
    </div>
  );
}

export function InvitationDetails({ invitation }: { invitation: Invitation }) {
  const [status, setStatus] = useState<InvitationStatus>("not-started");
  const [name, setName] = useState("");
  const [progress, setProgress] = useState<InvitationProgress | null>(null);
  const [connection, setConnection] = useState<ConnectionCheck>("unchecked");
  const [practiced, setPracticed] = useState(false);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [showPractice, setShowPractice] = useState(false);

  useEffect(() => {
    setStatus(readInvitationStatus(invitation.id));
    setName(readProfile().name.split(" ")[0] ?? "there");
    setProgress(readInvitationProgress(invitation));
  }, [invitation]);

  const isLive = invitation.mode === "live";
  const retakes = isLive
    ? "No retakes in live interviews"
    : "Up to 2 retakes per question";
  const prepTotal = invitation.questions.reduce((s, q) => s + q.prepSeconds, 0);

  const runConnectionCheck = () => {
    setConnection("checking");
    // Demo check: measure a small fetch round-trip instead of fake waiting.
    const start = performance.now();
    fetch(window.location.href, { method: "HEAD", cache: "no-store" })
      .catch(() => null)
      .finally(() => {
        const ms = performance.now() - start;
        setConnection(ms < 800 ? "good" : "weak");
      });
  };

  const start = () => {
    writeInvitationStatus(invitation.id, status === "completed" ? status : "in-progress");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/my-interviews/all"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> My interviews
      </Link>

      {/* Invitation card */}
      <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[17px] font-semibold text-white"
              style={{ backgroundColor: invitation.companyColor }}
            >
              {invitation.companyInitials}
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
                {invitation.role}
              </h1>
              <p className="mt-0.5 text-[13px] text-slate">
                {invitation.company} · invited Oct {invitation.invitedAt.slice(-2)}
              </p>
            </div>
          </div>
          <Badge tone={status === "completed" ? "success" : status === "in-progress" ? "accent" : "amber"}>
            {status === "completed"
              ? "Completed"
              : status === "in-progress"
                ? "In Progress"
                : "Not Started"}
          </Badge>
        </div>

        {progress && status !== "completed" && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#e9f7ee] px-3.5 py-2.5 text-[12.5px] font-medium text-success">
            <CircleCheck size={14} />
            You've answered {progress.answered} of {progress.total} questions — start
            here to pick up at question {progress.answered + 1}.
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <RuleRow
            icon={Clock}
            label="Interview deadline"
            value={`${formatDeadline(invitation.deadline)} · ${invitation.daysLeft < 0 ? "passed" : `${invitation.daysLeft} day${invitation.daysLeft === 1 ? "" : "s"} left`}`}
          />
          <RuleRow
            icon={isLive ? Radio : Video}
            label="Interview type"
            value={isLive ? "Live interview" : "One-way video interview"}
          />
          <RuleRow
            icon={Timer}
            label="Estimated duration"
            value={`~${invitation.durationMinutes} minutes`}
          />
          <RuleRow
            icon={MessageSquareText}
            label="Questions"
            value={`${invitation.questionCount} recorded responses`}
          />
        </div>

        {invitation.aboutRole && (
          <div className="mt-5 rounded-2xl border border-hairline bg-[#fbfbfe] p-4">
            <h2 className="text-[13.5px] font-semibold text-ink">About the role</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate">
              {invitation.aboutRole}
            </p>
          </div>
        )}

        <div className="mt-5">
          <h2 className="text-[13.5px] font-semibold text-ink">Instructions</h2>
          <ul className="mt-2 space-y-2">
            {invitation.instructions.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate">
                <Check size={15} className="mt-0.5 shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
          {invitation.salaryNote && (
            <p className="mt-2 text-[12px] text-[#9aa0b4]">{invitation.salaryNote}</p>
          )}
        </div>
      </div>

      {/* Preparation room */}
      <section className="mt-6" aria-labelledby="prep-heading">
        <h2 id="prep-heading" className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
          Before you start — {name ? `${name}, s` : "s"}et up your space
        </h2>
        <p className="mt-1.5 text-[14px] text-slate">
          A calm two minutes here makes the interview itself much smoother.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <DeviceTest />

          <div className="space-y-4">
            {/* Lighting + connection */}
            <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
              <h3 className="text-[14px] font-semibold text-ink">Environment check</h3>
              <div className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-slate">
                <p className="flex items-start gap-2.5">
                  <Sun size={14} className="mt-0.5 shrink-0 text-amber" />
                  Face a window or lamp — light in front of you, not behind. Your
                  preview above is exactly what the recording sees.
                </p>
                <p className="flex items-start gap-2.5">
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber" />
                  Sit so your head and shoulders fill the frame, and keep your
                  eyes near the camera.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-hairline bg-[#fbfbfe] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <Wifi size={14} className="text-accent" />
                    Internet connection
                  </span>
                  {connection === "unchecked" ? (
                    <button
                      onClick={runConnectionCheck}
                      className={buttonClasses("outline", "sm")}
                    >
                      Run check
                    </button>
                  ) : connection === "checking" ? (
                    <span className="text-[12px] font-medium text-slate">
                      Checking…
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-[12px] font-medium",
                        connection === "good" ? "text-success" : "text-amber"
                      )}
                    >
                      <Globe size={13} />
                      {connection === "good" ? "Looks good" : "A little slow"}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-slate">
                  Wired or strong Wi-Fi is best. One-way recording uploads
                  after each answer, so a stable connection keeps retakes rare.
                </p>
              </div>
            </div>

            {/* Rules */}
            <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
              <h3 className="text-[14px] font-semibold text-ink">Timing & rules</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <RuleRow
                  icon={Clock}
                  label="Prep time"
                  value={`${Math.round(prepTotal / invitation.questionCount)}s per question`}
                />
                <RuleRow
                  icon={Timer}
                  label="Max answer"
                  value={`${Math.round(Math.max(...invitation.questions.map((q) => q.recordingLimitSeconds)) / 60)} min`}
                />
                <RuleRow
                  icon={RotateCcw}
                  label="Retakes"
                  value={retakes}
                />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-slate">
                {isLive
                  ? "This is a live interview — there are no retakes, so use the prep room for a real rehearsal below."
                  : "Each question shows first, then a prep countdown. Recording stops automatically at the limit; you can stop early and review before continuing."}
              </p>
            </div>
          </div>
        </div>

        {/* Practice question */}
        <div className="mt-4 rounded-2xl border border-hairline bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender">
                <CircleHelp size={17} className="text-accent" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">
                  Try a sample question
                </h3>
                <p className="text-[12.5px] text-slate">
                  Not the real interview — just to get comfortable with the flow.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPractice((v) => !v)}
              aria-expanded={showPractice}
              className={buttonClasses("outline", "sm")}
            >
              {showPractice ? "Hide practice" : "Start practice"}
            </button>
          </div>
          {showPractice && (
            <div className="mt-4 animate-fade-in">
              <p className="rounded-xl bg-[#f1f2f7] px-4 py-3 text-[14px] font-medium leading-relaxed text-ink">
                “Tell me about a piece of work you're proud of — two minutes,
                informal.”
              </p>
              <textarea
                value={practiceAnswer}
                onChange={(e) => setPracticeAnswer(e.target.value)}
                rows={3}
                placeholder="Speak your answer out loud, then jot the two or three points you want to remember…"
                className="mt-3 w-full resize-none rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none"
              />
              {practiceAnswer.trim().length > 40 && !practiced && (
                <button
                  onClick={() => setPracticed(true)}
                  className={buttonClasses("outline", "sm", "mt-2")}
                >
                  <Check size={13} /> Mark practiced
                </button>
              )}
              {practiced && (
                <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-success">
                  <Check size={13} /> Nice — that's the whole flow. You're ready.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Consent + start */}
      <div className="mt-6 rounded-3xl border border-hairline bg-surface p-5 shadow-card sm:p-7">
        <div className="flex items-start gap-2.5 rounded-2xl bg-[#f1f2f7] px-4 py-3.5 text-[13px] leading-relaxed text-slate">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" />
          <span>
            <span className="font-medium text-ink">Fair monitoring, clearly stated: </span>
            during the interview the page runs fullscreen and warns you if you
            switch tabs or leave the window. Switching doesn't fail anything —
            notes are kept for the reviewing team so they understand your
            recording in context.
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/interview/${invitation.id}`}
            onClick={start}
            className={buttonClasses("primary", "lg", "flex-1 w-full justify-center")}
          >
            {status === "in-progress"
              ? progress && progress.answered > 0
                ? `Continue at question ${progress.answered + 1}`
                : "Continue interview"
              : "Start interview"}
            <ArrowRight size={16} />
          </Link>
          {status !== "completed" && (
            <Link
              href="/interview/practice"
              className={buttonClasses("outline", "lg", "flex-1 w-full justify-center")}
            >
              <Mic size={15} />
              Warm up in the practice room
            </Link>
          )}
        </div>
        <p className="mt-4 text-center text-[11.5px] text-[#9aa0b4]">
          Demo invitation — by starting you agree to record your answers for
          this practice interview. You can stop at any time.
        </p>
      </div>
    </div>
  );
}
