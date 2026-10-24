import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create a demo Vervue AI account as a recruiter or candidate. Frontend prototype — nothing is stored.",
};

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
