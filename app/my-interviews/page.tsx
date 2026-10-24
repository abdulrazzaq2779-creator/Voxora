import type { Metadata } from "next";
import { CandidateDashboard } from "@/components/candidate/candidate-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your candidate home: profile completion, upcoming deadlines, and interview invitations.",
};

export default function MyInterviewsPage() {
  return <CandidateDashboard />;
}
