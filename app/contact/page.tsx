import type { Metadata } from "next";
import Image from "next/image";
import {
  getContactChannels,
  getCollections,
  getAllColors,
  getSiteSettings,
} from "@/lib/storefront";
import { CustomOrderForm } from "@/components/contact/CustomOrderForm";

export const metadata: Metadata = {
  title: "سفارش اختصاصی و تماس",
  description:
    "سفارش ساخت مکرومه با ابعاد و رنگ دلخواه شما، راه‌های ارتباط با کارگاه گِرِه در تهران.",
};

export default function ContactPage() {
  const channels = getContactChannels();
  const collections = getCollections();
  const colors = getAllColors();
  const settings = getSiteSettings();

  return (
    <main id="main">
      <section className="section" style={{ paddingBlock: "var(--spacing-9)" }}>
        <div className="wrap">
          <div className="split items-start">
            {/* LEFT: Contact info & story */}
            <div>
              <span className="eyebrow reveal">تماس و سفارش</span>
              <h1 className="reveal font-display" style={{ "--i": 1 } as React.CSSProperties}>
                سفارشی برای<br />دیوار شما
              </h1>
              <p
                className="lead ink2 reveal leading-relaxed"
                style={{ "--i": 2, maxWidth: "56ch" } as React.CSSProperties}
              >
                هر خانه نوری دارد و هر دیوار ابعادی. اگر قطعه‌ای با قد و ترکیب رنگ خاص می‌خواهید،
                یا برای فضای کافه و هتل سفارش عمده دارید، همین‌جا بنویسید یا از راه‌های زیر پیام دهید.
              </p>

              <div
                className="od-stack"
                style={
                  {
                    "--od-gap": "24px",
                    marginTop: "var(--spacing-7)",
                  } as React.CSSProperties
                }
              >
                {/* Dynamic Contact Channels from DB (strictly NO email addresses per ADR-0005) */}
                {channels.map((ch, idx) => {
                  let href = "";
                  let displayValue = ch.value;
                  let icon = null;

                  if (ch.type === "phone") {
                    href = `tel:${ch.value}`;
                    icon = (
                      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 5h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 14l5 2v4a15 15 0 0 1-15-15z" />
                      </svg>
                    );
                  } else if (ch.type === "whatsapp") {
                    const digits = ch.value.replace(/[^0-9]/g, "");
                    const intl = digits.startsWith("0") ? "98" + digits.slice(1) : digits;
                    href = `https://wa.me/${intl}`;
                    icon = (
                      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    );
                  } else if (ch.type === "telegram") {
                    const username = ch.value.replace(/^@/, "");
                    href = `https://t.me/${username}`;
                    displayValue = `@${username}`;
                    icon = (
                      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21.5 3.5L2 11l7 3 2 7 4-4.5 5 4.5 1.5-17.5z" />
                      </svg>
                    );
                  } else if (ch.type === "instagram") {
                    const username = ch.value.replace(/^@/, "");
                    href = `https://instagram.com/${username}`;
                    displayValue = `@${username}`;
                    icon = (
                      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    );
                  }

                  const isExternal = ch.type !== "phone";

                  return (
                    <div
                      key={ch.id}
                      className="od-row reveal items-center"
                      style={{ "--od-gap": "16px", "--i": 3 + idx } as React.CSSProperties}
                    >
                      <span
                        className="icon-btn shrink-0"
                        style={{
                          background: "var(--color-surface)",
                          color: "var(--color-accent)",
                        }}
                        aria-hidden="true"
                      >
                        {icon}
                      </span>
                      <div className="od-stack" style={{ "--od-gap": "2px" } as React.CSSProperties}>
                        <span className="muted text-xs">{ch.label}</span>
                        <a
                          className={`font-bold text-base hover:text-accent ${isExternal ? "underline" : "od-nowrap"}`}
                          href={href}
                          dir="ltr"
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                        >
                          {displayValue}
                        </a>
                      </div>
                    </div>
                  );
                })}

                {/* Workshop Address */}
                <div
                  className="od-row reveal items-center"
                  style={{ "--od-gap": "16px", "--i": 5 } as React.CSSProperties}
                >
                  <span
                    className="icon-btn shrink-0"
                    style={{
                      background: "var(--color-surface)",
                      color: "var(--color-accent)",
                    }}
                    aria-hidden="true"
                  >
                    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>
                  <div className="od-stack" style={{ "--od-gap": "2px" } as React.CSSProperties}>
                    <span className="muted text-xs">کارگاه — بازدید با هماهنگی</span>
                    <span className="font-semibold text-sm">
                      {settings.address || "تهران، خیابان شریعتی، کوچه‌ی گلستان، پلاک ۱۲"}
                    </span>
                  </div>
                </div>

                {/* Business Hours */}
                <div
                  className="od-row reveal items-center"
                  style={{ "--od-gap": "16px", "--i": 6 } as React.CSSProperties}
                >
                  <span
                    className="icon-btn shrink-0"
                    style={{
                      background: "var(--color-surface)",
                      color: "var(--color-accent)",
                    }}
                    aria-hidden="true"
                  >
                    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="8.5" />
                      <path d="M12 7v5l3.5 2" />
                    </svg>
                  </span>
                  <div className="od-stack" style={{ "--od-gap": "2px" } as React.CSSProperties}>
                    <span className="muted text-xs">ساعت کاری</span>
                    <span className="font-semibold text-sm">
                      {settings.hours || "شنبه تا چهارشنبه، ۱۰ تا ۱۸"}
                    </span>
                  </div>
                </div>
              </div>

              <figure
                className="reveal-scale mt-8"
                style={{ "--i": 5 } as React.CSSProperties}
              >
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-surface-alt">
                  <Image
                    src="/assets/img/hanging-plants-porch.jpg"
                    width={1920}
                    height={1307}
                    alt="گل‌آویزهای مکرومه روی ایوان کارگاه"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="muted text-xs mt-3">
                  ایوان کارگاه — نمونه‌کارها قبل از ارسال اینجا عکاسی می‌شوند.
                </figcaption>
              </figure>
            </div>

            {/* RIGHT: Order form at #order */}
            <div
              className="card shadow-lg p-6 sm:p-8"
              style={{ padding: "var(--spacing-7)" }}
              id="order"
            >
              <h2
                style={{ fontSize: "var(--text-400)", marginBottom: "var(--spacing-2)" }}
                className="font-display"
              >
                فرم سفارش اختصاصی
              </h2>
              <p className="muted text-sm leading-relaxed mb-6">
                فیلدهای ستاره‌دار الزامی‌اند. بعد از ارسال، پیش‌فاکتور و نمونهٔ طرح را می‌بینید؛
                فقط بعد از تأیید شما بافت شروع می‌شود.
              </p>

              <CustomOrderForm collections={collections} colors={colors} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
