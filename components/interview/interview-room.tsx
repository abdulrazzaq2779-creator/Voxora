"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Maximize,
  Minimize,
  Monitor,
  Play,
  RotateCcw,
  TriangleAlert,
  Video,
} from "lucide-react";
import { writeStage } from "@/lib/candidate-stage";
import { readDeviceTest } from "@/lib/device-test";
import {
  clearInvitationProgress,
  readInvitationProgress,
  readProfile,
  writeInvitationProgress,
  writeInvitationStatus,
  type Invitation,
} from "@/lib/candidate-data";
import { useCamera } from "@/lib/use-camera";
import { CameraPreview } from "@/components/interview/camera-preview";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime } from "@/lib/utils";

type Phase = "prep" | "recording" | "review";

interface FocusEventRecord {
  type: "blur" | "blur-start" | "return";
  at: number; // ms since interview start
}

const MAX_RETAKE_REMINDERS = 2;

export function InterviewRoom({ invitation }: { invitation: Invitation }) {
  const router = useRouter();
  const camera = useCamera();
  const questions = invitation.questions;
  const isLive = invitation.mode === "live";

  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("prep");
  const [elapsed, setElapsed] = useState(0);
  const [deviceTested, setDeviceTested] = useState(false);
  const [retakesUsed, setRetakesUsed] = useState(0);
  const [retakeNote, setRetakeNote] = useState<string | null>(null);
  const [resumedAt, setResumedAt] = useState<number | null>(null);

  /* fullscreen state */
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(true);

  /* malpractice monitoring */
  const startedAtRef = useRef<number>(Date.now());
  const [focusEvents, setFocusEvents] = useState<FocusEventRecord[]>([]);
  const [awayBanner, setAwayBanner] = useState<string | null>(null);
  const [awaySince, setAwaySince] = useState<number | null>(null);
  const [switchCount, setSwitchCount] = useState(0);
  const leavingRef = useRef(false);

  /* recording */
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const question = questions[qIndex];
  const isLast = qIndex === questions.length - 1;

  /* ---------- fullscreen ---------- */

  useEffect(() => {
    setCanFullscreen(
      typeof document !== "undefined" &&
        !!(document.documentElement.requestFullscreen ||
          (document.documentElement as unknown as { webkitRequestFullscreen?: unknown }).webkitRequestFullscreen)
    );
    setDeviceTested(readDeviceTest()?.passed === true);
    setName(readProfile().name);
    // Resume where the candidate paused ("Continue interview") instead of
    // always restarting from question 1.
    const progress = readInvitationProgress(invitation);
    if (progress && progress.nextIndex > 0 && progress.nextIndex < questions.length) {
      setQIndex(progress.nextIndex);
      setResumedAt(progress.answered);
    }
  }, [invitation, questions.length]);

  const [name, setName] = useState("");

  const syncFullscreenState = useCallback(() => {
    const fsDoc = document as Document & { webkitFullscreenElement?: Element | null };
    setIsFullscreen(!!(document.fullscreenElement ?? fsDoc.webkitFullscreenElement));
  }, []);

  // Auto-request fullscreen when the interview begins.
  useEffect(() => {
    syncFullscreenState();
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        /* the browser may require a user gesture — the kiosk bar has a button */
      });
    }
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [syncFullscreenState]);

  const toggleFullscreen = useCallback(() => {
    const el = document.documentElement as HTMLElement & {
      webkitExitFullscreen?: () => void;
    };
    if (isFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else el.webkitExitFullscreen?.();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [isFullscreen]);

  /* ---------- tab/window switch monitoring ---------- */

  useEffect(() => {
    // Recording a tab switch: blur/visibilityshow a gentle banner + a note.
    let hiddenAt: number | null = null;

    const note = (type: FocusEventRecord["type"]) => {
      setFocusEvents((events) => [
        ...events,
        { type, at: Date.now() - startedAtRef.current },
      ]);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        note("blur");
        setSwitchCount((c) => c + 1);
        setAwayBanner(
          "You left the interview. Switching tabs doesn't end your attempt, but it's recorded below and visible to the reviewing team."
        );
        setAwaySince(Date.now());
        // If a take is in flight while the tab is hidden, stop it safely so
        // no dead air is captured — the candidate resumes from review.
        if (recorderRef.current) {
          recorderRef.current.stop();
          recorderRef.current = null;
          setPhase("review");
        }
      } else {
        if (hiddenAt !== null) {
          const seconds = Math.round((Date.now() - hiddenAt) / 1000);
          setAwayBanner(
            `Welcome back — you were away for ${seconds}s. Recording paused${phase === "recording" ? " and your in-flight answer stopped" : ""}. Press continue to pick up where you left off.`
          );
          // Delay so it isn't an instant flash when returning.
          window.setTimeout(() => setAwaySince(null), 60);
          note("return");
        }
      }
    };

    const onBlur = () => {
      note("blur-start");
      setSwitchCount((c) => c + 1);
      setAwayBanner(
        "Click back into the interview window to continue. Focus switches are noted for the reviewing team."
      );
      setAwaySince(Date.now());
    };

    const onFocus = () => {
      setAwaySince(null);
      if (phase === "recording") {
        // The MediaRecorder keeps running, but the review step will surface
        // that focus was lost in this window.
      }
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!leavingRef.current && (phase === "recording" || phase === "prep")) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [phase]);

  /* ---------- status sync ---------- */

  useEffect(() => {
    writeStage("in-progress");
    writeInvitationStatus(invitation.id, "in-progress");
  }, [invitation.id]);

  /* ---------- timers ---------- */

  useEffect(() => {
    if (phase !== "prep") return;
    setElapsed(0);
    const t = setInterval(() => {
      setElapsed((e) => (e + 1 >= question.prepSeconds ? 0 : e + 1));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, qIndex, question.prepSeconds]);

  const stopRecording = useCallback(() => {
    setPhase("review");
    setElapsed(0);
    recorderRef.current?.stop();
    recorderRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    setElapsed(0);
    const t = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= question.recordingLimitSeconds) {
          stopRecordingRef.current?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, question.recordingLimitSeconds]);

  const stopRecordingRef = useRef<() => void>(stopRecording);
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const startRecording = () => {
    setPreviewUrl(null);
    setPhase("recording");
    setElapsed(0);
    const stream = camera.stream;
    if (stream && typeof MediaRecorder !== "undefined") {
      try {
        chunksRef.current = [];
        const rec = new MediaRecorder(stream);
        rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
        rec.onstop = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, {
              type: chunksRef.current[0]?.type || "video/webm",
            });
            setPreviewUrl(URL.createObjectURL(blob));
          }
        };
        rec.start();
        recorderRef.current = rec;
      } catch {
        recorderRef.current = null;
      }
    }
  };

  const retake = () => {
    if (isLive) {
      // Live interviews don't allow retakes — shouldn't be reachable, but be safe.
      setRetakeNote("Live interviews don't allow retakes.");
      return;
    }
    setRetakesUsed((n) => {
      const next = n + 1;
      if (next > MAX_RETAKE_REMINDERS) {
        setRetakeNote(
          "That was your last retake for this question — make the next take your final one."
        );
      } else {
        setRetakeNote(`Retake used (${next} of 2). The original take is discarded.`);
      }
      return next;
    });
    setPreviewUrl(null);
    setPhase("prep");
  };

  const continue_ = () => {
    // Persist progress right away so a closed tab resumes at the next question.
    writeInvitationProgress(invitation.id, qIndex + 1);
    if (isLast) {
      leavingRef.current = true;
      writeInvitationStatus(invitation.id, "completed");
      clearInvitationProgress(invitation.id);
      camera.disable();
      // Leave fullscreen before navigating so the completion page starts clean.
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      router.push(`/interview/${invitation.id}/complete`);
    } else {
      setRetakeNote(null);
      setQIndex((i) => i + 1);
      setPhase("prep");
    }
  };

  const isRecording = phase === "recording";
  const canRecord = camera.hasVideo && phase === "prep";

  return (
    <div
      className={cn(
        "min-h-dvh transition-colors",
        isFullscreen && "bg-ink p-3 sm:p-5"
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-5xl",
          isFullscreen && "rounded-2xl bg-bg p-4 shadow-lift sm:p-6"
        )}
      >
        {/* Kiosk bar: identity + fullscreen control + focus note */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-accent">
              {invitation.company} · {invitation.role}
            </span>
            {isRecording && (
              <span
                aria-live="polite"
                className="flex items-center gap-1.5 rounded-full bg-[#fdf0f0] px-2.5 py-1 text-[11.5px] font-medium text-[#c23b3b]"
              >
                {isFullscreen ? <Monitor size={12} /> : <Maximize size={12} />}
                Screen watched
              </span>
            )}
          </div>
          {canFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-[#f1f2f7] hover:text-ink"
            >
              {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
              {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          )}
        </div>

        {/* Away / focus banner */}
        {(awayBanner || awaySince !== null) && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[#f0dcae] bg-[#fdf9ec] px-4 py-3 text-[13px] leading-relaxed text-amber"
          >
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span className="flex-1">{awayBanner}</span>
            <button
              onClick={() => setAwayBanner(null)}
              className="shrink-0 rounded-lg border border-[#e5d9b0] px-2.5 py-1 text-[12px] font-medium text-amber transition-colors hover:bg-[#faf3dd]"
            >
              Continue
            </button>
          </div>
        )}
        {switchCount > 0 && !awayBanner && (
          <p className="mt-3 flex items-center gap-2 text-[12px] text-slate">
            <Monitor size={12} />
            {switchCount} focus switch{switchCount === 1 ? "" : "es"} this session —
            noted for the reviewing team alongside your answers.
          </p>
        )}

        {resumedAt !== null && switchCount === 0 && qIndex === resumedAt && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#e9f7ee] px-3 py-2 text-[12.5px] text-success">
            <Check size={13} />
            Resuming — you already answered {resumedAt} of {questions.length} questions.
          </p>
        )}

        {/* Progress */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[12.5px] font-medium text-slate">
            Question {qIndex + 1} of {questions.length}
          </span>
          <div className="flex flex-1 items-center gap-1.5">
            {questions.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < qIndex
                    ? "bg-success"
                    : i === qIndex
                      ? "bg-gradient-to-r from-accent to-violet"
                      : "bg-[#e6e8f0]"
                )}
              />
            ))}
          </div>
        </div>

        {/* Question display — prominent, always at the top */}

        <div className="mt-3 rounded-3xl border border-accent/20 bg-gradient-to-br from-[#f6f5ff] to-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-strong">
              Question {qIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2 text-[11.5px] text-slate">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatTime(question.prepSeconds)} prep
              </span>
              <span className="flex items-center gap-1">
                <Video size={12} /> {formatTime(question.recordingLimitSeconds)} max
              </span>
            </div>
          </div>
          <p className="mt-2.5 text-[17px] font-medium leading-snug text-ink sm:text-[19px]">
            “{question.prompt}”
          </p>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-start">
          {/* Camera + controls */}
          <div className="rounded-3xl border border-hairline bg-surface p-4 shadow-card sm:p-5">
            <CameraPreview
              camera={camera}
              frameClassName="h-56 sm:h-64"
              ctaLabel="Enable camera & microphone"
              className="border-0 bg-transparent p-0 shadow-none"
            />

            {retakeNote && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#fdf7ea] px-3 py-2 text-[12.5px] text-amber">
                <RotateCcw size={13} className="shrink-0" />
                {retakeNote}
              </p>
            )}

            {/* Status / controls */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {phase === "recording" ? (
                  <>
                    <span
                      aria-live="polite"
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium",
                        question.recordingLimitSeconds - elapsed <= 15
                          ? "bg-[#fdeee2] text-[#b4591a]"
                          : "bg-[#fdf0f0] text-[#c23b3b]"
                      )}
                    >
                      <CircleDot size={12} className="animate-pulse" />
                      REC {formatTime(elapsed)} ·{" "}
                      {formatTime(Math.max(0, question.recordingLimitSeconds - elapsed))} left
                    </span>
                    <button
                      onClick={stopRecording}
                      className={buttonClasses(
                        "outline",
                        "md",
                        "border-[#f0d0d0] text-[#c23b3b] hover:bg-[#fdf3f3]"
                      )}
                    >
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#c23b3b]" />
                      Stop recording
                    </button>
                  </>
                ) : phase === "prep" ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1.5 text-[12.5px] font-medium text-accent-strong">
                    <Clock size={12} />
                    Prep time left: {formatTime(Math.max(0, question.prepSeconds - elapsed))}
                  </span>
                ) : camera.hasVideo ? (
                  <span className="text-[12.5px] font-medium text-slate">
                    Answer saved locally for this session only
                  </span>
                ) : (
                  <Badge tone="outline">Prototype mode — camera not enabled</Badge>
                )}
              </div>

              {canRecord && (
                <button onClick={startRecording} className={buttonClasses("primary", "md")}>
                  <Video size={15} />
                  Start recording
                </button>
              )}
            </div>

            {/* Review / next */}
            {phase === "review" && camera.hasVideo && (
              <div className="mt-4 border-t border-hairline pt-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses("outline", "sm")}
                    >
                      <Play size={13} /> Open playback
                    </a>
                  )}
                  {!isLive && (
                    <button
                      onClick={retake}
                      disabled={retakesUsed >= 2}
                      className={buttonClasses("outline", "sm")}
                    >
                      <RotateCcw size={13} />
                      {retakesUsed >= 2 ? "No retakes left" : "Retake answer"}
                    </button>
                  )}
                  <button
                    onClick={continue_}
                    className={buttonClasses("primary", "md", "ml-auto")}
                  >
                    {isLast ? "Finish interview" : "Next question"}
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {phase === "review" && !camera.hasVideo && (
              <div className="mt-4 border-t border-dashed border-hairline pt-4 text-center">
                <p className="text-[13px] text-slate">
                  Demo flow continues in prototype mode — nothing is uploaded anywhere.
                </p>
                <button
                  onClick={continue_}
                  className={buttonClasses("primary", "md", "mt-3")}
                >
                  {isLast ? "Finish interview" : "Next question"}
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
                {deviceTested ? "Setup status" : "Interview checklist"}
              </span>
              <ul className="mt-3 space-y-2 text-[13px] text-slate">
                {(deviceTested
                  ? [
                      "Device test passed earlier in this session",
                      camera.hasVideo
                        ? "Your recording stays in this browser"
                        : "If the camera is off, you're in prototype mode",
                      "Recording always starts and stops with you",
                      "Keep answers focused — the timer caps each response",
                    ]
                  : [
                      "Find a quiet, well-lit space",
                      "Keep answers focused — the timer caps each response",
                      "You control when recording starts and stops",
                      camera.hasVideo
                        ? "Your recording stays in this browser"
                        : "If the camera is off, you're in prototype mode",
                    ]
                ).map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-success" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-strong">
                Focus tracking
              </span>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate">
                Stay in this window while recording. Tab switches are flagged
                for reviewers but never auto-submit or fail your attempt.
              </p>
              {focusEvents.length > 0 && (
                <p className="mt-2 text-[12px] text-slate">
                  {switchCount} switch{switchCount === 1 ? "" : "es"} so far.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
