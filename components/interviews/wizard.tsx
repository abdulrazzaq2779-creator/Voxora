"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  GripVertical,
  Trash2,
  CircleCheck,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime } from "@/lib/utils";

interface WizardQuestion {
  id: string;
  prompt: string;
}

const EXPERIENCE = ["Junior", "Mid-level", "Senior", "Lead"] as const;

const fieldClasses =
  "w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-[14px] text-ink placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none transition-colors";

// Drafts live in this browser tab's session only — nothing is uploaded.
const DRAFT_KEY = "vervue:interview-draft:v1";

function readDraft(): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-[#9aa0b4]">{hint}</span>}
    </label>
  );
}

export function InterviewWizard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const hydrated = useRef(false);

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [experience, setExperience] =
    useState<(typeof EXPERIENCE)[number]>("Senior");
  const [duration, setDuration] = useState(18);

  // Step 2
  const [questions, setQuestions] = useState<WizardQuestion[]>([
    { id: "nq1", prompt: "" },
  ]);

  // Step 3
  const [prep, setPrep] = useState(60);
  const [limit, setLimit] = useState(180);
  const [retakes, setRetakes] = useState("One retake per question");
  const [instructions, setInstructions] = useState(
    "Find a quiet space. Your browser will ask for camera and microphone access — this is only used while recording this interview."
  );

  // Restore the stored draft once on mount (client-only, so SSR markup is unchanged).
  useEffect(() => {
    const d = readDraft();
    if (d) {
      if (typeof d.step === "number") setStep(Math.max(0, Math.min(3, d.step)));
      if (typeof d.title === "string") setTitle(d.title);
      if (typeof d.description === "string") setDescription(d.description);
      if ((EXPERIENCE as readonly string[]).includes(d.experience as string))
        setExperience(d.experience as (typeof EXPERIENCE)[number]);
      if (typeof d.duration === "number") setDuration(d.duration);
      if (
        Array.isArray(d.questions) &&
        d.questions.length > 0 &&
        d.questions.every(
          (q: unknown) =>
            q !== null &&
            typeof q === "object" &&
            typeof (q as { id?: unknown }).id === "string" &&
            typeof (q as { prompt?: unknown }).prompt === "string"
        )
      ) {
        setQuestions(d.questions as WizardQuestion[]);
      }
      if (typeof d.prep === "number") setPrep(d.prep);
      if (typeof d.limit === "number") setLimit(d.limit);
      if (typeof d.retakes === "string") setRetakes(d.retakes);
      if (typeof d.instructions === "string") setInstructions(d.instructions);
      setRestored(true);
    }
    hydrated.current = true;
  }, []);

  // Persist the draft as the user works. Wait until after hydration so we
  // never clobber the stored draft with defaults.
  useEffect(() => {
    if (!hydrated.current || done) return;
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          step,
          title,
          description,
          experience,
          duration,
          questions,
          prep,
          limit,
          retakes,
          instructions,
        })
      );
    } catch {
      // Storage unavailable (private mode) — draft persistence is best-effort.
    }
  }, [step, title, description, experience, duration, questions, prep, limit, retakes, instructions, done]);

  const startOver = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setStep(0);
    setTitle("");
    setDescription("");
    setExperience("Senior");
    setDuration(18);
    setQuestions([{ id: "nq1", prompt: "" }]);
    setPrep(60);
    setLimit(180);
    setRetakes("One retake per question");
    setInstructions(
      "Find a quiet space. Your browser will ask for camera and microphone access — this is only used while recording this interview."
    );
    setRestored(false);
    setError("");
  };

  // Validation-driven navigation
  const nextStep = () => {
    if (step === 0 && !title.trim()) {
      setError("Add a job title so candidates know what they're interviewing for.");
      return;
    }
    if (step === 1) {
      const empty = questions.some((q) => !q.prompt.trim());
      if (empty) {
        setError("Every question needs a prompt — leave nothing blank.");
        return;
      }
      if (questions.length < 1) {
        setError("Add at least one question.");
        return;
      }
    }
    setError("");
    setStep((s) => Math.min(3, s + 1));
  };

  const addQuestion = () =>
    setQuestions((qs) => [...qs, { id: `nq${Date.now()}`, prompt: "" }]);

  const updateQuestion = (id: string, prompt: string) =>
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, prompt } : q))
    );

  const deleteQuestion = (id: string) =>
    setQuestions((qs) => (qs.length > 1 ? qs.filter((q) => q.id !== id) : qs));

  const moveQuestion = (id: string, dir: -1 | 1) =>
    setQuestions((qs) => {
      const i = qs.findIndex((q) => q.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= qs.length) return qs;
      const copy = [...qs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  if (done) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-hairline bg-surface px-6 py-20 text-center shadow-card">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e4f5ec]">
          <CircleCheck size={30} className="text-success" />
        </span>
        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-ink">
          Interview created (demo)
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
          This is a frontend demonstration — the interview{" "}
          <span className="font-medium text-ink">“{title}”</span> exists only in
          this browser session. No records were stored, and no invitations were
          sent.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/invite/demo" className={buttonClasses("primary", "md")}>
            Preview candidate invite
          </Link>
          <Link href="/interviews" className={buttonClasses("outline", "md")}>
            Back to interviews
          </Link>
        </div>
      </div>
    );
  }

  const steps = ["Details", "Questions", "Settings", "Review"];

  return (
    <div className="rounded-3xl border border-hairline bg-surface shadow-card">
      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-hairline px-5 py-4 sm:px-7">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 whitespace-nowrap">
            <button
              onClick={() => i < step && setStep(i)}
              aria-current={step === i ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                i === step && "bg-lavender text-accent-strong",
                i < step && "text-slate hover:bg-[#f1f2f7] hover:text-ink",
                i > step && "text-[#b7bccb]"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold",
                  i < step && "bg-accent text-white",
                  i > step && "bg-[#eceef5] text-slate"
                )}
              >
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              {label}
            </button>
            {i < steps.length - 1 && (
              <span className="h-px w-6 bg-hairline sm:w-10" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      <div className="p-5 sm:p-7">
        {/* STEP 1 — Details */}
        {step === 0 && (
          <div className="animate-fade-in">
            <div className="grid max-w-xl gap-4">
              <Field label="Job title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className={fieldClasses}
                />
              </Field>
              <Field
                label="Job description"
                hint="Shared with candidates on the invite page."
              >
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="What the role involves, and why it matters to your team…"
                  className={cn(fieldClasses, "resize-none")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Experience level">
                  <select
                    value={experience}
                    onChange={(e) =>
                      setExperience(e.target.value as (typeof EXPERIENCE)[number])
                    }
                    className={fieldClasses}
                  >
                    {EXPERIENCE.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Interview duration">
                  <div className="flex h-[42px] items-center rounded-xl border border-hairline px-3">
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={duration}
                      onChange={(e) =>
                        setDuration(Math.max(5, Math.min(60, Number(e.target.value) || 0)))
                      }
                      aria-label="Interview duration in minutes"
                      className="w-16 bg-transparent text-[14px] text-ink focus:outline-none"
                    />
                    <span className="text-[12.5px] text-slate">
                      minutes · {questions.length} questions
                    </span>
                  </div>
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Questions */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-hairline bg-[#fbfbfe] p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
                      <GripVertical size={13} className="text-[#b7bccb]" />
                      Question {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveQuestion(q.id, -1)}
                        disabled={i === 0}
                        aria-label={`Move question ${i + 1} up`}
                        className="rounded-lg p-1.5 text-slate transition-colors hover:bg-[#eceef5] hover:text-ink disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveQuestion(q.id, 1)}
                        disabled={i === questions.length - 1}
                        aria-label={`Move question ${i + 1} down`}
                        className="rounded-lg p-1.5 text-slate transition-colors hover:bg-[#eceef5] hover:text-ink disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        disabled={questions.length === 1}
                        aria-label={`Delete question ${i + 1}`}
                        className="rounded-lg p-1.5 text-slate transition-colors hover:bg-[#fdf3f3] hover:text-[#c23b3b] disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={q.prompt}
                    onChange={(e) => updateQuestion(q.id, e.target.value)}
                    rows={2}
                    placeholder="What should this interview ask?"
                    aria-label={`Prompt for question ${i + 1}`}
                    className={cn(fieldClasses, "mt-2.5 resize-none text-[13.5px]")}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addQuestion}
              className={buttonClasses("secondary", "md", "mt-4")}
            >
              <Plus size={14} />
              Add question
            </button>
          </div>
        )}

        {/* STEP 3 — Settings */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
              {[
                { label: "Preparation time", value: prep, set: setPrep, max: 300, step: 15, read: formatTime(prep) },
                { label: "Recording time limit", value: limit, set: setLimit, max: 480, step: 30, read: formatTime(limit) },
              ].map((f) => (
                <Field key={f.label} label={f.label}>
                  <div className="flex h-[42px] items-center gap-3 rounded-xl border border-hairline px-3">
                    <input
                      type="range"
                      min={0}
                      max={f.max}
                      step={f.step}
                      value={f.value}
                      onChange={(e) => f.set(Number(e.target.value))}
                      className="h-1.5 flex-1 accent-accent"
                      aria-label={f.label}
                    />
                    <span className="w-12 text-right text-[13px] font-medium text-ink">
                      {f.read}
                    </span>
                  </div>
                </Field>
              ))}
              <Field label="Retake policy">
                <select
                  value={retakes}
                  onChange={(e) => setRetakes(e.target.value)}
                  className={fieldClasses}
                >
                  <option>No retakes</option>
                  <option>One retake per question</option>
                  <option>Unlimited retakes</option>
                </select>
              </Field>
              <Field label="Candidate experience tone">
                <Badge tone="accent" className="mt-2.5">
                  Scripts suggested · humane timing defaults
                </Badge>
              </Field>
            </div>
            <div className="max-w-2xl">
              <Field
                label="Candidate instructions"
                hint="Shown before recording starts."
              >
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className={cn(fieldClasses, "resize-none")}
                />
              </Field>
            </div>
          </div>
        )}

        {/* STEP 4 — Review */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-hairline bg-[#fbfbfe] p-5">
                <h3 className="text-[15px] font-semibold text-ink">
                  Interview summary
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  {[
                    ["Job title", title],
                    ["Experience", experience],
                    ["Duration", `${duration} minutes`],
                    ["Questions", `${questions.length} open-ended`],
                    ["Prep / limit", `${formatTime(prep)} to think · ${formatTime(limit)} to answer`],
                    ["Retakes", retakes],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6">
                      <dt className="text-slate">{k}</dt>
                      <dd className="text-right font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-2xl border border-hairline bg-[#fbfbfe] p-5">
                <h3 className="text-[15px] font-semibold text-ink">Questions</h3>
                <ol className="mt-4 space-y-2.5">
                  {questions.map((q, i) => (
                    <li key={q.id} className="flex gap-2.5 text-[13px] leading-snug text-ink">
                      <span className="font-semibold text-accent">{i + 1}.</span>
                      {q.prompt}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-hairline bg-[#f1f2f7] px-4 py-3 text-[12.5px] text-slate">
              Interview is preview-only in this demo. Creating it writes state
              to this browser session only — no storage, no invitations.
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-[#f0d0d0] bg-[#fdf3f3] px-4 py-2.5 text-[13px] text-[#c23b3b]">
            {error}
          </p>
        )}

        {/* Footer nav */}
        <div className="mt-7 flex items-center justify-between border-t border-hairline pt-5">
          {step === 0 ? (
            <Link href="/interviews" className={buttonClasses("outline", "md")}>
              <ArrowLeft size={15} />
              Back to interviews
            </Link>
          ) : (
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={buttonClasses("outline", "md")}
            >
              <ArrowLeft size={15} />
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={nextStep} className={buttonClasses("primary", "md")}>
              Continue
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => {
                try {
                  sessionStorage.removeItem(DRAFT_KEY);
                } catch {
                  // ignore
                }
                setRestored(false);
                setDone(true);
                setError("");
              }}
              className={buttonClasses("primary", "md")}
            >
              Create interview
              <Check size={15} />
            </button>
          )}
        </div>

        {/* Draft note */}
        <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#9aa0b4]">
          <span>
            {restored
              ? "Draft restored — progress saves automatically in this browser tab."
              : "Progress saves automatically as a local draft in this browser tab."}
          </span>
          <button
            onClick={startOver}
            className="underline transition-colors hover:text-slate"
          >
            Start over
          </button>
        </p>
      </div>
    </div>
  );
}
