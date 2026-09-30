"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { staffLoginAction } from "@/app/admin/login/actions";

export function StaffLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await staffLoginAction(formData);
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error || "نام کاربری یا رمز عبور نادرست است.");
      }
    });
  }

  return (
    <div className="card p-6 sm:p-8 max-w-sm mx-auto bg-surface border border-line rounded-2xl shadow-[var(--shadow-2)]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-ink/5 text-ink mb-3">
          <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v3H9V7zm3 6a2 2 0 0 1 1.73 1H13v3h-2v-3h-.73A2 2 0 0 1 12 13z" />
          </svg>
        </div>
        <h1 className="font-display text-xl text-ink">ورود کارکنان</h1>
        <p className="text-xs text-ink-2 mt-1">پیشخوان مدیریت کارگاه گِرِه</p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold leading-relaxed"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-semibold text-ink mb-1"
          >
            نام کاربری
          </label>
          <input
            id="username"
            name="username"
            type="text"
            dir="ltr"
            required
            autoComplete="username"
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-left placeholder:text-muted focus:border-accent focus:outline-none transition-colors text-sm"
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-ink mb-1"
          >
            رمز عبور
          </label>
          <input
            id="password"
            name="password"
            type="password"
            dir="ltr"
            required
            autoComplete="current-password"
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-left placeholder:text-muted focus:border-accent focus:outline-none transition-colors text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 mt-2 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-1)] cursor-pointer text-sm"
        >
          {isPending ? "در حال ورود..." : "ورود به پیشخوان"}
        </button>
      </form>
    </div>
  );
}
