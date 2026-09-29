"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RevealObserver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observeNewElements = () => {
      const elements = document.querySelectorAll<HTMLElement>(
        ".reveal:not(.is-visible), .reveal-x:not(.is-visible), .reveal-scale:not(.is-visible)"
      );

      if (isReduced || !("IntersectionObserver" in window)) {
        elements.forEach((el) => el.classList.add("is-visible"));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );

      elements.forEach((el) => observer.observe(el));
    };

    observeNewElements();

    // Observe DOM mutations to pick up dynamically added/filtered elements
    const mutationObserver = new MutationObserver(() => {
      observeNewElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [pathname, searchParams]);

  return null;
}
