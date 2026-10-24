import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Question library",
  description:
    "Reusable, structured interview questions with preparation and recording time defaults.",
};

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
