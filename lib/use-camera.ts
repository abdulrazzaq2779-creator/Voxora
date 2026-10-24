"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

export interface CameraIssue {
  name: string;
  message: string;
}

export interface DeviceOption {
  deviceId: string;
  label: string;
  kind: "videoinput" | "audioinput";
}

const ERROR_HINTS: Record<string, string> = {
  NotAllowedError:
    "Permission was declined. Allow camera and microphone access from the browser's address bar, then try again.",
  PermissionDeniedError:
    "Permission was declined. Allow camera and microphone access from the browser's address bar, then try again.",
  NotFoundError:
    "No camera or microphone was found on this device. Connect one and try again.",
  DevicesNotFoundError:
    "No camera or microphone was found on this device. Connect one and try again.",
  NotReadableError:
    "Your camera or microphone is already in use by another app. Close it and try again.",
  TrackStartError:
    "Your camera or microphone is already in use by another app. Close it and try again.",
  OverconstrainedError:
    "That camera is no longer available. Pick another device and try again.",
  SecurityError:
    "Camera access is blocked because this page isn't running over HTTPS.",
  AbortError: "The camera couldn't be started. Try again in a moment.",
};

function toIssue(error: unknown): CameraIssue {
  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name: unknown }).name)
      : "Error";
  return {
    name,
    message:
      ERROR_HINTS[name] ??
      "We couldn't start your camera. Check that no other app is using it, then try again.",
  };
}

function friendlyDeviceLabel(device: MediaDeviceInfo, index: number, kind: DeviceOption["kind"]) {
  if (device.label) return device.label;
  return kind === "videoinput" ? `Camera ${index + 1}` : `Microphone ${index + 1}`;
}

/**
 * Camera + microphone access for the interview room and the device test.
 *
 * The critical detail: the <video> element must exist BEFORE the stream is
 * attached, and it must stay mounted for the whole session — assigning
 * `srcObject` to a ref that is still null is what produced a black preview.
 * Consumers render the video permanently and pass the `videoProps` below.
 */
