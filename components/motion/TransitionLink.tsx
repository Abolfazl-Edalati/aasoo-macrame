"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React from "react";

type TransitionLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  "aria-current"?: "page" | "step" | "location" | "date" | "time" | "true" | "false";
  title?: string;
  dataNav?: boolean;
};

export function TransitionLink({
  href,
  children,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
  title,
  dataNav,
  ...rest
}: TransitionLinkProps) {
  const router = useRouter();
  const currentPathname = usePathname();

  const handleNavigate = (e: { preventDefault: () => void }) => {
    if (typeof window === "undefined") return;

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    const targetUrl = typeof href === "string" ? href : href.pathname ?? "";
    // If external or empty, let default happen
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) return;
    if (targetUrl.startsWith("#") || targetUrl === currentPathname) return;

    e.preventDefault();
    window.dispatchEvent(new CustomEvent("gereh:curtain-start"));

    setTimeout(() => {
      router.push(targetUrl);
    }, 420);
  };

  return (
    <Link
      href={href}
      className={className}
      style={style}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      title={title}
      onNavigate={handleNavigate}
      {...(dataNav ? { "data-nav": true } : {})}
      {...rest}
    >
      {children}
    </Link>
  );
}
