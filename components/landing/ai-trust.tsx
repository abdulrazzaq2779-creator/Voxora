import { Database, Eye, Users } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Sparkles } from "lucide-react";

const principles = [
  {
    icon: Database,
    title: "Evidence over assumptions",
    text: "Keep feedback grounded in the candidate's actual response.",
  },
  {
    icon: Eye,
    title: "Transparency over mystery",
    text: "Clearly distinguish original answers from AI-generated summaries.",
  },
  {
    icon: Users,
    title: "People over automated decisions",
    text: "Use AI as a supporting tool, not an automatic hiring decision-maker.",
  },
];

export function AiTrust() {
  return (
    <section
      id="ai-trust"
      className="scroll-mt-20 bg-gradient-to-b from-[#eceffb] to-[#f4f5fb] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="AI with context"
          heading="Helpful insights. Human judgment."
          description="AI can help organize interview responses and surface relevant details. Your team remains responsible for interpreting the evidence and making hiring decisions."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
          {/* Transcript vs summary split */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef0f6] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate">
                Original answer
              </span>
              <div className="mt-4 space-y-2 text-[12.5px] leading-relaxed text-slate">
                <p>
                  “…the calls kept surfacing the same three complaints, so I
                  wrote a one-page problem statement…”
                </p>
                <p>
                  “…we shipped in five weeks. Support tickets dropped by
                  roughly forty percent the following quarter.”
                </p>
              </div>
              <div className="mt-4 border-t border-hairline pt-3 text-[11px] text-[#9aa0b4]">
                Candidate transcript · Q1 · 02:41
              </div>
            </div>
            <div className="rounded-2xl border border-[#dedaff] bg-surface p-5 shadow-card">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-accent-strong">
                <Sparkles size={11} />
                AI-assisted summary
              </span>
              <div className="mt-4 space-y-2.5">
                <p className="text-[13px] font-medium leading-snug text-ink">
                  Shipped a scoped decision early with quantified impact.
                </p>
                <ul className="space-y-1.5 text-[12px] leading-snug text-slate">
                  <li>· Ran discovery and secured sign-off</li>
                  <li>· Cut scope deliberately</li>
                  <li>· Reports ~40% fewer tickets</li>
                </ul>
              </div>
              <div className="mt-4 rounded-lg bg-[#f1f2f7] px-2.5 py-2 text-[10.5px] leading-snug text-slate">
                Demo content — generated for this preview, not from a real
                interview.
              </div>
            </div>
          </div>

          {/* Principles */}
          <div className="flex flex-col justify-center gap-4">
            {principles.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-4 rounded-2xl border border-hairline bg-surface/80 p-5 backdrop-blur-sm transition-shadow hover:shadow-card"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender">
                  <p.icon size={18} className="text-accent" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate">
                    {p.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
