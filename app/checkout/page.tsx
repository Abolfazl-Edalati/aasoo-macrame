import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/server";
import { getCustomerAddresses } from "@/lib/auth/address";
import { getCartProducts, getCartSettings } from "@/lib/storefront";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "«تسویه حساب»",
  description: "مراحل نهایی ثبت سفارش مکرومه، مشخصات تحویل و انتخاب روش پرداخت در گِرِه.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const currentUser = await getCurrentUser();
  const customer = currentUser?.type === "customer" ? currentUser.customer : null;

  const addresses = customer ? await getCustomerAddresses(customer.id) : [];
  const products = getCartProducts();
  const settings = getCartSettings();

  return (
    <main id="main">
      <CheckoutClient
        products={products}
        settings={settings}
        initialCustomer={customer}
        initialAddresses={addresses}
      />
    </main>
  );
}
