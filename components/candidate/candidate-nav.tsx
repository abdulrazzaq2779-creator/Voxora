"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, LogOut } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const links = [
  { href: "/my-interviews", label: "Dashboard" },
  { href: "/my-interviews/all", label: "My interviews" },
  { href: "/my-interviews/settings", label: "Profile & Settings" },
  { href: "/help", label: "Help", iconOnly: true },
];

export function CandidateNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo href="/my-interviews" />
        <nav
          aria-label="Candidate navigation"
          className="hidden items-center gap-1 rounded-xl border border-hairline bg-[#fbfbfe] p-1 md:flex"
        >
          {links.map((l) => {
            const active =
              l.href === "/my-interviews"
                ? pathname === "/my-interviews"
                : pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-lavender text-accent-strong"
                    : "text-slate hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Badge tone="outline" className="hidden sm:inline-flex">
            Frontend demo
          </Badge>
          <Link
            href="/sign-in"
            className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-[#f1f2f7] hover:text-ink"
          >
            <LogOut size={13} />
            Sign out
          </Link>
        </div>
      </div>
      {/* Mobile nav row */}
      <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden sm:px-6">
        {links.map((l) => {
          const active =
            l.href === "/my-interviews"
              ? pathname === "/my-interviews"
              : pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                active
                  ? "bg-lavender text-accent-strong"
                  : "text-slate hover:text-ink"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

export function HelpLink() {
  return (
    <Link
      href="/help"
      className="flex items-center gap-2 text-[13px] font-medium text-slate transition-colors hover:text-ink"
    >
      <LifeBuoy size={15} />
      Help
    </Link>
  );
}
