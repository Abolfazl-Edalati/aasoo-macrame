import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getCustomerAddresses } from "@/lib/auth/address";
import { AddressBookClient } from "@/components/account/AddressBookClient";
import { TransitionLink } from "@/components/motion/TransitionLink";

export const metadata: Metadata = {
  title: "دفترچه آدرس‌ها — گِرِه",
  description: "مدیریت آدرس‌های پستی برای ارسال سفارش‌ها",
};

export default async function AddressesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.type !== "customer") {
    redirect("/login?next=/account/addresses");
  }

  const addresses = await getCustomerAddresses(currentUser.customer.id);

  return (
    <main id="main" className="wrap py-10 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-line mb-8">
        <div>
          <span className="eyebrow">حساب کاربری</span>
          <h1 className="font-display text-2xl text-ink">دفترچه آدرس‌ها</h1>
          <p className="text-sm text-ink-2 mt-1">
            آدرس‌های پستی ثبت‌شده برای ارسال سفارش‌های شما (حداکثر ۵ آدرس)
          </p>
        </div>

        <TransitionLink
          href="/account"
          className="btn btn--outline text-xs px-3.5 py-2"
        >
          بازگشت به حساب کاربری
        </TransitionLink>
      </div>

      <AddressBookClient addresses={addresses} />
    </main>
  );
}
