"use client";

const KEY = "vervue:device-test:v1";

export interface DeviceTestResult {
  passed: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  at: number;
}

/** Records a successful device test for this browser tab only. */
export function markDeviceTest(result: Omit<DeviceTestResult, "at">) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...result, at: Date.now() }));
  } catch {
    // Storage unavailable — the badge is a nicety, never a requirement.
  }
}

export function readDeviceTest(): DeviceTestResult | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || typeof parsed.passed !== "boolean")
      return null;
    return parsed as DeviceTestResult;
  } catch {
    return null;
  }
}

export function clearDeviceTest() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
