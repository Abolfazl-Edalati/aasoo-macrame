"use client";

import { useState, useTransition } from "react";
import { updateCustomerNameAction } from "@/app/account/actions";

export function ProfileNameEditor({ initialName }: { initialName: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateCustomerNameAction(formData);
      if (res.success) {
        setIsEditing(false);
      } else {
        setError(res.error || "خطا در ذخیره نام");
      }
    });
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-ink font-semibold">
          {initialName || "نام ثبت نشده است"}
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs text-accent hover:underline cursor-pointer"
        >
          {initialName ? "ویرایش نام" : "ثبت نام"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs">
      <div className="flex gap-2">
        <input
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام و نام خانوادگی"
          required
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg border border-line bg-surface text-ink text-sm focus:border-accent focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "..." : "ذخیره"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setName(initialName || "");
            setError(null);
          }}
          disabled={isPending}
          className="px-2 py-1.5 text-xs text-muted hover:text-ink cursor-pointer"
        >
          انصراف
        </button>
      </div>
      {error && <p className="text-xs text-error font-medium">{error}</p>}
    </form>
  );
}
