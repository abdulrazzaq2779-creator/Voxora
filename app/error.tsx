"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert, RotateCcw } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Demo prototype: surface the error in the console only; nothing is reported anywhere.
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-bg px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-hairline bg-surface p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdf3f3]">
          <TriangleAlert size={24} className="text-[#c23b3b]" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-ink">
          Something went wrong on this page
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-slate">
          This is a frontend demo, so there&apos;s nothing server-side to
          investigate — try again, or head back home. Your interview progress
          in this tab is unaffected.
        </p>
        {error.digest && (
          <p className="mt-3 text-[11.5px] text-[#9aa0b4]">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-7 flex flex-col gap-3">
          <button onClick={reset} className={buttonClasses("primary", "md", "w-full justify-center")}>
            <RotateCcw size={15} /> Try again
          </button>
          <Link href="/" className={buttonClasses("outline", "md", "w-full justify-center")}>
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
