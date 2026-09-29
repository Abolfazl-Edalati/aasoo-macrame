import type { Metadata } from "next";
import { getCartProducts, getCartSettings } from "@/lib/storefront";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "سبد خرید — گِرِه",
  description: "سبد خرید، مشخصات اقلام انتخابی و محاسبه کد تخفیف و ارسال در فروشگاه گِرِه.",
};

export default function CartPage() {
  const products = getCartProducts();
  const settings = getCartSettings();

  return (
    <main id="main">
      <CartView products={products} settings={settings} />
    </main>
  );
}
