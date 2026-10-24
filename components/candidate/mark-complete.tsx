"use client";

import { useEffect } from "react";
import { writeStage } from "@/lib/candidate-stage";

export function MarkComplete() {
  useEffect(() => {
    writeStage("complete");
  }, []);
  return null;
}