export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [issue, setIssue] = useState<CameraIssue | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [level, setLevel] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const meterRef = useRef<number | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (meterRef.current !== null) {
      window.clearInterval(meterRef.current);
      meterRef.current = null;
    }
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
    setHasVideo(false);
    setHasAudio(false);
    setVideoReady(false);
    setLevel(0);
  }, []);

  // Release the camera when the component unmounts.
  useEffect(() => stopTracks, [stopTracks]);

  // Attach the stream to the (always mounted) video element.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    const play = el.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {
        /* Autoplay can be blocked; the user can still press play natively. */
      });
    }
  }, [stream]);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    const list = await navigator.mediaDevices.enumerateDevices();
    const next: DeviceOption[] = [];
    let videoIndex = 0;
    let audioIndex = 0;
    list.forEach((device) => {
      if (device.kind === "videoinput") {
        next.push({
          deviceId: device.deviceId,
          label: friendlyDeviceLabel(device, videoIndex, "videoinput"),
          kind: "videoinput",
        });
        videoIndex += 1;
      } else if (device.kind === "audioinput") {
        next.push({
          deviceId: device.deviceId,
          label: friendlyDeviceLabel(device, audioIndex, "audioinput"),
          kind: "audioinput",
        });
        audioIndex += 1;
      }
    });
    setDevices(next);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    const onChange = () => {
      refreshDevices();
    };
    navigator.mediaDevices.addEventListener?.("devicechange", onChange);
    return () =>
      navigator.mediaDevices.removeEventListener?.("devicechange", onChange);
  }, [refreshDevices]);

  const startMeter = useCallback((source: MediaStream) => {
    const track = source.getAudioTracks()[0];
    if (!track) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    try {
      const ctx = new Ctor();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const source_ = ctx.createMediaStreamSource(new MediaStream([track]));
      source_.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const x = (data[i] - 128) / 128;
          sum += x * x;
        }
        const rms = Math.sqrt(sum / data.length);
        const next = Math.min(1, rms * 3.2);
        // Only re-render when the level actually changed — the meter ticks
        // several times a second and must not churn the video element.
        setLevel((prev) => (Math.abs(prev - next) > 0.04 ? next : prev));
      };
      tick();
      meterRef.current = window.setInterval(tick, 120);
    } catch {
      // Metering is a nicety — never block the interview on it.
    }
  }, []);

  const enable = useCallback(
    async (nextDeviceId?: string): Promise<MediaStream | null> => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        setIssue({
          name: "Unsupported",
          message:
            "This browser can't provide a live camera preview. The demo will run in prototype mode instead.",
        });
        return null;
      }

      setStatus("requesting");
      setIssue(null);

      const videoConstraints: MediaTrackConstraints | boolean = nextDeviceId
        ? { deviceId: { exact: nextDeviceId } }
        : true;

      // Ask for both, then degrade gracefully: camera-only, then mic-only.
      let acquired: MediaStream | null = null;
      let gotVideo = false;
      let gotAudio = false;
      let lastError: unknown = null;

      try {
        acquired = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true,
        });
        gotVideo = acquired.getVideoTracks().length > 0;
        gotAudio = acquired.getAudioTracks().length > 0;
      } catch (error) {
        lastError = error;
        try {
          acquired = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false,
          });
          gotVideo = acquired.getVideoTracks().length > 0;
          gotAudio = false;
        } catch (videoError) {
          lastError = videoError;
          try {
            acquired = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            gotVideo = false;
            gotAudio = acquired.getAudioTracks().length > 0;
          } catch (audioError) {
            lastError = audioError;
            acquired = null;
          }
        }
      }

      if (!acquired) {
        const issue = toIssue(lastError);
        setStatus(issue.name === "NotAllowedError" ? "denied" : "error");
        setIssue(issue);
        return null;
      }

      stopTracks();
      streamRef.current = acquired;
      setStream(acquired);
      setHasVideo(gotVideo);
      setHasAudio(gotAudio);
      setStatus("ready");
      setVideoReady(false);
      if (gotAudio) startMeter(acquired);
      refreshDevices();

      const active = acquired.getVideoTracks()[0];
      const settings = active?.getSettings?.();
      if (settings?.deviceId) setDeviceId(settings.deviceId);

      return acquired;
    },
    [refreshDevices, startMeter, stopTracks]
  );

  const switchDevice = useCallback(
    async (nextDeviceId: string) => {
      setDeviceId(nextDeviceId);
      await enable(nextDeviceId);
    },
    [enable]
  );

  const disable = useCallback(() => {
    stopTracks();
    setStatus("idle");
    setIssue(null);
  }, [stopTracks]);

  const retry = useCallback(() => enable(), [enable]);

  /**
   * Stable callback ref. It must keep the same identity across renders:
   * React re-runs a changed callback ref with null and then the element,
   * and re-assigning `srcObject` restarts the media pipeline — which used to
   * make the preview flicker whenever the mic meter ticked.
   */
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  const handleLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const el = e.currentTarget;
      setVideoReady(el.videoWidth > 0 && el.videoHeight > 0);
    },
    []
  );

  /** Spread onto the <video> element so the stream always has a host. */
  const videoProps = {
    ref: attachVideo,
    onLoadedMetadata: handleLoadedMetadata,
  };

  const cameras = devices.filter((d) => d.kind === "videoinput");
  const microphones = devices.filter((d) => d.kind === "audioinput");
  const activeCamera = cameras.find((c) => c.deviceId === deviceId);

  return {
    status,
    issue,
    stream,
    hasVideo,
    hasAudio,
    videoReady,
    mirrored,
    setMirrored,
    level,
    devices,
    cameras,
    microphones,
    deviceId,
    activeCameraLabel: activeCamera?.label ?? "",
    switchDevice,
    enable,
    disable,
    retry,
    videoProps,
  };
}

export type UseCamera = ReturnType<typeof useCamera>;
