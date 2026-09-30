import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/server";
import { staffLogoutAction } from "@/app/admin/login/actions";

export const metadata: Metadata = {
  title: "پیشخوان مدیریت — گِرِه",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminHomePage() {
  const currentUser = await getCurrentUser();
  const staff = currentUser?.type === "staff" ? currentUser.staff : null;

  return (
    <main id="main" className="wrap py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-line mb-8">
        <div>
          <span className="eyebrow">پیشخوان کارگاه</span>
          <h1 className="font-display text-2xl text-ink">
            خوش آمدید، {staff?.displayName || "مدیر کارگاه"}
          </h1>
        </div>

        <form action={staffLogoutAction}>
          <button
            type="submit"
            className="btn btn--outline text-xs px-3.5 py-2 cursor-pointer"
          >
            خروج از حساب
          </button>
        </form>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 bg-surface border border-line rounded-2xl">
          <h2 className="font-display text-lg mb-2 text-ink">محتاج توجه</h2>
          <p className="text-sm text-ink-2 mb-4 leading-relaxed">
            صف بررسی پرداخت‌ها و کارت‌به‌کارت‌های در انتظار تأیید
          </p>
          <span className="chip text-xs">آماده برای فاز پیشخوان (#۱۹)</span>
        </div>

        <div className="card p-6 bg-surface border border-line rounded-2xl">
          <h2 className="font-display text-lg mb-2 text-ink">محصولات و انبار</h2>
          <p className="text-sm text-ink-2 mb-4 leading-relaxed">
            مدیریت محصولات، رنگ‌ها، دسته‌ها و موجودی
          </p>
          <span className="chip text-xs">آماده برای فاز محصولات (#۲۰)</span>
        </div>

        <div className="card p-6 bg-surface border border-line rounded-2xl">
          <h2 className="font-display text-lg mb-2 text-ink">سفارش‌های اختصاصی</h2>
          <p className="text-sm text-ink-2 mb-4 leading-relaxed">
            پیام‌ها و درخواست‌های ساخت سفارشی مکرومه
          </p>
          <span className="chip text-xs">آماده برای فاز سفارش‌ها (#۱۹)</span>
        </div>
      </div>
    </main>
  );
}
