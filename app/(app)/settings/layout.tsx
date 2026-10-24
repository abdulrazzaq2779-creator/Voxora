import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Workspace preferences: profile, organization, review defaults, and candidate experience options.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
