"use client";

import { useEffect, useState } from "react";
import {
  CircleDot,
  Clock,
  RotateCcw,
  Video,
  ArrowRight,
} from "lucide-react";
import { INVITATIONS } from "@/lib/candidate-data";
import { useCamera } from "@/lib/use-camera";
import { CameraPreview } from "@/components/interview/camera-preview";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime } from "@/lib/utils";

const SAMPLE_QUESTIONS = INVITATIONS.flatMap((i) =>
  i.questions.slice(0, 2).map((q) => ({ ...q, from: i.role }))
).slice(0, 6);

type Phase = "idle" | "prep" | "recording" | "done";

export function PracticeRoom() {
  const camera = useCamera();
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);

  const question = SAMPLE_QUESTIONS[qIndex];

  useEffect(() => {
    if (phase !== "prep" && phase !== "recording") {
      return;
    }
    setElapsed(0);
    const limit = phase === "prep" ? question.prepSeconds : question.recordingLimitSeconds;
    const t = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= limit) {
          setPhase(phase === "prep" ? "recording" : "done");
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, question.prepSeconds, question.recordingLimitSeconds]);

  const start = () => setPhase("prep");
  const stop = () => setPhase("done");
  const again = () => {
    setQIndex((i) => (i + 1) % SAMPLE_QUESTIONS.length);
    setPhase("idle");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-accent">
        Practice room · no stakes, nothing is saved
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
        Warm up before the real thing
      </h1>
      <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-slate">
        Answer a sample question under the same timers as a real interview.
        Practice never leaves this page and unlimited retries are allowed.
      </p>

      <div className="mt-6 rounded-3xl border border-hairline bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone="accent">Sample question</Badge>
          <span className="text-[11.5px] text-slate">
            Similar to questions asked for {question.from}
          </span>
        </div>
        <p className="mt-3 text-[17px] font-medium leading-snug text-ink">
          “{question.prompt}”
        </p>
        <div className="mt-3 flex items-center gap-3 border-t border-hairline pt-3 text-[12px] text-slate">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {formatTime(question.prepSeconds)} prep
          </span>
          <span className="flex items-center gap-1">
            <Video size={12} /> {formatTime(question.recordingLimitSeconds)} max
          </span>
        </div>

        <div className="mt-5">
          <CameraPreview
            camera={camera}
            frameClassName="h-56 sm:h-64"
            ctaLabel="Turn on camera to practice"
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {phase === "prep" && (
              <span className="flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1.5 text-[12.5px] font-medium text-accent-strong">
                <Clock size={12} />
                Prep time left: {formatTime(Math.max(0, question.prepSeconds - elapsed))}
              </span>
            )}
            {phase === "recording" && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#fdf0f0] px-3 py-1.5 text-[12.5px] font-medium text-[#c23b3b]">
                <CircleDot size={12} className="animate-pulse" />
                Practicing… {formatTime(elapsed)}
              </span>
            )}
            {phase === "done" && (
              <span className="text-[12.5px] font-medium text-success">
                Take complete — nothing was saved anywhere.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {phase === "idle" && (
              <button
                onClick={start}
                className={buttonClasses("primary", "md")}
              >
                Start practice
                <ArrowRight size={15} />
              </button>
            )}
            {phase === "prep" && camera.hasVideo && (
              <button onClick={() => setPhase("recording")} className={buttonClasses("primary", "md")}>
                <Video size={15} /> Skip prep & record
              </button>
            )}
            {phase === "recording" && (
              <button onClick={stop} className={buttonClasses("outline", "md")}>
                <span className="h-2.5 w-2.5 rounded-sm bg-[#c23b3b]" />
                Stop
              </button>
            )}
            {phase === "done" && (
              <>
                <button onClick={() => setPhase("idle")} className={buttonClasses("outline", "md")}>
                  <RotateCcw size={14} /> Same question again
                </button>
                <button onClick={again} className={buttonClasses("primary", "md")}>
                  Next sample <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <p className={cn("mt-6 text-center text-[12px] text-[#9aa0b4]")}>
        When you feel ready, open your invitations from the dashboard and start
        the real interview.
      </p>
    </div>
  );
}
