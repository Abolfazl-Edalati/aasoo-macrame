"use client";

import { useEffect, useRef } from "react";

type LivingKnotProps = {
  className?: string;
  viewBox?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
};

export function LivingKnot({
  className = "knot hero-knot",
  viewBox = "0 0 200 260",
  ariaLabel = "نقش گره مکرومه که هنگام اسکرول بسته می‌شود",
  children,
}: LivingKnotProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ropes = svg.querySelectorAll<SVGGeometryElement>(".rope");

    ropes.forEach((rope) => {
      let len = 400;
      try {
        if (typeof rope.getTotalLength === "function") {
          len = Math.ceil(rope.getTotalLength());
        }
      } catch {
        len = 400;
      }
      rope.style.setProperty("--len", String(len));
    });

    if (isReduced || !("IntersectionObserver" in window)) {
      svg.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            svg.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(svg);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={viewBox}
      role="img"
      aria-label={ariaLabel}
    >
      {children ?? (
        <>
          <path
            className="rope"
            d="M100 14 C 40 60, 40 110, 100 130 C 160 150, 160 200, 100 246"
          />
          <path className="rope" d="M46 40 C 120 80, 80 170, 154 216" />
          <path className="rope" d="M154 40 C 80 80, 120 170, 46 216" />
          <circle className="rope" cx="100" cy="130" r="26" />
        </>
      )}
    </svg>
  );
}
