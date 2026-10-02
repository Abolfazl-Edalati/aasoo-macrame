import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/server";
import { logoutAction } from "@/app/login/actions";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { ProfileNameEditor } from "@/components/account/ProfileNameEditor";
import { formatToman, toFa } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders";

export const metadata: Metadata = {
  title: "«حساب کاربری»",
  description: "اطلاعات حساب و تاریخچه سفارش‌های شما در گِرِه",
};

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.type !== "customer") {
    redirect("/login?next=/account");
  }

  const customer = currentUser.customer;

  // Fetch orders for customer
  const customerOrders = db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt))
    .all();

  return (
    <main id="main" className="wrap py-10 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-line mb-8">
        <div>
          <span className="eyebrow">حساب کاربری</span>
          <h1 className="font-display text-2xl text-ink">
            {customer.name ? `سلام، ${customer.name}` : "سلام"}
          </h1>
          <p className="text-sm text-ink-2 mt-1">
            شماره موبایل: <span dir="ltr" className="font-mono font-semibold text-ink">{customer.phone}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TransitionLink
            href="/account/addresses"
            className="btn btn--outline text-xs px-3.5 py-2"
          >
            دفترچه آدرس‌ها
          </TransitionLink>

          <form action={logoutAction}>
            <button
              type="submit"
              className="btn btn--quiet text-xs px-3.5 py-2 text-error cursor-pointer"
            >
              خروج از حساب
            </button>
          </form>
        </div>
      </div>

      {/* Profile Details Card */}
      <div className="card p-6 bg-surface border border-line rounded-2xl mb-8">
        <h2 className="font-display text-lg mb-4 text-ink">اطلاعات کاربری</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted block text-xs mb-1">نام و نام خانوادگی</span>
            <ProfileNameEditor initialName={customer.name} />
          </div>
          <div>
            <span className="text-muted block text-xs mb-1">شماره تماس (نام کاربری)</span>
            <span dir="ltr" className="text-ink font-mono font-medium block">
              {customer.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl text-ink">سفارش‌های من</h2>
          <span className="text-xs text-muted">
            {toFa(customerOrders.length)} سفارش
          </span>
        </div>

        {customerOrders.length === 0 ? (
          <div className="card p-8 text-center bg-surface border border-line rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-3 text-muted">
              <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7z" />
                <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
              </svg>
            </div>
            <p className="text-ink font-semibold mb-1">هنوز سفارشی ثبت نکرده‌اید</p>
            <p className="text-xs text-ink-2 mb-4 leading-relaxed">
              کارهای دستبافت مکرومه گِرِه را در فروشگاه مشاهده کنید.
            </p>
            <TransitionLink href="/shop" className="btn btn--primary text-xs px-4 py-2">
              مشاهده فروشگاه
            </TransitionLink>
          </div>
        ) : (
          <div className="space-y-4">
            {customerOrders.map((ord) => {
              const statusCfg = ORDER_STATUS_LABELS[ord.status] || {
                label: ord.status,
                class: "bg-surface border-line text-ink-2",
              };
              const dateStr = new Date(ord.createdAt * 1000).toLocaleDateString("fa-IR");

              return (
                <div
                  key={ord.id}
                  className="card p-5 bg-surface border border-line rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink" dir="ltr">
                        {ord.code}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusCfg.class}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted flex items-center gap-3">
                      <span>ثبت شده در: {dateStr}</span>
                      <span>گیرنده: {ord.recipientName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-muted block">مبلغ کل</span>
                      <span className="font-semibold text-ink text-sm">
                        {formatToman(ord.totalToman)}
                      </span>
                    </div>

                    <TransitionLink
                      href={`/order/${ord.code}`}
                      className="btn btn--outline text-xs px-3 py-1.5"
                    >
                      مشاهده جزئیات
                    </TransitionLink>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
