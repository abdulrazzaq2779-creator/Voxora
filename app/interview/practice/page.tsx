import type { Metadata } from "next";
import { PracticeRoom } from "@/components/interview/practice-room";

export const metadata: Metadata = {
  title: "Practice room",
  description:
    "Try sample interview questions with the same timers — no stakes, nothing is saved.",
};

export default function PracticePage() {
  return <PracticeRoom />;
}
