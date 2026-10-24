import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";

export function FinalCta() {
  return (
    <section id="final-cta" className="scroll-mt-20 border-t border-hairline py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-b from-[#15182c] via-[#1c2040] to-[#252a52] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,rgba(98,88,232,0.4),transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(145,133,246,0.22),transparent_70%)]"
          />
          <div className="relative">
            <LogoMark className="mx-auto h-11 w-11" />
            <h2 className="mx-auto mt-6 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[40px] sm:leading-[1.15]">
              Make room for better interviews.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
              Bring structure to candidate conversations and clarity to your
              review process.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className={buttonClasses("primary", "lg", "w-full sm:w-auto")}
              >
                Get started
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                <Compass size={16} />
                Explore the product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
