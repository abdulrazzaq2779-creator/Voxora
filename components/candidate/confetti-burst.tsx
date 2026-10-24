"use client";

import { useEffect, useState } from "react";

/**
 * One-shot CSS confetti burst, fired shortly after mount. Renders nothing
 * on the server (no SSR mismatch) and is skipped entirely for users who
 * prefer reduced motion.
 */
export function ConfettiBurst({ children }: { children: React.ReactNode }) {
  const [fire, setFire] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setFire(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative">
      {fire && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden"
        >
          {Array.from({ length: 40 }).map((_, i) => {
            const COLORS = ["#6258e8", "#9185f6", "#178a5b", "#b3791f", "#554bd6", "#f4b0c8"];
            const left = (i * 2.5 + (i % 5)) % 98;
            const fallDuration = 3 + ((i * 7) % 18) / 10;
            const fallDelay = ((i * 11) % 12) / 10;
            const round = i % 4 === 0;
            return (
              <span
                key={i}
                className="confetti-piece"
                style={
                  {
                    left: `${left}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                    borderRadius: round ? "50%" : "2px",
                    width: round ? 7 : 5 + (i % 3) * 2,
                    height: round ? 7 : 10 + (i % 4) * 3,
                    "--fall-duration": `${fallDuration}s`,
                    "--fall-delay": `${fallDelay}s`,
                    "--drift": `${((i * 37) % 140) - 70}px`,
                    "--spin": `${420 + ((i * 90) % 720)}deg`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}
      {children}
    </div>
  );
}
