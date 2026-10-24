"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CircleUserRound,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
  GraduationCap,
} from "lucide-react";
import { Camera as CameraIcon } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  profileCompletion,
  readProfile,
  writeProfile,
  type CandidateProfile,
} from "@/lib/candidate-data";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-[14px] text-ink placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none transition-colors";

const sections = [
  { id: "personal", label: "Profile", icon: CircleUserRound },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "background", label: "Education & skills", icon: GraduationCap },
  { id: "devices", label: "Camera & microphone", icon: CameraIcon },
  { id: "security", label: "Privacy & security", icon: ShieldCheck },
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
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
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

export function ProfileSettings() {
  const [active, setActive] = useState<SectionId>("personal");
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setProfile(readProfile());
  }, []);

  if (!profile) return null;

  const completion = profileCompletion(profile);

  const update = (patch: Partial<CandidateProfile>) => {
    setProfile((p) => (p ? { ...p, ...patch } : p));
  };

  const save = () => {
    writeProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addSkill = () => {
    const s = skillDraft.trim();
    if (!s || profile.skills.includes(s)) return;
    update({ skills: [...profile.skills, s] });
    setSkillDraft("");
  };

  const removeSkill = (skill: string) => {
    update({ skills: profile.skills.filter((x) => x !== skill) });
  };

  const onResumePicked = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    update({ resumeName: file.name, resumeUpdatedAt: Date.now() });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
            Profile & Settings
          </h1>
          <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-slate">
            Keep your details current — recruiters see this alongside your
            interview responses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[12.5px] font-medium",
              completion.percent >= 100 ? "text-success" : "text-slate"
            )}
          >
            {completion.percent}% complete
          </span>
          <button onClick={save} className={buttonClasses("primary", "md")}>
            <Save size={15} />
            {saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr] lg:items-start">
        <nav
          aria-label="Profile sections"
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
              <s.icon
                size={15}
                className={active === s.id ? "text-accent" : "text-[#9aa0b4]"}
              />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card sm:p-7">
          {active === "personal" && (
            <div className="animate-fade-in max-w-md space-y-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet text-[15px] font-semibold text-white">
                  {profile.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <div className="text-[14.5px] font-medium text-ink">
                    {profile.name}
                  </div>
                  <Badge tone="accent" className="mt-1">
                    Candidate account · demo
                  </Badge>
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                  Full name
                </span>
                <input
                  value={profile.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className={fieldClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                  Email
                </span>
                <input
                  value={profile.email}
                  onChange={(e) => update({ email: e.target.value })}
                  type="email"
                  className={fieldClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                  Phone
                </span>
                <input
                  value={profile.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  type="tel"
                  className={fieldClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                  Location
                </span>
                <input
                  value={profile.location}
                  onChange={(e) => update({ location: e.target.value })}
                  className={fieldClasses}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                  Headline
                </span>
                <input
                  value={profile.headline}
                  onChange={(e) => update({ headline: e.target.value })}
                  placeholder="e.g. Frontend engineer · React"
                  className={fieldClasses}
                />
              </label>
            </div>
          )}

          {active === "resume" && (
            <div className="animate-fade-in max-w-md space-y-4">
              <div className="flex items-center gap-3.5 rounded-2xl border border-hairline bg-[#fbfbfe] p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lavender">
                  <FileText size={18} className="text-accent" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-ink">
                    {profile.resumeName ?? "No resume uploaded yet"}
                  </div>
                  <div className="text-[11.5px] text-slate">
                    {profile.resumeName
                      ? `Updated Oct ${new Date(profile.resumeUpdatedAt ?? Date.now()).getDate()}`
                      : "PDF or DOCX, up to 10 MB"}
                  </div>
                </div>
                {profile.resumeName && (
                  <button
                    onClick={() => update({ resumeName: null, resumeUpdatedAt: null })}
                    aria-label="Remove resume"
                    className="rounded-lg p-2 text-slate transition-colors hover:bg-[#fdf3f3] hover:text-[#c23b3b]"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => onResumePicked(e.target.files)}
              />
              <button
                onClick={() => resumeInputRef.current?.click()}
                className={buttonClasses("outline", "md")}
              >
                <Upload size={15} />
                {profile.resumeName ? "Replace resume" : "Upload resume"}
              </button>
              <p className="text-[12.5px] leading-relaxed text-slate">
                Demo note: the file is never uploaded anywhere — only its name
                is shown. In the real product, resumes are shared with teams
                you've applied to.
              </p>
            </div>
          )}

          {active === "background" && (
            <div className="animate-fade-in max-w-md space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                  Education
                </span>
                <input
                  value={profile.education}
                  onChange={(e) => update({ education: e.target.value })}
                  placeholder="Degree, school, year"
                  className={fieldClasses}
                />
              </label>
              <div>
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                  Skills
                </span>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1.5 text-[12.5px] font-medium text-accent-strong"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                        className="text-accent-strong/60 transition-colors hover:text-accent-strong"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {profile.skills.length === 0 && (
                    <span className="text-[12.5px] text-slate">
                      No skills yet — add a few so recruiters can match you.
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <input
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Add a skill and press Enter"
                    className={fieldClasses}
                  />
                  <button onClick={addSkill} className={buttonClasses("outline", "md")}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {active === "devices" && (
            <div className="animate-fade-in max-w-md space-y-3">
              <p className="text-[13.5px] leading-relaxed text-slate">
                These preferences apply to your next interview. You'll still be
                able to pick a specific camera and mirror the preview live in
                the preparation room.
              </p>
              <div className="rounded-2xl border border-hairline bg-[#fbfbfe] p-4">
                <Toggle
                  label="Mirror my preview by default"
                  on={profile.mirrorDefault}
                  onChange={(v) => update({ mirrorDefault: v })}
                />
                <Toggle
                  label="Warn me before starting if no device test has run"
                  on={profile.linkLostGuard}
                  onChange={(v) => update({ linkLostGuard: v })}
                />
              </div>
              <Link
                href="/interview/practice"
                className={buttonClasses("outline", "md")}
              >
                <CameraIcon size={15} />
                Test camera & mic now
                <ExternalLink size={13} />
              </Link>
            </div>
          )}

          {active === "security" && (
            <div className="animate-fade-in max-w-md space-y-3">
              <div className="rounded-2xl border border-hairline bg-[#fbfbfe] p-4">
                <Toggle
                  label="Deadline reminders (in-app)"
                  on={profile.notifyReminders}
                  onChange={(v) => update({ notifyReminders: v })}
                />
                <Toggle
                  label="Status emails when a team updates my application"
                  on={profile.notifyEmails}
                  onChange={(v) => update({ notifyEmails: v })}
                />
              </div>
              <div className="rounded-2xl border border-hairline bg-[#fbfbfe] p-4">
                <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                  <Lock size={14} className="text-accent" />
                  Account
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate">
                  Signed in as {profile.email}. This demo keeps everything in
                  your browser — clear your browser storage to reset all demo
                  data, or sign out below.
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Link href="/sign-in" className={buttonClasses("outline", "sm")}>
                    <Mail size={13} />
                    Change demo account
                  </Link>
                </div>
              </div>
              <p className="flex items-start gap-2.5 rounded-2xl bg-[#f1f2f7] px-4 py-3.5 text-[12.5px] leading-relaxed text-slate">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" />
                Your interview recordings belong to you until you submit them.
                During an interview, tab switches are flagged for the reviewing
                team — that policy is always shown before you start.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

