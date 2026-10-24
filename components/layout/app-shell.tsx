"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Library,
  BarChart3,
  Settings,
  Plus,
  Menu,
  X,
  CircleUserRound,
} from "lucide-react";
import { Logo } from "./logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Interviews", href: "/interviews", icon: ClipboardList },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Question Library", href: "/questions", icon: Library },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Product navigation">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
              active
                ? "bg-lavender text-accent-strong"
                : "text-slate hover:bg-[#f1f2f7] hover:text-ink"
            )}
          >
            <item.icon
              size={16}
              className={active ? "text-accent" : "text-[#9aa0b4]"}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="px-2 pt-1">
        <Logo href="/dashboard" />
      </div>
      <div className="mt-6 px-2">
        <Link
          href="/interviews/new"
          onClick={onNavigate}
          className={
            pathname === "/interviews/new"
              ? buttonClasses(
                  "primary",
                  "md",
                  "pointer-events-none opacity-60 w-full justify-center text-[13px]"
                )
              : buttonClasses("primary", "md", "w-full justify-center text-[13px]")
          }
        >
          <Plus size={14} />
          New interview
        </Link>
      </div>
      <div className="mt-5 flex-1 px-2">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="border-t border-hairline p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet text-[11px] font-semibold text-white">
            AR
          </span>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-medium text-ink">
              Alex Reyes
            </div>
            <div className="truncate text-[11px] text-slate">
              Recruiter · Nova
            </div>
          </div>
          <CircleUserRound size={16} className="ml-auto text-[#9aa0b4]" />
        </div>
        <Link
          href="/"
          onClick={onNavigate}
          className="mt-1 block rounded-xl px-3 py-2 text-[12px] text-slate transition-colors hover:bg-[#f1f2f7] hover:text-ink"
        >
          Back to website
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-hairline bg-surface lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-hairline bg-surface/90 px-4 backdrop-blur-md lg:hidden">
        <Logo href="/dashboard" compact />
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="rounded-lg p-2 text-ink transition-colors hover:bg-[#f1f2f7]"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 top-14 z-30 lg:hidden" role="dialog" aria-label="Product navigation">
          <button
            aria-label="Close navigation"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 cursor-default bg-ink/25"
          />
          <aside className="absolute inset-y-0 left-0 w-[248px] border-r border-hairline bg-surface shadow-lift pt-2">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main id="main" className="min-h-dvh lg:ml-[248px]">
        {children}
      </main>
    </div>
  );
}
