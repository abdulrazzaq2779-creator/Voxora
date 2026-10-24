"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Product", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "For recruiters", href: "/#for-recruiters" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-hairline bg-[rgba(248,249,252,0.85)] shadow-[0_1px_12px_rgba(21,27,50,0.04)] backdrop-blur-md"
          : "border-transparent bg-bg"
      )}
    >
      <nav
        className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Main"
      >
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate transition-colors hover:bg-[#eceef5] hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/sign-in"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate transition-colors hover:bg-[#eceef5] hover:text-ink"
          >
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonClasses("primary", "md", "h-9 px-4 text-[13.5px]")}>
            Get started
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-ink transition-colors hover:bg-[#eceef5] md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-hairline bg-surface px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-[#f1f2f7]"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2.5">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className={buttonClasses("outline", "md", "w-full")}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className={buttonClasses("primary", "md", "w-full")}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
