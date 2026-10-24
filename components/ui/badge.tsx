import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "amber"
  | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[#eef0f6] text-slate",
  accent: "bg-lavender text-accent-strong",
  success: "bg-[#e4f5ec] text-success",
  amber: "bg-[#fbf1de] text-amber",
  outline: "bg-transparent text-slate border border-hairline",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
