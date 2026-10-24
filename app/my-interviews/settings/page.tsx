import type { Metadata } from "next";
import { ProfileSettings } from "@/components/candidate/profile-settings";

export const metadata: Metadata = {
  title: "Profile & Settings",
  description:
    "Manage your contact details, resume, education and skills, device preferences, and account security.",
};

export default function CandidateSettingsPage() {
  return <ProfileSettings />;
}
