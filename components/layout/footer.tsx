import Link from "next/link";
import { Logo } from "./logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Dashboard preview", href: "/dashboard" },
      { label: "Explore the product", href: "/#product-preview" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Recruiter dashboard", href: "/dashboard" },
      { label: "Interviews", href: "/interviews" },
      { label: "Candidates", href: "/candidates" },
      { label: "Question library", href: "/questions" },
    ],
  },
  {
    title: "Experience",
    links: [
      { label: "Candidate portal", href: "/my-interviews" },
      { label: "Candidate invite", href: "/invite/demo" },
      { label: "Candidate interview", href: "/interview/demo" },
      { label: "Review workspace", href: "/candidates/demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Sign up", href: "/sign-up" },
      { label: "Privacy", href: "/#ai-trust" },
      { label: "Contact", href: "/#final-cta" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-slate">
              Better interviews. Clearer insights.
            </p>
            <p className="mt-5 max-w-[260px] text-xs leading-relaxed text-[#8f95ab]">
              This site is a frontend demonstration. All data shown is sample
              content.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[13px] font-semibold text-ink">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-[#8f95ab]">
            © {new Date().getFullYear()} Vervue AI. All rights reserved.
          </p>
          <p className="text-xs text-[#8f95ab]">
            Structured interviews. Clearer reviews. Human-led decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
