"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RevealObserver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );

    const observedSet = new WeakSet<Element>();

    const observeNewElements = () => {
      const targets = document.querySelectorAll<HTMLElement>(
        ".reveal:not(.is-visible), .reveal-x:not(.is-visible), .reveal-scale:not(.is-visible)"
      );
      targets.forEach((el) => {
        if (!observedSet.has(el)) {
          observedSet.add(el);
          observer.observe(el);
        }
      });
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
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname, searchParams]);

  return null;
}
