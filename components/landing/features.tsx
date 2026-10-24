import { Video, Sparkles, PanelsTopLeft } from "lucide-react";
import {
  MiniQuestionEditor,
  MiniSummaryPanel,
  MiniReviewPanel,
} from "@/components/dashboard/previews";
import { SectionHeader } from "@/components/ui/section-header";

const cards = [
  {
    icon: Video,
    title: "Structured interviews",
    description:
      "Create consistent interview experiences with role-specific questions, preparation time, and clear recording rules.",
    preview: <MiniQuestionEditor />,
  },
  {
    icon: Sparkles,
    title: "AI-assisted insights",
    description:
      "Explore concise answer summaries and relevant evidence without losing the context of the original response.",
    preview: <MiniSummaryPanel />,
  },
  {
    icon: PanelsTopLeft,
    title: "Confident reviews",
    description:
      "Keep recordings, transcripts, reviewer notes, and interview progress organized in one workspace.",
    preview: <MiniReviewPanel />,
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-hairline bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="The platform"
          heading="Everything you need to review interviews with clarity."
          description="A focused workflow that brings interview structure, candidate responses, and recruiter insights together."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="group flex flex-col rounded-2xl border border-hairline bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender transition-colors group-hover:bg-accent/90">
                <card.icon
                  size={19}
                  className="text-accent transition-colors group-hover:text-white"
                />
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                {card.description}
              </p>
              <div className="mt-5">{card.preview}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
