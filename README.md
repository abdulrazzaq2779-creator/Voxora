<<<<<<< HEAD
# Voxora
=======
# Vervue AI — premium video-first SaaS website

Vervue AI is an AI-assisted video interview platform. This repository contains
the complete **frontend-only** implementation: a cinematic marketing landing
page plus a full set of prototype product pages (recruiter workspace and
candidate interview experience), built with Next.js App Router, TypeScript,
Tailwind CSS v4, and Lucide icons.

## Run the project

```bash
npm install
npm run dev      # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Health check (starts an ephemeral server, verifies every route + asset, exits non-zero on failure):

```bash
npm run build
npm run smoke
```

> On some Windows setups the `npx`/`.cmd` shims fail with `'"node"' is not
> recognized`. If that happens, run the binary directly:

```bash
node node_modules/next/dist/bin/next dev
```

## Configure the real demo video

The hero and showcase video player reads a single configuration point in
`lib/video.ts`. Until a source is configured, the component renders an
intentional React-built poster scene and the play button opens a clearly
labelled *interactive demo preview* — it never fakes a playing video.

To enable a real video:

1. Create `public/demo/vervue-demo.mp4`.
2. Copy `.env.example` to `.env.local` and set
   `NEXT_PUBLIC_DEMO_VIDEO_URL="/demo/vervue-demo.mp4"` (and optionally a
   `NEXT_PUBLIC_DEMO_VIDEO_POSTER` still frame).
3. Restart the dev server. The player then becomes a real HTML5 `<video>` with
   accessible controls, keyboard support, and an error fallback.

## Camera & microphone

The camera preview on `/interview/demo` and the device test on `/invite/demo`
share one implementation (`lib/use-camera.ts` + `components/interview/camera-preview.tsx`):

- The `<video>` element is **always mounted** and the stream is attached to it
  with a stable callback ref. (Attaching `srcObject` to a ref that is still
  `null` — the old behaviour — produced a permanently black preview.)
- Camera and microphone are requested separately: a denied or missing mic no
  longer blocks the video, and a missing camera falls back to audio-only.
- Live status chips (camera / mic + level meter), a **device picker** when
  more than one camera is connected, and a **mirror toggle** for the preview.
- Permission problems are reported honestly and actionably (declined, no
  device found, device busy in another app, insecure origin).
- A successful device test is remembered for the browser tab, so the interview
  room can confirm the check was already done.

Camera access needs a secure context: `http://localhost` counts as secure, so
`npm run dev` works. On a LAN or a public host you need HTTPS.

Automated check (headless Chrome with a fake capture device — asserts that
real frames reach the `<video>` element and that the preview does not reset):

```bash
npm run build
npm start                 # in one terminal
npm run verify:camera -- http://localhost:3000/interview/demo
```

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page: hero video, trust strip, interactive showcase, features, how-it-works, full product preview, AI-trust section, final CTA |
| `/dashboard` | Recruiter overview with search/filter/sort |
| `/interviews` · `/interviews/new` | Interview management + 4-step creation wizard |
| `/interviews/[id]` | Interview detail with candidate list |
| `/candidates` · `/candidates/[id]` | Candidate pipeline |
| `/candidates/demo` | Review workspace: transcript, labelled AI summary, evidence, strengths, notes, status changes |
| `/invite/demo` | Candidate invitation, consent, camera/mic device test |
| `/my-interviews` | Candidate portal — candidates sign in here, see their invitation, and start/continue/complete their interview |
| `/interview/demo` · `/interview/demo/complete` | Candidate recording flow (prep timer, camera preview, local recording only) |
| `/questions` | Question library with add/edit/delete/reorder |
| `/reports` | Reports with clearly-labelled sample data |
| `/settings` | Settings with local demo state |
| `/sign-in` · `/sign-up` | Frontend-only auth UI |

## Frontend-only limitations (intentional)

- No backend, database, real auth, email delivery, storage, or AI API.
- Candidate recordings stay in the browser (in-memory blob) and are never
  uploaded; leaving the page discards them.
- All AI feedback is labelled sample/demo content.
- Compiles to fully static pages — no API keys are required to operate the
  site.
>>>>>>> 2e1a45f (First Commit)
