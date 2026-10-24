import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8.5"
        fill="url(#vv-gradient)"
      />
      <path
        d="M10.2 9.5 16 22.5 21.8 9.5"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="22.5" r="2" fill="white" fillOpacity="0.9" />
      <defs>
        <linearGradient
          id="vv-gradient"
          x1="1.5"
          y1="1.5"
          x2="30.5"
          y2="30.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6258E8" />
          <stop offset="1" stopColor="#9185F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
      aria-label="Vervue AI home"
    >
      <LogoMark />
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
          Vervue <span className="text-slate">AI</span>
        </span>
      )}
    </Link>
  );
}
