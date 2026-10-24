import {
  LayoutTemplate,
  HeartHandshake,
  Sparkles,
  Users,
} from "lucide-react";

const items = [
  { icon: LayoutTemplate, label: "Structured by design" },
  { icon: HeartHandshake, label: "Candidate-conscious" },
  { icon: Sparkles, label: "AI-assisted insights" },
  { icon: Users, label: "Human-led decisions" },
];

export function TrustStrip() {
  return (
    <section aria-label="Product principles" className="border-y border-hairline bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-7 sm:justify-between sm:px-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lavender">
              <item.icon size={15} className="text-accent" />
            </span>
            <span className="text-sm font-medium text-ink">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
