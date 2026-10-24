import { cn } from "@/lib/utils";

export function Avatar({
  name,
  color = "#6258E8",
  size = "md",
}: {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-[12px]",
    lg: "h-12 w-12 text-[14px]",
  };
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-[0_1px_3px_rgba(21,27,50,0.2)]",
        sizes[size]
      )}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}b3)` }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
