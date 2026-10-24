"use client";

import { useState } from "react";
import { Play, TriangleAlert } from "lucide-react";
import {
  DEMO_VIDEO_URL,
  DEMO_VIDEO_POSTER,
  hasVideoSource,
} from "@/lib/video";
import { PosterScene } from "./poster-scene";
import { DemoPreviewModal } from "./demo-preview";
import { cn } from "@/lib/utils";

/**
 * The cinematic video presentation used by the hero and showcase.
 *
 * - Configure a real source in `lib/video.ts` (DEMO_VIDEO_URL) to enable a
 *   full HTML5 `<video>` player with accessible controls and an error state.
 * - With no source, the play button opens a clearly-labelled interactive
 *   demo preview. It never claims a real video is playing.
 */
export function VideoPresentation({
  className,
  aspect = "aspect-video",
}: {
  className?: string;
  aspect?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const realSource = hasVideoSource();

  return (
    <div className={cn("group relative", className)}>
      <div className="overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-[#14172b] via-[#181b31] to-[#1c2040] shadow-video">
        <div className={cn("relative w-full", aspect)}>
          {realSource && !videoError ? (
            <video
              className="absolute inset-0 h-full w-full"
              controls
              preload="metadata"
              poster={DEMO_VIDEO_POSTER || undefined}
              onError={() => setVideoError(true)}
              aria-label="Vervue AI product demo video"
            >
              <source src={DEMO_VIDEO_URL} />
              Your browser does not support video playback.
            </video>
          ) : (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(98,88,232,0.35),transparent_55%)]"
              />
              <div aria-hidden="true" className="absolute inset-0">
                <PosterScene />
              </div>

              {/* Real-source failure fallback */}
              {realSource && videoError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#14172b]/85">
                  <div className="flex max-w-sm items-start gap-3 rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-left">
                    <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber" />
                    <div>
                      <p className="text-sm font-medium text-white/90">
                        Video unavailable
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-white/60">
                        The demo video could not be loaded. Check the source
                        configured in <code className="text-[#b9b2ff]">lib/video.ts</code>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Placeholder play interaction */
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="absolute inset-0 flex items-center justify-center"
                  aria-label="Open interactive demo preview"
                >
                  <span className="sr-only">
                    Opens an interactive preview of the product workflow.
                  </span>
                  <span
                    className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 backdrop-blur-md transition-transform duration-300 group-hover:scale-105 sm:h-[84px] sm:w-[84px]"
                  >
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6258e8] to-[#9185f6] opacity-90 shadow-[0_0_40px_rgba(98,88,232,0.55)]" />
                    <Play
                      size={30}
                      fill="white"
                      className="relative ml-1 text-white sm:h-9 sm:w-9"
                    />
                  </span>
                  <span className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-medium tracking-wide text-white/80 ring-1 ring-white/15 backdrop-blur-md sm:bottom-7">
                    Interactive product preview
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <DemoPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
