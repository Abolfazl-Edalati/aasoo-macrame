"use client";

import { useState, useRef } from "react";
import { LivingKnot } from "@/components/motion/LivingKnot";

export function DarkModeToggle({
  targetId = "palette-preview",
}: {
  targetId?: string;
}) {
  const [isDark, setIsDark] = useState(false);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    const target = document.getElementById(targetId);
    if (target) {
      if (next) {
        target.setAttribute("data-inverse", "");
      } else {
        target.removeAttribute("data-inverse");
      }
    }
  }

  return (
    <button
      className="btn btn--dark btn--sm"
      type="button"
      aria-pressed={isDark}
      onClick={toggle}
    >
      {isDark ? "بازگشت به حالت روشن" : "پیش‌نمایش حالت تیرهٔ این بخش"}
    </button>
  );
}

export function MotionKnotDemo() {
  const [key, setKey] = useState(0);

  return (
    <div className="demo-box flex flex-col items-center gap-4">
      <LivingKnot
        key={key}
        className="knot w-48 text-accent"
        viewBox="0 0 200 80"
        ariaLabel="گره‌ای که دوباره بسته می‌شود"
      >
        <path className="rope" d="M8 40 C 60 0, 100 80, 192 40" />
        <path className="rope" d="M8 40 C 60 80, 100 0, 192 40" />
      </LivingKnot>
      <button
        className="btn btn--quiet btn--sm"
        type="button"
        onClick={() => setKey((k) => k + 1)}
      >
        بازی دوبارهٔ «گره شدن»
      </button>
    </div>
  );
}

export function InteractiveStatesDemo() {
  const [isLoading, setIsLoading] = useState(false);

  function triggerToast() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("gereh:toast", {
          detail: {
            message: "نمونهٔ اعلان موفقیت دیزاین‌سیستم",
            icon: "check",
          },
        })
      );
    }
  }

  function simulateLoading() {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  return (
    <div className="demo-box od-row flex-wrap gap-3">
      <button className="btn btn--primary" type="button" id="st-focus">
        با Tab روی این focus کنید
      </button>
      <button
        className={`btn btn--quiet ${isLoading ? "is-loading" : ""}`}
        type="button"
        id="st-load"
        onClick={simulateLoading}
        disabled={isLoading}
      >
        {isLoading ? "در حال پردازش…" : "شبیه‌سازی loading"}
      </button>
      <button
        className="btn btn--dark"
        type="button"
        id="st-toast"
        onClick={triggerToast}
      >
        نمایش toast موفقیت
      </button>
    </div>
  );
}
