"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageCurtain() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<"idle" | "enter" | "exit">("idle");

  // When route or query parameters update, trigger curtain exit
  useEffect(() => {
    if (stage === "enter") {
      setStage("exit");
      const timeout = setTimeout(() => {
        setStage("idle");
      }, 420);
      return () => clearTimeout(timeout);
    }
  }, [pathname, searchParams]);

  // Safety timer to prevent permanent black screen if navigation aborts
  useEffect(() => {
    if (stage === "enter") {
      const safety = setTimeout(() => {
        setStage("exit");
        setTimeout(() => setStage("idle"), 420);
      }, 700);
      return () => clearTimeout(safety);
    }
  }, [stage]);

  useEffect(() => {
    const handleStart = () => {
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isReduced) return;
      setStage("enter");
    };

    window.addEventListener("gereh:curtain-start", handleStart);
    return () => window.removeEventListener("gereh:curtain-start", handleStart);
  }, []);

  if (stage === "idle") return null;

  return (
    <div
      className={`page-curtain ${stage === "enter" ? "curtain-enter" : "curtain-exit"}`}
      aria-hidden="true"
    />
  );
}
