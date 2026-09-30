"use client";

import { useState, useTransition } from "react";
import { addAddressAction, deleteAddressAction } from "@/app/account/actions";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { toFa } from "@/lib/format";

interface AddressItem {
  id: number;
  label: string;
  recipientName: string;
  text: string;
  postalCode: string | null;
  createdAt: number;
}

export function AddressBookClient({
  addresses: initialAddresses,
}: {
  addresses: AddressItem[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [label, setLabel] = useState("خانه");
  const [recipientName, setRecipientName] = useState("");
  const [text, setText] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const isCapped = addresses.length >= AUTH_CONFIG.MAX_ADDRESSES_PER_CUSTOMER;

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (text.trim().length < AUTH_CONFIG.ADDRESS_MIN_LENGTH) {
      setError("آدرس پستی باید حداقل ۱۲ نویسه باشد.");
      return;
    }

    if (!recipientName.trim()) {
      setError("نام تحویل‌گیرنده الزامی است.");
      return;
    }

    const formData = new FormData();
    formData.set("label", label);
    formData.set("recipientName", recipientName);
    formData.set("text", text);
    formData.set("postalCode", postalCode);

    startTransition(async () => {
      const res = await addAddressAction(formData);
      if (res.success) {
        setAddresses((prev) => [res.address, ...prev]);
        setShowAddForm(false);
        setText("");
        setRecipientName("");
        setPostalCode("");
      } else {
        setError(res.error || "خطا در ثبت آدرس");
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("آیا از حذف این آدرس اطمینان دارید؟")) return;

    const formData = new FormData();
    formData.set("addressId", String(id));

    startTransition(async () => {
      const res = await deleteAddressAction(formData);
      if (res.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted">
          تعداد آدرس‌ها: {toFa(addresses.length)} از{" "}
          {toFa(AUTH_CONFIG.MAX_ADDRESSES_PER_CUSTOMER)}
        </span>

        {!isCapped && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="btn btn--primary text-xs px-3.5 py-2 cursor-pointer"
          >
            افزودن آدرس جدید
          </button>
        )}
      </div>

      {isCapped && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs">
          حداکثر ۵ آدرس می‌توانید ثبت کنید. برای افزودن آدرس جدید، ابتدا یکی از آدرس‌های قبلی را حذف کنید.
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="card p-6 bg-surface border border-line rounded-2xl shadow-[var(--shadow-1)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-base text-ink">افزودن آدرس پستی</h2>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
              className="text-xs text-muted hover:text-ink cursor-pointer"
            >
              انصراف
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleAdd} noValidate className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  عنوان آدرس
                </label>
                <div className="flex gap-2">
                  {["خانه", "اداری", "سایر"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        label === l
                          ? "bg-accent text-white border-accent"
                          : "bg-surface text-ink border-line hover:border-accent"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="recip-name"
                  className="block text-xs font-semibold text-ink mb-1"
                >
                  نام تحویل‌گیرنده <span className="text-error">*</span>
                </label>
                <input
                  id="recip-name"
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="مثال: مریم سعیدی"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="addr-text"
                className="block text-xs font-semibold text-ink mb-1"
              >
                نشانی دقیق پستی <span className="text-error">*</span>{" "}
                <small className="text-muted">(حداقل ۱۲ حرف)</small>
              </label>
              <textarea
                id="addr-text"
                required
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="استان، شهر، خیابان، کوچه، پلاک، واحد"
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink text-sm focus:border-accent focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label
                htmlFor="postal-code"
                className="block text-xs font-semibold text-ink mb-1"
              >
                کد پستی <span className="text-muted">(اختیاری)</span>
              </label>
              <input
                id="postal-code"
                type="text"
                dir="ltr"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="۱۰ رقمی"
                className="w-full sm:w-1/2 px-3 py-2 rounded-lg border border-line bg-surface text-ink text-left text-sm focus:border-accent focus:outline-none font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="btn btn--primary text-xs px-4 py-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? "در حال ثبت..." : "ثبت آدرس"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setError(null);
                }}
                className="btn btn--quiet text-xs px-3 py-2 cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards */}
      {addresses.length === 0 && !showAddForm ? (
        <div className="card p-8 text-center bg-surface border border-line rounded-2xl">
          <p className="text-ink font-semibold mb-1">هنوز آدرسی ثبت نکرده‌اید</p>
          <p className="text-xs text-muted mb-4">
            ثبت آدرس باعث سهولت و سرعت در ثبت سفارش‌های بعدی شما خواهد شد.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="btn btn--primary text-xs px-4 py-2 cursor-pointer"
          >
            افزودن اولین آدرس
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="card p-5 bg-surface border border-line rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="chip text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    {addr.label}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    تحویل‌گیرنده: {addr.recipientName}
                  </span>
                </div>
                <p className="text-sm text-ink-2 leading-relaxed">{addr.text}</p>
                {addr.postalCode && (
                  <p className="text-xs text-muted">
                    کد پستی:{" "}
                    <span dir="ltr" className="font-mono text-ink">
                      {addr.postalCode}
                    </span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDelete(addr.id)}
                disabled={isPending}
                className="text-xs text-error hover:underline cursor-pointer self-end sm:self-center"
              >
                حذف آدرس
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
