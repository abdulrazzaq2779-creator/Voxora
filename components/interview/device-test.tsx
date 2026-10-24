"use client";

import { useEffect } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { CameraPreview } from "@/components/interview/camera-preview";
import { buttonClasses } from "@/components/ui/button";
import { useCamera } from "@/lib/use-camera";
import { clearDeviceTest, markDeviceTest } from "@/lib/device-test";

export function DeviceTest() {
  const camera = useCamera();
  const { status, hasVideo, hasAudio, videoReady, enable, disable } = camera;

  // Remember a successful check so the interview room can say so.
  useEffect(() => {
    if (status === "ready" && (hasVideo || hasAudio)) {
      markDeviceTest({ passed: true, hasVideo, hasAudio });
    }
  }, [status, hasVideo, hasAudio]);

  const turnOff = () => {
    disable();
    // A stale "device test passed" badge must not outlive the test itself.
    clearDeviceTest();
  };

  const passed = status === "ready" && (hasVideo || hasAudio);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">
            Test your camera & microphone
          </h2>
          <p className="mt-1 text-[12.5px] text-slate">
            Only runs once you click — nothing is sent anywhere.
          </p>
        </div>
        {status !== "idle" && (
          <button
            onClick={() => (passed ? turnOff() : enable())}
            className={buttonClasses("outline", "sm")}
          >
            <RotateCcw size={13} />
            {passed ? "Turn off" : "Restart test"}
          </button>
        )}
      </div>

      <CameraPreview
        camera={camera}
        frameClassName="h-44"
        ctaLabel="Test camera & microphone"
        className="mt-3 border-0 bg-transparent p-0 shadow-none"
      />

      {passed && (
        <p className="mt-3 flex items-center gap-2 text-[12.5px] font-medium text-success">
          <CheckCircle2 size={14} />
          {hasVideo && hasAudio
            ? "Camera and microphone are working. You're all set."
            : hasVideo
              ? "Camera is working — no microphone was detected, so answers are video only."
              : "Microphone is working — no camera was detected, so answers are audio only."}
        </p>
      )}
      {status === "ready" && !videoReady && hasVideo && (
        <p className="mt-3 text-[12.5px] text-slate">
          Waiting for the first video frames from your camera…
        </p>
      )}
    </div>
  );
}
