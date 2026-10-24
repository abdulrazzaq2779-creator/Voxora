"use client";

import { useState } from "react";
import {
  CircleUserRound,
  Building2,
  SlidersHorizontal,
  HeartHandshake,
  ShieldCheck,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-[14px] text-ink placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none transition-colors";

const sections = [
  { id: "profile", label: "Profile", icon: CircleUserRound },
  { id: "org", label: "Organization", icon: Building2 },
  { id: "defaults", label: "Interview defaults", icon: SlidersHorizontal },
  { id: "experience", label: "Candidate experience", icon: HeartHandshake },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
] as const;

type SectionId = (typeof sections)[number]["id"];

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[13.5px] text-ink">{label}</span>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          on ? "bg-accent" : "bg-[#d7dae6]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            on ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("profile");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("Alex Reyes");
  const [email, setEmail] = useState("alex@novacorp.example");
  const [org, setOrg] = useState("Nova Corp");
  const [prepDefault, setPrepDefault] = useState("60 seconds");
  const [limitDefault, setLimitDefault] = useState("3 minutes");
  const [retakes, setRetakes] = useState("One retake per question");
  const [prefs, setPrefs] = useState({
    prepReminder: true,
    retakePrompt: true,
    consentFirst: true,
  });

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title="Settings"
        description="Preferences are stored in local demo state for this session only."
      />

      <div className="grid gap-5 lg:grid-cols-[210px_1fr] lg:items-start">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto rounded-2xl border border-hairline bg-surface p-2 shadow-card lg:sticky lg:top-6 lg:flex-col lg:overflow-visible"
        >
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              aria-current={active === s.id ? "true" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                active === s.id
                  ? "bg-lavender text-accent-strong"
                  : "text-slate hover:bg-[#f1f2f7] hover:text-ink"
              )}
            >
              <s.icon size={15} className={active === s.id ? "text-accent" : "text-[#9aa0b4]"} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card sm:p-7">
          {active === "profile" && (
            <div className="animate-fade-in max-w-md space-y-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet text-[15px] font-semibold text-white">
                  AR
                </span>
                <div>
                  <div className="text-[14.5px] font-medium text-ink">{name}</div>
                  <Badge tone="accent" className="mt-1">Recruiter seat · demo</Badge>
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClasses} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClasses} type="email" />
              </label>
            </div>
          )}

          {active === "org" && (
            <div className="animate-fade-in max-w-md space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Organization name</span>
                <input value={org} onChange={(e) => setOrg(e.target.value)} className={fieldClasses} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Workspace URL (read-only in demo)</span>
                <input value="vervue.ai/nova" readOnly className={cn(fieldClasses, "bg-[#f6f7fc] text-slate")} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Team note</span>
                <textarea rows={3} placeholder="Describe how your team interviews…" className={cn(fieldClasses, "resize-none")} />
              </label>
            </div>
          )}

          {active === "defaults" && (
            <div className="animate-fade-in max-w-md space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Default preparation time</span>
                <select value={prepDefault} onChange={(e) => setPrepDefault(e.target.value)} className={fieldClasses}>
                  <option>30 seconds</option>
                  <option>60 seconds</option>
                  <option>90 seconds</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Default recording limit</span>
                <select value={limitDefault} onChange={(e) => setLimitDefault(e.target.value)} className={fieldClasses}>
                  <option>2 minutes</option>
                  <option>3 minutes</option>
                  <option>4 minutes</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Default retake policy</span>
                <select value={retakes} onChange={(e) => setRetakes(e.target.value)} className={fieldClasses}>
                  <option>No retakes</option>
                  <option>One retake per question</option>
                  <option>Unlimited retakes</option>
                </select>
              </label>
            </div>
          )}

          {active === "experience" && (
            <div className="animate-fade-in max-w-md divide-y divide-hairline">
              <Toggle
                on={prefs.prepReminder}
                onChange={(v) => setPrefs({ ...prefs, prepReminder: v })}
                label="Show a gentle timer hint during prep"
              />
              <Toggle
                on={prefs.retakePrompt}
                onChange={(v) => setPrefs({ ...prefs, retakePrompt: v })}
                label="Confirm before a candidate spends a retake"
              />
              <Toggle
                on={prefs.consentFirst}
                onChange={(v) => setPrefs({ ...prefs, consentFirst: v })}
                label="Require recording consent before camera access"
              />
              <p className="pt-3 text-[12.5px] leading-relaxed text-slate">
                These settings shape how candidates experience interviews. The
                real product would store them per organization.
              </p>
            </div>
          )}

          {active === "privacy" && (
            <div className="animate-fade-in max-w-2xl space-y-3">
              <h2 className="text-[15px] font-semibold text-ink">How Vervue AI treats data</h2>
              <div className="space-y-2.5 text-[13.5px] leading-relaxed text-slate">
                <p>
                  · This deployment is a frontend demo. Nothing you enter is
                  stored outside your browser, and no recordings, notes, or
                  account data are transmitted anywhere.
                </p>
                <p>
                  · AI-assisted summaries are always labeled. They support
                  reviewers — they never make hiring decisions automatically.
                </p>
                <p>
                  · Candidates control when recording starts and can stop at
                  any time.
                </p>
                <p>
                  · When a backend is connected later, this page is the natural
                  place to surface data processing, retention, and deletion
                  policies.
                </p>
              </div>
              <Badge tone="success">
                <ShieldCheck size={11} />
                No real data processed on this site
              </Badge>
            </div>
          )}

          {active !== "privacy" && (
            <div className="mt-8 flex items-center gap-3 border-t border-hairline pt-5">
              <button onClick={save} className={buttonClasses("primary", "md")}>
                <Save size={15} />
                Save changes
              </button>
              <span
                role="status"
                className={cn(
                  "text-[12.5px] font-medium text-success transition-opacity",
                  saved ? "opacity-100" : "opacity-0"
                )}
              >
                Saved to local demo state ✓
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
