import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-strong shadow-[0_1px_2px_rgba(21,27,50,0.12)] active:translate-y-px",
  secondary:
    "bg-lavender text-ink hover:bg-[#e5e1ff] border border-[#dedaff]",
  outline:
    "bg-surface text-ink border border-hairline hover:border-[#c9cddc] hover:bg-[#fbfbfe] shadow-[0_1px_2px_rgba(21,27,50,0.05)]",
  ghost: "text-slate hover:text-ink hover:bg-[#eceef5]",
  danger: "bg-white text-[#c23b3b] border border-[#f0d4d4] hover:bg-[#fdf3f3]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-all duration-200 select-none whitespace-nowrap disabled:opacity-55 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  );
}
