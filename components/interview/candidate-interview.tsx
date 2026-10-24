"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Play,
  RotateCcw,
  Video,
} from "lucide-react";
import { DEMO_INTERVIEW_QUESTIONS } from "@/lib/data";
import { writeStage } from "@/lib/candidate-stage";
import { readDeviceTest } from "@/lib/device-test";
import { useCamera } from "@/lib/use-camera";
import { CameraPreview } from "@/components/interview/camera-preview";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime } from "@/lib/utils";

type Phase = "prep" | "recording" | "review";

export function CandidateInterview() {
  const router = useRouter();
  const camera = useCamera();

  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("prep");
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [deviceTested, setDeviceTested] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const question = DEMO_INTERVIEW_QUESTIONS[qIndex];
  const isLast = qIndex === DEMO_INTERVIEW_QUESTIONS.length - 1;

  /* ---------- timers ---------- */
  useEffect(() => {
    if (phase !== "prep") return;
    setElapsed(0);
    const t = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= question.prepSeconds) return 0;
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, qIndex, question.prepSeconds]);

  useEffect(() => {
    if (phase !== "recording") return;
    setElapsed(0);
    const t = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= question.recordingLimitSeconds) {
          stopRecording();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, question.recordingLimitSeconds]);

  // Record that the demo interview has started, so the portal shows progress.
  useEffect(() => {
    writeStage("in-progress");
  }, []);

  // Surface the earlier device test result (this browser tab only).
  useEffect(() => {
    setDeviceTested(readDeviceTest()?.passed === true);
  }, []);

  // Warn before closing/refreshing while a take is in progress.
  useEffect(() => {
    if (phase !== "recording") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy browsers require returnValue to be set to show the prompt.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

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

  const stopRecording = useCallback(() => {
    setPhase("review");
    setElapsed(0);
    recorderRef.current?.stop();
    recorderRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retake = () => {
    setPreviewUrl(null);
    setPhase("prep");
  };

  const continue_ = () => {
    if (isLast) {
      setDone(true);
      camera.disable();
      router.push("/interview/demo/complete");
    } else {
      setQIndex((i) => i + 1);
      setPhase("prep");
    }
  };

  const isRecording = phase === "recording";
  const canRecord = camera.hasVideo && phase === "prep";

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-start">
      {/* Main panel */}
      <div>
        <div className="rounded-3xl border border-hairline bg-surface p-4 shadow-card sm:p-6">
          {/* Progress */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {DEMO_INTERVIEW_QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i < qIndex
                      ? "w-8 bg-success"
                      : i === qIndex
                        ? "w-12 bg-gradient-to-r from-accent to-violet"
                        : "w-8 bg-[#e6e8f0]"
                  )}
                />
              ))}
            </div>
            <span className="text-[12px] font-medium text-slate">
              Question {qIndex + 1} of {DEMO_INTERVIEW_QUESTIONS.length}
            </span>
          </div>

          {/* Live camera preview */}
          <CameraPreview camera={camera} className="mt-4 border-0 bg-transparent p-0 shadow-none">
            {deviceTested && camera.status === "idle" && (
              <p className="mt-3 flex items-center gap-2 text-[12px] font-medium text-success">
                <Check size={13} />
                Device test passed earlier in this session
              </p>
            )}
          </CameraPreview>

          {/* Status / controls bar */}
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

            <div className="flex items-center gap-2.5">
              {canRecord && (
                <button onClick={startRecording} className={buttonClasses("primary", "md")}>
                  <Video size={15} />
                  Start recording
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Answer review / next */}
        {phase === "review" && camera.hasVideo && (
          <div className="mt-4 rounded-3xl border border-hairline bg-surface p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-ink">
                Review your answer
              </h3>
              <Badge tone="neutral">
                {previewUrl ? "Recorded locally" : "Prototype — no local recording available"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {previewUrl ? (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses("outline", "sm")}
                >
                  <Play size={13} /> Open playback
                </a>
              ) : null}
              <button onClick={retake} className={buttonClasses("outline", "sm")}>
                <RotateCcw size={13} /> Retake answer
              </button>
              <button onClick={continue_} className={buttonClasses("primary", "md", "ml-auto")}>
                {isLast ? "Finish interview" : "Next question"}
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {phase === "review" && !camera.hasVideo && (
          <div className="mt-4 rounded-3xl border border-dashed border-hairline bg-surface p-5 text-center">
            <p className="text-[13px] text-slate">
              Demo flow continues in prototype mode — nothing is uploaded
              anywhere.
            </p>
            <button onClick={continue_} className={buttonClasses("primary", "md", "mt-3")}>
              {isLast ? "Finish interview" : "Next question"}
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Question side panel */}
      <aside className="space-y-4">
        <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Current question
          </span>
          <p className="mt-2.5 text-[15px] font-medium leading-snug text-ink">
            “{question.prompt}”
          </p>
          <div className="mt-4 flex items-center gap-3 border-t border-hairline pt-3 text-[12px] text-slate">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatTime(question.prepSeconds)} prep
            </span>
            <span className="flex items-center gap-1">
              <Video size={12} /> {formatTime(question.recordingLimitSeconds)} max
            </span>
          </div>
        </div>
        <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
            Interview checklist
          </span>
          <ul className="mt-3 space-y-2 text-[13px] text-slate">
            {[
              "Find a quiet, well-lit space",
              "Keep answers focused — the timer caps each response",
              "You control when recording starts and stops",
              camera.hasVideo
                ? "Your recording stays in this browser"
                : "If the camera is off, you're in prototype mode",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 shrink-0 text-success" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        {done && (
          <div className="rounded-3xl border border-hairline bg-surface p-5 text-center shadow-card">
            <p className="text-[13px] text-slate">Finishing up…</p>
          </div>
        )}
      </aside>
    </div>
  );
}
