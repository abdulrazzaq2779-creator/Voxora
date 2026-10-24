import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  heading,
  description,
  center = true,
  className,
}: {
  eyebrow: string;
  heading: string;
  description?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        center && "mx-auto text-center",
        className
      )}
    >
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
        {heading}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-slate sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
