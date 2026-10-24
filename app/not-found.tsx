import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-hairline bg-surface p-8 text-center shadow-card">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender">
            <SearchX size={24} className="text-accent" />
          </span>
          <p className="mt-5 text-[13px] font-semibold uppercase tracking-wider text-accent">
            404 — page not found
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink">
            This page doesn&apos;t exist
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-slate">
            The link may be out of date, or the demo page you&apos;re looking
            for has moved. Here&apos;s where you can go instead.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/" className={buttonClasses("primary", "md", "w-full justify-center")}>
              Back to homepage <ArrowRight size={15} />
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/sign-in" className={buttonClasses("outline", "md", "justify-center")}>
                Sign in
              </Link>
              <Link href="/my-interviews" className={buttonClasses("outline", "md", "justify-center")}>
                Candidate portal
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
