import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Vervue AI as a recruiter or a candidate. Demo access — no real accounts.",
};

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
