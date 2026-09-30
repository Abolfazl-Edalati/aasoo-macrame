"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TransitionLink } from "@/components/motion/TransitionLink";
import type { CartProductInfo, CartSettings } from "@/lib/storefront";
import type { CustomerAddress } from "@/lib/auth/address";
import {
  getCart,
  clearCart,
  type CartLine,
} from "@/lib/cart";
import {
  calculateLinePrice,
  calculateCartTotals,
  type CartLineWithProduct,
  type ActivePromoDiscount,
} from "@/lib/cart-pricing";
import { toFa, formatTomanDigits, groupNum } from "@/lib/format";
import {
  checkoutRequestOtpAction,
  checkoutVerifyOtpAction,
  createOrderFromCheckoutAction,
} from "@/app/checkout/actions";
import { AUTH_CONFIG } from "@/lib/auth/config";

const PROMO_STORAGE_KEY = "gereh.promo.v1";

type CheckoutClientProps = {
  products: Record<number, CartProductInfo>;
  settings: CartSettings;
  initialCustomer: { id: number; phone: string; name: string | null } | null;
  initialAddresses: CustomerAddress[];
};

type CheckoutStep = "auth" | "details" | "payment";

export function CheckoutClient({
  products,
  settings,
  initialCustomer,
  initialAddresses,
}: CheckoutClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<ActivePromoDiscount | null>(null);

  // Customer state
  const [customer, setCustomer] = useState(initialCustomer);
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);

  // Step state: if customer logged in, jump to 'details' (step 2), else 'auth' (step 1)
  const [step, setStep] = useState<CheckoutStep>(initialCustomer ? "details" : "auth");

  // Step 1: Auth form state
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authCooldown, setAuthCooldown] = useState(0);

  // Step 2: Address form state
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">(
    initialAddresses.length > 0 ? initialAddresses[0].id : "new"
  );
  const [recipientName, setRecipientName] = useState(
    initialAddresses.length > 0
      ? initialAddresses[0].recipientName
      : initialCustomer?.name || ""
  );
  const [addressText, setAddressText] = useState(
    initialAddresses.length > 0 ? initialAddresses[0].text : ""
  );
  const [postalCode, setPostalCode] = useState(
    initialAddresses.length > 0 ? initialAddresses[0].postalCode || "" : ""
  );
  const [addressLabel, setAddressLabel] = useState("خانه");
  const [saveToAddressBook, setSaveToAddressBook] = useState(true);
  const [orderNote, setOrderNote] = useState("");
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Step 3: Payment method
  const [paymentPath, setPaymentPath] = useState<"card" | "gateway">("card");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Load localStorage cart & sessionStorage promo on client mount
  useEffect(() => {
    setCartLines(getCart());
    try {
      const storedPromo = sessionStorage.getItem(PROMO_STORAGE_KEY);
      if (storedPromo) {
        const parsed = JSON.parse(storedPromo);
        if (parsed?.code && parsed?.percent) {
          setAppliedPromo(parsed);
        }
      }
    } catch {}
    setMounted(true);
  }, []);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (authCooldown <= 0) return;
    const timer = setInterval(() => {
      setAuthCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [authCooldown]);

  // Resolve cart lines to products
  const resolvedLines = cartLines
    .map((line) => {
      const p = products[line.id];
      if (!p) return null;

      const size = p.sizes.find(
        (s) => s.id === line.size || String(s.id) === String(line.size)
      );
      const color = p.colors.find((c) => c.id === line.color);
      const unitPrice = calculateLinePrice(p.priceToman, size?.deltaToman || 0);

      return {
        line,
        product: p,
        size,
        color,
        unitPrice,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const pricingLines: CartLineWithProduct[] = resolvedLines.map((item) => ({
    id: item.line.id,
    sizeId: item.line.size,
    colorId: item.line.color,
    qty: item.line.qty,
    unitPriceToman: item.unitPrice,
  }));

  const totals = calculateCartTotals(
    pricingLines,
    {
      flatToman: settings.shippingFlatToman,
      freeFromToman: settings.shippingFreeFromToman,
    },
    appliedPromo
  );

  // Handler: Request OTP
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    startTransition(async () => {
      const res = await checkoutRequestOtpAction(phone);
      if (res.success) {
        setOtpRequested(true);
        setAuthCooldown(res.cooldownSeconds || AUTH_CONFIG.OTP_RESEND_COOLDOWN_SECONDS);
      } else {
        setAuthError(res.error || "خطا در ارسال کد تأیید.");
      }
    });
  };

  // Handler: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    startTransition(async () => {
      const res = await checkoutVerifyOtpAction(phone, otpCode);
      if (res.success) {
        setCustomer(res.customer);
        if (res.addresses) {
          setAddresses(res.addresses);
          if (res.addresses.length > 0) {
            setSelectedAddressId(res.addresses[0].id);
            setRecipientName(res.addresses[0].recipientName);
            setAddressText(res.addresses[0].text);
            setPostalCode(res.addresses[0].postalCode || "");
          } else if (res.customer.name) {
            setRecipientName(res.customer.name);
          }
        }
        setStep("details");
      } else {
        setAuthError(res.error || "کد تأیید نادرست است.");
      }
    });
  };

  // Handler: Select saved address
  const handleSelectAddress = (id: number | "new") => {
    setSelectedAddressId(id);
    setDetailsError(null);
    if (id === "new") {
      setAddressText("");
      setPostalCode("");
      setAddressLabel("خانه");
    } else {
      const addr = addresses.find((a) => a.id === id);
      if (addr) {
        setRecipientName(addr.recipientName);
        setAddressText(addr.text);
        setPostalCode(addr.postalCode || "");
      }
    }
  };

  // Handler: Proceed from details to payment
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);

    if (!recipientName.trim()) {
      setDetailsError("نام و نام خانوادگی تحویل‌گیرنده الزامی است.");
      return;
    }
    if (!addressText.trim() || addressText.trim().length < 12) {
      setDetailsError("نشانی تحویل باید حداقل ۱۲ نویسه باشد.");
      return;
    }

    setStep("payment");
  };

  // Handler: Final Order Submission
  const handlePlaceOrder = () => {
    setSubmitError(null);

    startTransition(async () => {
      const res = await createOrderFromCheckoutAction({
        recipientName: recipientName.trim(),
        addressText: addressText.trim(),
        postalCode: postalCode.trim() || null,
        saveToAddressBook: selectedAddressId === "new" ? saveToAddressBook : false,
        addressLabel: addressLabel.trim() || undefined,
        items: cartLines.map((l) => ({
          id: l.id,
          size: l.size,
          color: l.color,
          qty: l.qty,
        })),
        promoCode: appliedPromo?.code || null,
        paymentPath,
        note: orderNote.trim() || null,
      });

      if (res.success && res.orderCode) {
        // Clear client-side cart and promo
        clearCart();
        try {
          sessionStorage.removeItem(PROMO_STORAGE_KEY);
        } catch {}

        // Navigate to /order/[code]
        router.push(`/order/${res.orderCode}`);
      } else {
        setSubmitError(res.error || "خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="wrap py-16 text-center text-ink-2">
        <p>در حال بارگذاری اطلاعات خرید...</p>
      </div>
    );
  }

  if (cartLines.length === 0) {
    return (
      <div className="wrap py-16 text-center">
        <div className="max-w-md mx-auto card p-8 bg-surface border border-line rounded-2xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-ink-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="font-display text-xl mb-2 text-ink">سبد خرید شما خالی است</h1>
          <p className="text-sm text-ink-2 mb-6">برای ثبت سفارش ابتدا کالاهای مورد علاقه خود را انتخاب کنید.</p>
          <TransitionLink href="/shop" className="btn btn--primary btn--block">
            مشاهده فروشگاه
          </TransitionLink>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap py-8">
      {/* Header & Steps Indicator */}
      <div className="mb-8">
        <span className="eyebrow">گام‌های ثبت سفارش</span>
        <h1 className="font-display text-2xl text-ink mb-6">تکمیل مشخصات و پرداخت</h1>

        <nav aria-label="مراحل خرید" className="flex items-center gap-2 sm:gap-4 border-b border-line pb-4 text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => customer && setStep("auth")}
            className={`flex items-center gap-1.5 transition-colors ${
              step === "auth"
                ? "text-accent font-bold"
                : customer
                ? "text-ink hover:text-accent cursor-pointer"
                : "text-ink-3"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step === "auth" ? "bg-accent text-white" : customer ? "bg-emerald-600 text-white" : "bg-line text-ink-2"
            }`}>
              {customer ? "✓" : "۱"}
            </span>
            <span>شماره و هویت</span>
          </button>

          <span className="text-line">/</span>

          <button
            type="button"
            onClick={() => customer && setStep("details")}
            disabled={!customer}
            className={`flex items-center gap-1.5 transition-colors ${
              step === "details"
                ? "text-accent font-bold"
                : customer
                ? "text-ink hover:text-accent cursor-pointer"
                : "text-ink-3 cursor-not-allowed"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step === "details" ? "bg-accent text-white" : step === "payment" ? "bg-emerald-600 text-white" : "bg-line text-ink-2"
            }`}>
              {step === "payment" ? "✓" : "۲"}
            </span>
            <span>مشخصات و نشانی</span>
          </button>

          <span className="text-line">/</span>

          <span className={`flex items-center gap-1.5 ${
            step === "payment" ? "text-accent font-bold" : "text-ink-3"
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step === "payment" ? "bg-accent text-white" : "bg-line text-ink-2"
            }`}>
              ۳
            </span>
            <span>روش پرداخت</span>
          </span>
        </nav>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main interactive step area */}
        <div className="lg:col-span-7">
          {/* STEP 1: Phone-OTP Auth */}
          {step === "auth" && (
            <div className="card p-6 bg-surface border border-line rounded-2xl">
              <h2 className="font-display text-lg mb-2 text-ink">ورود یا ثبت‌نام با شماره موبایل</h2>
              <p className="text-xs text-ink-2 mb-6">
                برای ثبت سفارش و اطلاع از وضعیت ساخت و ارسال، شماره تلفن همراه خود را تأیید کنید.
              </p>

              {customer ? (
                <div className="p-4 bg-paper rounded-xl border border-line flex justify-between items-center mb-6">
                  <div>
                    <span className="text-xs text-ink-2 block">حساب واردشده:</span>
                    <span className="font-semibold text-ink">{customer.name || customer.phone}</span>
                    <span className="text-xs text-ink-2 block mt-0.5">{customer.phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="btn btn--outline text-xs px-3 py-1.5 cursor-pointer"
                  >
                    ادامه خرید
                  </button>
                </div>
              ) : !otpRequested ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label htmlFor="checkout-phone" className="block text-xs font-medium text-ink mb-1.5">
                      شماره موبایل
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      dir="ltr"
                      required
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-accent text-left"
                    />
                    <span className="text-[11px] text-ink-2 mt-1 block">
                      کد تأیید ۶ رقمی به این شماره پیامک می‌شود.
                    </span>
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl" role="alert">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || !phone.trim()}
                    className="btn btn--primary btn--block btn--lg magnetic cursor-pointer"
                  >
                    {isPending ? "در حال ارسال کد..." : "دریافت کد تأیید"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex justify-between items-center text-xs text-ink-2 mb-2">
                    <span>کد پیامک‌شده به {phone}:</span>
                    <button
                      type="button"
                      onClick={() => setOtpRequested(false)}
                      className="text-accent hover:underline text-xs cursor-pointer"
                    >
                      ویرایش شماره
                    </button>
                  </div>

                  <div>
                    <label htmlFor="checkout-otp" className="block text-xs font-medium text-ink mb-1.5">
                      کد تأیید ۶ رقمی
                    </label>
                    <input
                      id="checkout-otp"
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      required
                      placeholder="۱۲۳۴۵۶"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-center tracking-[0.3em] font-mono text-lg focus:outline-none focus:border-accent"
                    />
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl" role="alert">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || otpCode.trim().length !== 6}
                    className="btn btn--primary btn--block btn--lg magnetic cursor-pointer"
                  >
                    {isPending ? "در حال بررسی..." : "تأیید و ادامه"}
                  </button>

                  <div className="text-center">
                    {authCooldown > 0 ? (
                      <span className="text-xs text-ink-2">
                        ارسال مجدد کد پس از {toFa(authCooldown)} ثانیه
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        className="text-xs text-accent hover:underline cursor-pointer"
                      >
                        ارسال مجدد کد تأیید
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: Name & Address */}
          {step === "details" && (
            <form onSubmit={handleProceedToPayment} className="card p-6 bg-surface border border-line rounded-2xl space-y-6">
              <div>
                <h2 className="font-display text-lg mb-1 text-ink">مشخصات تحویل‌گیرنده و نشانی</h2>
                <p className="text-xs text-ink-2">
                  سفارش به این نام و آدرس پستی ارسال خواهد شد.
                </p>
              </div>

              {/* Saved Address Selection if customer has existing addresses */}
              {addresses.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-ink">انتخاب از دفترچه آدرس:</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                          selectedAddressId === addr.id
                            ? "border-accent bg-accent/5 ring-1 ring-accent"
                            : "border-line bg-paper hover:border-ink-3"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-medium text-xs text-ink">{addr.label}</span>
                          <input
                            type="radio"
                            name="addressSelection"
                            checked={selectedAddressId === addr.id}
                            onChange={() => handleSelectAddress(addr.id)}
                            className="accent-accent mt-0.5"
                          />
                        </div>
                        <p className="text-xs text-ink-2 line-clamp-2 mb-1">{addr.text}</p>
                        <span className="text-[11px] text-ink-3">{addr.recipientName}</span>
                      </label>
                    ))}

                    <label
                      className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-center items-center text-center transition-all ${
                        selectedAddressId === "new"
                          ? "border-accent bg-accent/5 ring-1 ring-accent"
                          : "border-line bg-paper hover:border-ink-3"
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressSelection"
                        checked={selectedAddressId === "new"}
                        onChange={() => handleSelectAddress("new")}
                        className="sr-only"
                      />
                      <span className="text-xs font-semibold text-accent">+ استفاده از نشانی جدید</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Address Form Inputs */}
              <div className="space-y-4 pt-2">
                <div>
                  <label htmlFor="recipient-name" className="block text-xs font-medium text-ink mb-1.5">
                    نام و نام خانوادگی تحویل‌گیرنده <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="recipient-name"
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="مثال: مریم سعیدی"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="address-text" className="block text-xs font-medium text-ink mb-1.5">
                    نشانی دقیق پستی <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="address-text"
                    required
                    rows={3}
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="استان، شهر، خیابان، کوچه، پلاک، زنگ یا واحد (حداقل ۱۲ نویسه)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-accent resize-none leading-relaxed"
                  />
                  <span className="text-[11px] text-ink-2 mt-1 block">
                    حداقل ۱۲ نویسه. جهت ارسال دقیق توسط شرکت پست الزامی است.
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postal-code" className="block text-xs font-medium text-ink mb-1.5">
                      کد پستی ده‌رقمی (اختیاری)
                    </label>
                    <input
                      id="postal-code"
                      type="text"
                      dir="ltr"
                      maxLength={10}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="۱۲۳۴۵۶۷۸۹۰"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm text-left focus:outline-none focus:border-accent"
                    />
                  </div>

                  {selectedAddressId === "new" && (
                    <div>
                      <label htmlFor="address-label" className="block text-xs font-medium text-ink mb-1.5">
                        عنوان این نشانی (اختیاری)
                      </label>
                      <input
                        id="address-label"
                        type="text"
                        value={addressLabel}
                        onChange={(e) => setAddressLabel(e.target.value)}
                        placeholder="خانه، محل کار، ..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                  )}
                </div>

                {selectedAddressId === "new" && addresses.length < AUTH_CONFIG.MAX_ADDRESSES_PER_CUSTOMER && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveToAddressBook}
                      onChange={(e) => setSaveToAddressBook(e.target.checked)}
                      className="accent-accent"
                    />
                    <span className="text-xs text-ink-2">این نشانی در دفترچه آدرس ذخیره شود</span>
                  </label>
                )}

                <div>
                  <label htmlFor="order-note" className="block text-xs font-medium text-ink mb-1.5">
                    یادداشت سفارش (اختیاری)
                  </label>
                  <input
                    id="order-note"
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="توضیحی درباره بسته‌بندی، هدیه، زمان تحویل و ..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {detailsError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl" role="alert">
                  {detailsError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep("auth")}
                  className="text-xs text-ink-2 hover:text-accent cursor-pointer"
                >
                  بازگشت به گام قبلی
                </button>

                <button
                  type="submit"
                  className="btn btn--primary btn--lg magnetic cursor-pointer"
                >
                  ادامه به انتخاب شیوه پرداخت
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Payment Method & Place Order */}
          {step === "payment" && (
            <div className="card p-6 bg-surface border border-line rounded-2xl space-y-6">
              <div>
                <h2 className="font-display text-lg mb-1 text-ink">انتخاب روش پرداخت</h2>
                <p className="text-xs text-ink-2">
                  پس از ثبت سفارش، اطلاعات لازم جهت واریز یا درگاه در اختیارتان قرار می‌گیرد.
                </p>
              </div>

              <div className="space-y-3" role="radiogroup" aria-label="روش پرداخت">
                <label
                  className={`p-4 border rounded-xl cursor-pointer flex items-start gap-3 transition-all ${
                    paymentPath === "card"
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-line bg-paper hover:border-ink-3"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentPath"
                    value="card"
                    checked={paymentPath === "card"}
                    onChange={() => setPaymentPath("card")}
                    className="accent-accent mt-1"
                  />
                  <div>
                    <span className="font-medium text-sm text-ink block mb-0.5">کارت به کارت (توصیه‌شده)</span>
                    <span className="text-xs text-ink-2 leading-relaxed block">
                      واریز مستقیم به حساب کارگاه. پس از ثبت، شماره کارت نمایش داده می‌شود و می‌توانید ۴ رقم آخر کارت خود را ثبت نمایید.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-4 border rounded-xl cursor-pointer flex items-start gap-3 transition-all opacity-80 ${
                    paymentPath === "gateway"
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-line bg-paper hover:border-ink-3"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentPath"
                    value="gateway"
                    checked={paymentPath === "gateway"}
                    onChange={() => setPaymentPath("gateway")}
                    className="accent-accent mt-1"
                  />
                  <div>
                    <span className="font-medium text-sm text-ink block mb-0.5">پرداخت اینترنتی (درگاه بانکی)</span>
                    <span className="text-xs text-ink-2 leading-relaxed block">
                      پرداخت آنلاین شتابی از طریق درگاه رسمی زرین‌پال.
                    </span>
                  </div>
                </label>
              </div>

              {submitError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl" role="alert">
                  {submitError}
                </div>
              )}

              <div className="p-4 bg-paper rounded-xl border border-line text-xs text-ink-2 space-y-1">
                <div className="flex justify-between">
                  <span>تحویل‌گیرنده:</span>
                  <span className="font-medium text-ink">{recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>نشانی:</span>
                  <span className="font-medium text-ink text-left max-w-[70%] truncate">{addressText}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="text-xs text-ink-2 hover:text-accent cursor-pointer"
                >
                  ویرایش مشخصات و آدرس
                </button>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPending}
                  className="btn btn--primary btn--lg magnetic cursor-pointer"
                >
                  {isPending ? "در حال ثبت سفارش..." : "ثبت و نهایی‌سازی سفارش"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Aside */}
        <aside className="lg:col-span-5 card p-6 bg-surface border border-line rounded-2xl" aria-label="خلاصه اقلام">
          <h2 className="font-display text-base text-ink mb-4 pb-3 border-b border-line">
            اقلام سبد خرید ({toFa(totals.itemCount)} عدد)
          </h2>

          <div className="space-y-3 mb-6 max-h-[280px] overflow-y-auto pr-1">
            {resolvedLines.map((item) => (
              <div
                key={`${item.line.id}-${item.line.size}-${item.line.color}`}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-ink block truncate">{item.product.name}</span>
                  <span className="text-[11px] text-ink-2">
                    {item.size?.label || "تک‌سایز"} • {item.color?.label || "رنگ پیش‌فرض"} • {toFa(item.line.qty)} عدد
                  </span>
                </div>
                <span className="font-mono text-xs text-ink whitespace-nowrap">
                  {formatTomanDigits(item.unitPrice * item.line.qty)} تومان
                </span>
              </div>
            ))}
          </div>

          <table className="w-full text-xs space-y-2 border-t border-line pt-4 mb-4">
            <tbody>
              <tr className="flex justify-between py-1.5 text-ink-2">
                <td>جمع اقلام</td>
                <td className="font-mono text-ink">{formatTomanDigits(totals.subtotalToman)} تومان</td>
              </tr>

              {appliedPromo && totals.discountToman > 0 && (
                <tr className="flex justify-between py-1.5 text-emerald-600 font-medium">
                  <td>تخفیف ({appliedPromo.code} - ٪{toFa(appliedPromo.percent)})</td>
                  <td className="font-mono">−{formatTomanDigits(totals.discountToman)} تومان</td>
                </tr>
              )}

              <tr className="flex justify-between py-1.5 text-ink-2">
                <td>هزینه ارسال</td>
                <td className="font-mono text-ink">
                  {totals.shippingToman === 0
                    ? "رایگان"
                    : `${formatTomanDigits(totals.shippingToman)} تومان`}
                </td>
              </tr>

              {totals.subtotalToman > 0 && totals.shippingToman > 0 && (
                <tr>
                  <td colSpan={2} className="text-[11px] text-ink-3 pt-1">
                    سفارش بالای {toFa(groupNum(settings.shippingFreeFromToman))} تومان، ارسال رایگان
                  </td>
                </tr>
              )}

              <tr className="flex justify-between py-3 border-t border-line mt-2 text-sm font-bold text-ink">
                <td>مبلغ کل قابل پرداخت</td>
                <td className="font-mono text-accent">{formatTomanDigits(totals.totalToman)} تومان</td>
              </tr>
            </tbody>
          </table>

          <div className="text-center pt-2">
            <TransitionLink href="/cart" className="text-xs text-ink-3 hover:text-accent">
              ویرایش سبد خرید
            </TransitionLink>
          </div>
        </aside>
      </div>
    </div>
  );
}
