"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronRight, TriangleAlert, CircleCheck } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-[14px] text-ink placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none transition-colors";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"recruiter" | "candidate">("recruiter");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const fieldError = () => {
    if (!email.trim() || !email.includes("@"))
      return "Enter a valid email address.";
    if (password.length < 8)
      return "Password must be at least 8 characters.";
    return "";
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = fieldError();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    // Demo sign-in: purely frontend — no password is stored or sent anywhere.
    setTimeout(() => {
      setLoading(false);
      setOk(true);
      setTimeout(() => {
        router.push(role === "recruiter" ? "/dashboard" : "/my-interviews");
      }, 700);
    }, 900);
  };

  return (
    <form onSubmit={submit} noValidate className="mt-8">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">
        {isSignUp ? "Create your account" : "Sign in to Vervue AI"}
      </h1>
      <p className="mt-1.5 text-[14px] text-slate">
        {isSignUp
          ? "Demo access — this prototype does not create real accounts."
          : role === "candidate"
            ? "Candidate sign-in — take you straight to your invited interview."
            : "Recruiter sign-in — any valid-format credentials are accepted."}
      </p>

      <fieldset className="mt-6">
        <legend className="mb-1.5 text-[12.5px] font-medium text-ink">
          {isSignUp ? "I'm joining as" : "I'm signing in as"}
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              [
                "recruiter",
                "Recruiter",
                isSignUp ? "Run interviews, review" : "Workspace & reviews",
              ],
              [
                "candidate",
                "Candidate",
                isSignUp ? "Complete an interview" : "Attend my interview",
              ],
            ] as const
          ).map(([value, label, desc]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              aria-pressed={role === value}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                role === value
                  ? "border-accent bg-lavender/70 shadow-card"
                  : "border-hairline hover:border-[#c9cddc]"
              )}
            >
              <span className="block text-[13.5px] font-medium text-ink">
                {label}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-slate">
                {desc}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block" htmlFor="auth-email">
        <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
          Email
        </span>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.example"
          aria-invalid={!!error && !email.trim()}
          className={fieldClasses}
        />
      </label>

      <label className="mt-4 block" htmlFor="auth-password">
        <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
          Password
        </span>
        <div className="relative">
          <input
            id="auth-password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            aria-invalid={!!error && password.length < 8}
            aria-describedby={error ? "auth-error" : undefined}
            className={cn(fieldClasses, "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate transition-colors hover:text-ink"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>

      {error && (
        <p
          id="auth-error"
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-[#f0d0d0] bg-[#fdf3f3] px-3.5 py-2.5 text-[13px] text-[#c23b3b]"
        >
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      {ok && (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl border border-[#bfe8d2] bg-[#e9f7ee] px-3.5 py-2.5 text-[13px] text-success"
        >
          <CircleCheck size={15} className="mt-0.5 shrink-0" />
          {ok
            ? role === "recruiter"
              ? "Signed in (demo) — taking you to the workspace…"
              : "Signed in (demo) — taking you to your interview…"
            : null}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className={buttonClasses("primary", "lg", "mt-6 w-full")}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Signing in…
          </span>
        ) : (
          <>
            {isSignUp ? "Create demo account" : "Sign in"}
            <ChevronRight size={16} />
          </>
        )}
      </button>

      <p className="mt-5 text-center text-[13.5px] text-slate">
        {isSignUp ? "Already have access? " : "New to Vervue? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-accent transition-colors hover:text-accent-strong"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>

      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-[#9aa0b4]">
        This is a frontend demonstration. No passwords are stored, transmitted,
        or validated against a real service.
      </p>

      <div className="mt-4 flex items-center justify-center gap-2">
        <LogoMark className="h-4 w-4 opacity-70" />
        <Link href="/" className="text-[12px] text-[#9aa0b4] hover:text-slate">
          Back to homepage
        </Link>
      </div>
    </form>
  );
}
