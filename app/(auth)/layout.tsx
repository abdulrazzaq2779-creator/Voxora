import { CheckCircle2 } from "lucide-react";
import { LogoMark } from "@/components/layout/logo";

const points = [
  "Structured interviews that treat every candidate fairly",
  "Transcripts, evidence, and AI-assisted summaries in one workspace",
  "Recruiters stay in control of every decision",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      {/* Form side */}
      <main id="main" className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-md animate-fade-up">
          {children}
        </div>
      </main>

      {/* Brand side */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-gradient-to-br from-[#181b31] via-[#1e2145] to-[#2b2f52] lg:flex lg:flex-col lg:justify-center xl:px-20 lg:px-14"
      >
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,rgba(98,88,232,0.45),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,rgba(145,133,246,0.25),transparent_70%)]" />
        <div className="relative">
          <LogoMark className="h-12 w-12" />
          <p className="mt-8 max-w-sm text-[28px] font-semibold leading-tight tracking-[-0.02em] text-white">
            Better interviews. Clearer insights.
          </p>
          <ul className="mt-9 max-w-sm space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[14.5px] leading-snug text-white/75">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#a99fff]" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
