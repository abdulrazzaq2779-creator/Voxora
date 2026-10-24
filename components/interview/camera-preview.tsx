"use client";

import {
  Camera,
  CameraOff,
  FlipHorizontal,
  LoaderCircle,
  Mic,
  MicOff,
  TriangleAlert,
  VideoOff,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UseCamera } from "@/lib/use-camera";

function MicMeter({ level, active }: { level: number; active: boolean }) {
  const bars = [0.18, 0.38, 0.62, 0.85];
  return (
    <span className="flex h-3.5 items-end gap-[3px]" aria-hidden="true">
      {bars.map((threshold) => (
        <span
          key={threshold}
          className={cn(
            "w-[3px] rounded-full transition-all",
            active && level >= threshold ? "bg-success" : "bg-white/25"
          )}
          style={{ height: `${Math.round(threshold * 100)}%` }}
        />
      ))}
    </span>
  );
}

export function CameraPreview({
  camera,
  frameClassName = "h-64 sm:h-72",
  ctaLabel = "Enable camera & microphone",
  className,
  children,
}: {
  camera: UseCamera;
  frameClassName?: string;
  ctaLabel?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const {
    status,
    issue,
    hasVideo,
    hasAudio,
    videoReady,
    mirrored,
    setMirrored,
    level,
    cameras,
    deviceId,
    switchDevice,
    enable,
    retry,
    activeCameraLabel,
  } = camera;

  const live = hasVideo && videoReady;

  return (
    <div
      className={cn("rounded-2xl border border-hairline bg-surface p-5 shadow-card", className)}
      data-camera-status={status}
      data-video-ready={videoReady ? "true" : "false"}
      data-live={live ? "true" : "false"}
    >
      {/* Viewfinder */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#15182c] to-[#232743]",
          frameClassName
        )}
      >
        <video
          {...camera.videoProps}
          muted
          playsInline
          autoPlay
          aria-label="Your camera preview"
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            live ? "opacity-100" : "opacity-0",
            mirrored && "[transform:scaleX(-1)]"
          )}
        />

        {live && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5f57]" />
            Live
          </span>
        )}

        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Camera size={24} className="text-white/85" />
            </span>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/70">
              Turn on your camera to see yourself before recording. Nothing
              leaves this browser.
            </p>
            <button
              onClick={() => enable()}
              className={cn(buttonClasses("primary", "md"), "mt-4")}
            >
              <Camera size={15} />
              {ctaLabel}
            </button>
          </div>
        )}

        {status === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <LoaderCircle size={22} className="animate-spin text-white/80" />
            <p className="mt-3 text-[13px] text-white/70">
              Waiting for your browser's permission prompt…
            </p>
          </div>
        )}

        {(status === "denied" || status === "error" || status === "unsupported") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              {status === "unsupported" ? (
                <VideoOff size={20} className="text-white/70" />
              ) : (
                <CameraOff size={20} className="text-white/70" />
              )}
            </span>
            <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-white/75">
              {issue?.message ??
                "We couldn't start your camera. Check that no other app is using it, then try again."}
            </p>
            {status !== "unsupported" && (
              <button
                onClick={retry}
                className={cn(
                  buttonClasses("outline", "sm", "mt-4 border-white/25 bg-white/10 text-white hover:bg-white/15")
                )}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {status === "ready" && hasVideo && !videoReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle size={20} className="animate-spin text-white/70" />
          </div>
        )}
      </div>

      {/* Status + controls */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium",
            live
              ? "bg-[#e9f7ee] text-success"
              : hasVideo
                ? "bg-[#fdf7ea] text-amber"
                : "bg-[#f1f2f7] text-slate"
          )}
        >
          {hasVideo ? <Camera size={12} /> : <CameraOff size={12} />}
          {live
            ? activeCameraLabel || "Camera ready"
            : hasVideo
              ? "Camera starting…"
              : "Camera off"}
        </span>

        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium",
            hasAudio ? "bg-[#e9f7ee] text-success" : "bg-[#f1f2f7] text-slate"
          )}
        >
          {hasAudio ? <Mic size={12} /> : <MicOff size={12} />}
          {hasAudio ? "Mic ready" : "Mic off"}
          {hasAudio && <MicMeter level={level} active />}
        </span>

        {cameras.length > 1 && status === "ready" && (
          <label className="flex items-center gap-1.5 text-[11.5px] text-slate">
            <span className="sr-only">Camera device</span>
            <select
              value={deviceId}
              onChange={(e) => switchDevice(e.target.value)}
              className="max-w-[170px] rounded-lg border border-hairline bg-surface px-2 py-1 text-[11.5px] text-ink focus:border-[#c9c6f5] focus:outline-none"
            >
              {cameras.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {status === "ready" && (
          <button
            onClick={() => setMirrored((v) => !v)}
            aria-pressed={mirrored}
            className={cn(
              "ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors",
              mirrored
                ? "bg-lavender text-accent-strong"
                : "bg-[#f1f2f7] text-slate hover:text-ink"
            )}
          >
            <FlipHorizontal size={12} />
            Mirror {mirrored ? "on" : "off"}
          </button>
        )}
      </div>

      {status === "ready" && !hasVideo && hasAudio && (
        <p className="mt-2.5 flex items-start gap-2 text-[12px] leading-relaxed text-amber">
          <TriangleAlert size={13} className="mt-0.5 shrink-0" />
          No camera available — the interview continues with audio only.
        </p>
      )}

      {children}
    </div>
  );
}
