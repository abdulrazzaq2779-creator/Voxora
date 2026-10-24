import type { Metadata } from "next";
import { MyInvitations } from "@/components/candidate/my-invitations";

export const metadata: Metadata = {
  title: "My interviews",
  description:
    "All interview invitations you've received: company, role, deadline, duration, and status.",
};

export default function AllInvitationsPage() {
  return <MyInvitations />;
}
