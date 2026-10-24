import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { VideoPresentation } from "@/components/video/video-presentation";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* subtle brand gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(98,88,232,0.1),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24">
        <div className="animate-fade-up">
          <Badge tone="accent" className="px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Introducing Vervue AI
          </Badge>
        </div>

        <h1
          className="mx-auto mt-6 max-w-3xl animate-fade-up text-4xl font-semibold leading-[1.12] tracking-[-0.03em] text-ink sm:text-6xl sm:leading-[1.08]"
          style={{ animationDelay: "80ms" }}
        >
          Every interview tells a story.
          <br />
          <span className="bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">
            See the full picture.
          </span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-slate sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Thoughtful video interviews. Structured candidate responses.
          AI-assisted insights that help your team review with clarity and
          confidence.
        </p>

        <div
          className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/dashboard"
            className={buttonClasses("primary", "lg", "w-full sm:w-auto")}
          >
            Explore the platform
            <ArrowRight size={17} />
          </Link>
          <Link
            href="#how-it-works"
            className={buttonClasses("outline", "lg", "w-full sm:w-auto")}
          >
            <PlayCircle size={17} />
            See how it works
          </Link>
        </div>

        <p
          className="mt-5 animate-fade-up text-[13px] font-medium tracking-wide text-[#8f95ab]"
          style={{ animationDelay: "320ms" }}
        >
          Structured interviews. Clearer reviews. Human-led decisions.
        </p>

        {/* Cinematic video anchor */}
        <div
          className="relative mx-auto mt-14 max-w-4xl animate-fade-up sm:mt-20"
          style={{ animationDelay: "400ms" }}
        >
          <VideoPresentation />
          {/* soft reflection */}
          <div
            aria-hidden="true"
            className="absolute inset-x-8 -bottom-10 -z-10 h-24 rounded-[100%] bg-accent/15 blur-3xl"
          />
        </div>
      </div>
    </section>
  );
}
