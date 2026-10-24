import { Sparkles, Video, Mic, Clock } from "lucide-react";

const transcriptLines = [
  { at: "00:07", text: "…the calls kept surfacing the same three complaints…" },
  { at: "01:52", text: "…tickets dropped by roughly forty percent…", highlight: true },
];

export function PosterScene() {
  return (
    <div className="flex h-full w-full items-end justify-center px-4 pb-6 sm:px-8 sm:pb-9">
      <div className="flex w-full max-w-3xl gap-3.5">
        {/* Candidate video frame */}
        <div className="relative aspect-[4/3] w-[46%] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-[#2b2f52] via-[#232743] to-[#1b1e33] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.65)] sm:w-[42%]">
          {/* soft “person” composition */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(145,133,246,0.28),transparent_60%)]" />
          <div className="absolute left-1/2 top-[34%] h-[30%] w-[30%] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#8f88e0] to-[#5a52b8]" />
          <div className="absolute left-1/2 top-[70%] h-[26%] w-[46%] -translate-x-1/2 rounded-t-full bg-gradient-to-b from-[#6d65c4] to-[#453f8f]" />
          {/* recording chrome */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5d5d]" />
            <span className="text-[9px] font-medium tracking-wide text-white/90">
              REC 01:52
            </span>
          </div>
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-white/70">
            <Mic size={10} />
            <span className="text-[9px]">Maya Chen</span>
          </div>
          <div className="absolute bottom-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded bg-white/15 text-white/90">
            <Video size={10} />
          </div>
        </div>

        {/* Question + transcript panel */}
        <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-sm sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a92ff]">
              Question 2 of 3
            </span>
            <span className="flex items-center gap-1 text-[9px] text-white/45">
              <Clock size={9} /> 02:41 max
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium leading-snug text-white/90 sm:text-xs">
            “Walk us through how you would debug a page that renders correctly
            locally but breaks in production.”
          </p>

          <div className="mt-3 space-y-1.5">
            {transcriptLines.map((l) => (
              <div
                key={l.at}
                className={`flex gap-2 rounded-md px-2 py-1 ${
                  l.highlight
                    ? "bg-[#6258e8]/25 ring-1 ring-inset ring-[#8a92ff]/40"
                    : "bg-white/[0.05]"
                }`}
              >
                <span className="mt-0.5 text-[9px] font-medium text-[#8a92ff]">
                  {l.at}
                </span>
                <span className="text-[10px] leading-snug text-white/60">
                  {l.text}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-[#8a92ff]/30 bg-[#6258e8]/15 px-2.5 py-1.5">
            <Sparkles size={11} className="shrink-0 text-[#a99fff]" />
            <span className="text-[9.5px] font-medium text-[#b9b2ff]">
              AI-assisted summary: “Systematic, risk-first debugging approach”
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
