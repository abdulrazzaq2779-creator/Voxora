// Functional check for the camera preview.
//
// Launches headless Chrome with a fake capture device, opens a page, clicks
// the "Enable camera & microphone" button, and asserts that real video frames
// reach the <video> element (srcObject attached, videoWidth > 0).
//
// Usage: node scripts/verify-camera.mjs <url>
// The app must already be running.

const CDP_PORT = process.env.CDP_PORT ?? "9222";
const TARGET_URL = process.argv[2] ?? "http://localhost:3996/interview/demo";
const PROFILE = process.env.CHROME_PROFILE ?? "C:/Temp/vervue-cam-profile";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeoutMs, label) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    try {
      last = await fn();
      if (last) return last;
    } catch (err) {
      last = err.message;
    }
    await sleep(250);
  }
  throw new Error(`timed out waiting for ${label} (last: ${JSON.stringify(last)})`);
}

const version = await waitFor(
  async () => {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    if (!res.ok) return null;
    return await res.json();
  },
  20000,
  "chrome devtools endpoint"
);
console.log(`browser: ${version["Browser"]}`);

async function newTarget(url) {
  const encoded = encodeURIComponent(url);
  for (const method of ["PUT", "GET"]) {
    const res = await fetch(
      `http://127.0.0.1:${CDP_PORT}/json/new?${encoded}`,
      method === "PUT" ? { method } : undefined
    );
    if (res.ok) return await res.json();
  }
  throw new Error("could not open a chrome target");
}

const target = await newTarget(TARGET_URL);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = () => reject(new Error("websocket failed"));
});

let msgId = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const res = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.result?.exceptionDetails) {
    throw new Error(
      `evaluate failed: ${res.result.exceptionDetails.text ?? "unknown"}`
    );
  }
  return res.result?.result?.value;
}

await waitFor(
  async () => (await evaluate("document.readyState")) === "complete",
  20000,
  "page load"
);

const clicked = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')]
    .find((b) => /(enable|test|turn on)\\s+camera/i.test(b.textContent || ''));
  if (!btn) return false;
  btn.click();
  return true;
})()`);
console.log(`clicked enable button: ${clicked}`);
if (!clicked) throw new Error('enable button not found on the page');

let frames = 0;
try {
  frames = await waitFor(
    async () => {
      const w = await evaluate(
        `(() => { const v = document.querySelector('video'); return v ? (v.videoWidth || 0) : 0; })()`
      );
      return typeof w === "number" && w > 0 ? w : null;
    },
    20000,
    "first video frames"
  );
  console.log(`first frames received: ${frames}px wide`);
  // The preview must STAY live: a re-render that re-attaches srcObject
  // restarts the pipeline and makes the video flash.
  await sleep(3000);
  const stable = await evaluate(`(() => {
    const v = document.querySelector('video');
    return { width: v ? v.videoWidth : 0, readyState: v ? v.readyState : -1 };
  })()`);
  console.log(
    `after 3s of idle: ${stable.width}px, readyState=${stable.readyState}`
  );
  if (!(stable.width > 0) || stable.readyState < 2) {
    problems.push("preview reset after 3s — the video element is being re-attached");
  }
} catch (err) {
  console.error(`no frames arrived: ${err.message}`);
}

const diagnostics = await evaluate(`(() => {
  const v = document.querySelector('video');
  const holder = document.querySelector('[data-camera-status]');
  return {
    cameraStatus: holder ? holder.getAttribute('data-camera-status') : null,
    videoReady: holder ? holder.getAttribute('data-video-ready') : null,
    hasSrcObject: !!(v && v.srcObject),
    videoWidth: v ? v.videoWidth : 0,
    videoHeight: v ? v.videoHeight : 0,
    readyState: v ? v.readyState : -1,
    currentTime: v ? v.currentTime : -1,
    tracks: v && v.srcObject
      ? v.srcObject.getTracks().map((t) => t.kind + '|' + (t.label || 'unlabeled') + '|' + t.readyState)
      : [],
    panelText: (document.querySelector('[data-camera-status]')?.innerText || '').slice(0, 400),
    secureContext: window.isSecureContext,
    hasMediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  };
})()`);
console.log("diagnostics:", JSON.stringify(diagnostics, null, 2));

const problems = [];

const report = await evaluate(`(() => {
  const v = document.querySelector('video');
  const holder = document.querySelector('[data-camera-status]');
  const text = document.body.innerText || '';
  return {
    videoElement: !!v,
    srcObjectAttached: !!(v && v.srcObject),
    videoWidth: v ? v.videoWidth : 0,
    videoHeight: v ? v.videoHeight : 0,
    readyState: v ? v.readyState : -1,
    tracks: v && v.srcObject
      ? v.srcObject.getTracks().map((t) => t.kind + '|' + (t.label || 'unlabeled') + '|' + t.readyState)
      : [],
    cameraStatus: holder ? holder.getAttribute('data-camera-status') : null,
    videoReady: holder ? holder.getAttribute('data-video-ready') : null,
    live: holder ? holder.getAttribute('data-live') : null,
    showsLiveBadge:
      (holder ? holder.getAttribute('data-live') : null) === 'true' ||
      /\\bLIVE\\b/i.test(text),
    showsMicReady: /Mic ready/i.test(text),
    showsMirrorToggle: /Mirror on/i.test(text),
    showsStartRecording: /Start recording/i.test(text),
    showsDeviceTestPass: /all set/i.test(text),
  };
})()`);

console.log("report:", JSON.stringify(report, null, 2));

if (!report.videoElement) problems.push("no <video> element rendered");
if (!report.srcObjectAttached) problems.push("srcObject was never attached to the video");
if (!(report.videoWidth > 0)) problems.push("video has no dimensions (no frames arriving)");
if (report.cameraStatus !== "ready") problems.push(`camera status is "${report.cameraStatus}"`);
if (report.videoReady !== "true") problems.push("data-video-ready is not true");
if (!report.showsLiveBadge) problems.push("no LIVE badge — preview is not confirmed live");
if (!report.showsMicReady) problems.push("microphone not reported ready");
if (!report.showsMirrorToggle) problems.push("mirror toggle missing");
if (TARGET_URL.includes("/interview/") && !TARGET_URL.includes("practice") && !report.showsStartRecording)
  problems.push("record button not enabled");
if (TARGET_URL.includes("/invite/") && !report.showsDeviceTestPass)
  problems.push("device test did not report a successful check");

await send("Page.close").catch(() => {});
ws.close();

if (problems.length) {
  console.error("CAMERA CHECK FAILED:");
  problems.forEach((p) => console.error(" - " + p));
  process.exit(1);
}
console.log("CAMERA CHECK PASSED: live preview is streaming to the page");
