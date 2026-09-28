"use client";

import { useEffect, useState } from "react";

type ToastItem = {
  id: number;
  message: string;
  icon: "check" | "info";
  leaving?: boolean;
};

export function ToastRegion() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let nextId = 1;
    const handleToast = (e: Event) => {
      const custom = e as CustomEvent<{ message: string; icon?: "check" | "info" }>;
      const id = nextId++;
      const item: ToastItem = {
        id,
        message: custom.detail.message,
        icon: custom.detail.icon ?? "check",
      };

      setToasts((prev) => [...prev, item]);

      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 320);
      }, 2600);
    };

    window.addEventListener("gereh:toast", handleToast);
    return () => window.removeEventListener("gereh:toast", handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.leaving ? "is-leaving" : ""}`}
        >
          {t.icon === "check" ? (
            <svg
              className="icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          ) : (
            <svg
              className="icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 8v5M12 16.5v.5" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
