/**
 * Configures the real demo video used by the landing page hero and showcase.
 *
 * To use a real video asset:
 *   1. Place a file such as `public/demo/vervue-demo.mp4`, then set:
 *        export const DEMO_VIDEO_URL = "/demo/vervue-demo.mp4"
 *   2. Or leave this empty and set the env var NEXT_PUBLIC_DEMO_VIDEO_URL.
 *
 * While no source is configured, the VideoPresentation component renders an
 * intentional, production-quality placeholder built from real product UI and
 * labels playback honestly as a demo preview — it never fakes playing a video.
 */
export const DEMO_VIDEO_URL =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "";

/** Static poster thumbnail. Set NEXT_PUBLIC_DEMO_VIDEO_POSTER when you add a video. */
export const DEMO_VIDEO_POSTER =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_POSTER ?? "";

export const hasVideoSource = () => DEMO_VIDEO_URL.length > 0;
