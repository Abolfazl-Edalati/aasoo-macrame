import React from "react";
import type { Metadata } from "next";
import {
  getCollections,
  getCollectionCounts,
  getFeaturedProducts,
  getLatestArticles,
} from "@/lib/storefront";
import { toFa } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { LivingKnot } from "@/components/motion/LivingKnot";
import { Marquee } from "@/components/motion/Marquee";
import { TransitionLink } from "@/components/motion/TransitionLink";

export const metadata: Metadata = {
  title: {
    absolute: "گِرِه — فروشگاه مکرومه‌بافی دستبافت",
  },
  description:
    "مکرومه‌های گِرِه بدون دار و دستگاه، فقط با نخ و دست بافته می‌شوند؛ از تابلوی بلند سالن تا گل‌آویز کنار پنجره.",
};

const COLLECTION_MEDIA: Record<
  string,
  { img: string; ratio: string; sub: string; w: number; h: number }
> = {
  wall: {
    img: "/images/macrame-goa-large.jpg",
    ratio: "1.4713",
    sub: "بافت‌های بزرگ برای مرکز دیوار پذیرایی",
    w: 1920,
    h: 3417,
  },
  plant: {
    img: "/images/macrame-hanger-set.jpg",
    ratio: "1.4713",
    sub: "آویز گلدان با گره‌های موج‌دار و پایه‌دار",
    w: 1920,
    h: 1371,
  },
  decor: {
    img: "/images/macrame-collar-detail-a.jpg",
    ratio: "1.3333",
    sub: "گردن‌آویز، عروسک گرهی و توربچه",
    w: 1920,
    h: 2560,
  },
};

export default async function Home() {
  const collections = getCollections();
  const collectionCounts = getCollectionCounts();
  const featured = getFeaturedProducts(4);
  const articles = getLatestArticles(3);

  return (
    <main id="main">
      {/* HERO */}
      <section className="hero band-dark" data-inverse>
        <div className="hero-bg parallax" data-speed="0.05" aria-hidden="true">
          <img
            className="kenburns"
            src="/images/hanging-plants-porch.jpg"
            width={1920}
            height={1307}
            alt=""
            fetchPriority="high"
          />
        </div>
        <div className="wrap">
          <div
            className="od-grid split"
            style={{ "--od-gap": "48px", alignItems: "center" } as React.CSSProperties}
          >
            <div>
              <span className="eyebrow reveal" style={{ color: "var(--accent)" }}>
                بافته‌ی دست، هر قطعه یکتا
              </span>
              <h1
                className="reveal"
                style={{ "--i": 1, marginBottom: "var(--s-5)" } as React.CSSProperties}
              >
                گره‌هایی که
                <br />
                خانه را گرم می‌کنند
              </h1>
              <p
                className="lead ink2 reveal"
                style={{ "--i": 2, maxWidth: "60ch" } as React.CSSProperties}
              >
                مکرومه‌های گِرِه بدون دار و دستگاه، فقط با نخ و دست بافته
                می‌شوند؛ از تابلوی بلند سالن تا گل‌آویز کنار پنجره.
              </p>
              <div
                className="od-cluster reveal"
                style={
                  {
                    "--i": 3,
                    "--od-gap": "12px",
                    marginTop: "var(--s-5)",
                  } as React.CSSProperties
                }
              >
                <TransitionLink
                  className="btn btn--primary btn--lg magnetic"
                  href="/shop"
                  dataNav
                >
                  مشاهده‌ی مجموعه
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19 12H5M11 6l-6 6 6 6" />
                  </svg>
                </TransitionLink>
                <TransitionLink
                  className="btn btn--outline btn--lg"
                  style={
                    {
                      borderColor: "var(--ink-2)",
                      color: "var(--ink)",
                    } as React.CSSProperties
                  }
                  href="/custom-order"
                  dataNav
                >
                  سفارش اختصاصی
                </TransitionLink>
              </div>
              <p
                className="muted reveal"
                style={
                  {
                    "--i": 4,
                    marginTop: "var(--s-6)",
                    fontSize: "var(--fs-100)",
                  } as React.CSSProperties
                }
              >
                نمونه‌داده — نام برند و قیمتها در فایل داده قابل ویرایش است.
              </p>
            </div>
            <div className="center reveal-scale" style={{ "--i": 2 } as React.CSSProperties}>
              <LivingKnot />
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <Marquee />

      {/* COLLECTIONS */}
      <section className="section" aria-labelledby="coll-h">
        <div className="wrap">
          <div
            className="od-row"
            style={
              {
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "var(--s-7)",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="eyebrow reveal">دسته‌ها</span>
              <h2 id="coll-h" className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
                کجا گره می‌خورد؟
              </h2>
            </div>
            <TransitionLink
              className="btn btn--quiet reveal"
              style={{ "--i": 2 } as React.CSSProperties}
              href="/shop"
              dataNav
            >
              همه‌ی محصولات
            </TransitionLink>
          </div>
          <div
            className="od-grid grid-3"
            style={{ "--od-gap": "24px" } as React.CSSProperties}
          >
            {collections.slice(0, 3).map((col, i) => {
              const meta = COLLECTION_MEDIA[col.id] || {
                img: "/images/macrame-goa-large.jpg",
                ratio: "1.3333",
                sub: col.desc || "",
                w: 1920,
                h: 2560,
              };
              const count = collectionCounts[col.id] || 0;
              return (
                <TransitionLink
                  key={col.id}
                  className="tile od-tile reveal"
                  style={{ "--i": i } as React.CSSProperties}
                  href={`/shop?collection=${col.id}`}
                  data-card-collection={col.id}
                >
                  <span className="tile-media">
                    <img
                      className="od-media od-media-cover"
                      style={{ "--od-ratio": meta.ratio } as React.CSSProperties}
                      src={meta.img}
                      width={meta.w}
                      height={meta.h}
                      alt={col.name}
                      loading="lazy"
                    />
                  </span>
                  <span className="tile-body">
                    <span className="tile-name">{col.name}</span>
                    <span className="tile-sub od-clamp-2">{meta.sub}</span>
                    <span className="muted" data-count={col.id}>
                      {toFa(count)} محصول
                    </span>
                  </span>
                </TransitionLink>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section
        className="section section--t"
        aria-labelledby="feat-h"
        style={{ background: "var(--surface)" }}
      >
        <div className="wrap">
          <div
            className="od-row"
            style={
              {
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "var(--s-6)",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="eyebrow reveal">منتخب کارگاه</span>
              <h2 id="feat-h" className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
                قطعه‌های این هفته
              </h2>
            </div>
          </div>
          <div
            id="featured"
            className="od-grid grid-products"
            style={{ "--od-gap": "24px" } as React.CSSProperties}
            aria-live="polite"
          >
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* DARK PROCESS BAND */}
      <section
        className="section band-dark"
        data-inverse
        aria-labelledby="proc-h"
      >
        <div className="wrap">
          <div className="split" style={{ alignItems: "center" }}>
            <div className="reveal-x" style={{ "--rx": "36px" } as React.CSSProperties}>
              <figure>
                <img
                  className="od-media"
                  style={
                    {
                      "--od-ratio": "0.75",
                      borderRadius: "var(--r-lg)",
                    } as React.CSSProperties
                  }
                  src="/images/macrame-textile-panel.jpg"
                  width={1920}
                  height={2560}
                  alt="نمای نزدیک بافت مکرومه با نخ‌های در هم تنیده"
                  loading="lazy"
                />
                <figcaption className="muted">
                  بافت موجی؛ هر ردیف نیم‌گره، دو گره‌ی فیکس انتهایی دارد.
                </figcaption>
              </figure>
            </div>
            <div>
              <span className="eyebrow reveal">روش کار</span>
              <h2 id="proc-h" className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
                سه قدم تا دیوار شما
              </h2>
              <div
                className="od-stack"
                style={
                  {
                    "--od-gap": "24px",
                    marginTop: "var(--s-6)",
                  } as React.CSSProperties
                }
              >
                <div
                  className="od-row-top reveal"
                  style={{ "--i": 2, "--od-gap": "16px" } as React.CSSProperties}
                >
                  <span
                    className="icon-btn"
                    style={{
                      borderColor: "var(--line)",
                      background: "var(--surface-alt)",
                      color: "var(--accent)",
                    }}
                    aria-hidden="true"
                  >
                    <b style={{ fontVariantNumeric: "tabular-nums" }}>۰۱</b>
                  </span>
                  <span className="od-stack" style={{ "--od-gap": "4px" } as React.CSSProperties}>
                    <b style={{ fontSize: "var(--fs-200)" }}>انتخاب نخ و رنگ</b>
                    <span className="ink2">
                      پنج پایه‌ی رنگی: کرم، شنی، زیتونی، گردویی، رسی. نمونه‌ی نخ
                      قبل از بافت می‌آید.
                    </span>
                  </span>
                </div>
                <div
                  className="od-row-top reveal"
                  style={{ "--i": 3, "--od-gap": "16px" } as React.CSSProperties}
                >
                  <span
                    className="icon-btn"
                    style={{
                      borderColor: "var(--line)",
                      background: "var(--surface-alt)",
                      color: "var(--accent)",
                    }}
                    aria-hidden="true"
                  >
                    <b style={{ fontVariantNumeric: "tabular-nums" }}>۰۲</b>
                  </span>
                  <span className="od-stack" style={{ "--od-gap": "4px" } as React.CSSProperties}>
                    <b style={{ fontSize: "var(--fs-200)" }}>
                      بافت دستی، بدون دار
                    </b>
                    <span className="ink2">
                      قطعه روی میچوی چوبی آویزان کشیده می‌شود؛ تنش گره‌ها
                      دست‌کنترل است، به‌همین‌خاطر هر کار یکتاست.
                    </span>
                  </span>
                </div>
                <div
                  className="od-row-top reveal"
                  style={{ "--i": 4, "--od-gap": "16px" } as React.CSSProperties}
                >
                  <span
                    className="icon-btn"
                    style={{
                      borderColor: "var(--line)",
                      background: "var(--surface-alt)",
                      color: "var(--accent)",
                    }}
                    aria-hidden="true"
                  >
                    <b style={{ fontVariantNumeric: "tabular-nums" }}>۰۳</b>
                  </span>
                  <span className="od-stack" style={{ "--od-gap": "4px" } as React.CSSProperties}>
                    <b style={{ fontSize: "var(--fs-200)" }}>
                      نصب و آموزش نگهداری
                    </b>
                    <span className="ink2">
                      راهنمای نصب و کارتنگی نگهداری داخل بسته است؛ ارسال به سراسر
                      ایران.
                    </span>
                  </span>
                </div>
              </div>
              <TransitionLink
                className="btn btn--primary reveal magnetic"
                style={
                  {
                    "--i": 5,
                    marginTop: "var(--s-6)",
                  } as React.CSSProperties
                }
                href="/about"
                dataNav
              >
                داستان کارگاه را بخوانید
              </TransitionLink>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNAL */}
      <section className="section" aria-labelledby="jr-h">
        <div className="wrap">
          <div
            className="od-row"
            style={
              {
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "var(--s-6)",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="eyebrow reveal">آموزش و وبلاگ</span>
              <h2 id="jr-h" className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
                از گره تا دیوار
              </h2>
            </div>
            <TransitionLink
              className="btn btn--quiet reveal"
              style={{ "--i": 2 } as React.CSSProperties}
              href="/about#journal"
            >
              همه‌ی نوشته‌ها
            </TransitionLink>
          </div>
          <div
            id="journal"
            className="od-stack"
            style={{ "--od-gap": "16px" } as React.CSSProperties}
            aria-live="polite"
          >
            {articles.map((a, i) => (
              <article
                key={a.id}
                className="post-card reveal"
                style={{ "--i": i } as React.CSSProperties}
              >
                <img
                  className="od-media od-media-cover"
                  style={{ "--od-ratio": "1.3333" } as React.CSSProperties}
                  src={a.imagePath || undefined}
                  width={a.imageWidth || 1920}
                  height={a.imageHeight || 1440}
                  alt={a.imageAlt || a.title}
                  loading="lazy"
                />
                <div className="od-stack" style={{ "--od-gap": "8px" } as React.CSSProperties}>
                  <div className="post-meta">
                    <span
                      className="chip"
                      style={{ minHeight: "32px", pointerEvents: "none" }}
                    >
                      {a.tag}
                    </span>
                    <span>
                      {a.date} · {toFa(a.readMin)} دقیقه
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: "var(--fs-300)" }}>
                    <TransitionLink
                      href="/about#journal"
                      className="underline"
                    >
                      {a.title}
                    </TransitionLink>
                  </h3>
                  <p className="od-clamp-2 ink2" style={{ margin: 0 }}>
                    {a.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOM ORDER CTA */}
      <section
        className="section section--t"
        style={
          {
            background: "var(--surface)",
            borderBlock: "1px solid var(--line)",
          } as React.CSSProperties
        }
      >
        <div className="wrap">
          <div
            className="od-row"
            style={
              {
                justifyContent: "space-between",
                "--od-gap": "32px",
                flexWrap: "wrap",
              } as React.CSSProperties
            }
          >
            <div className="reveal" style={{ maxWidth: "56ch" }}>
              <span className="eyebrow">سفارش اختصاصی</span>
              <h2 style={{ marginBottom: "var(--s-3)" }}>
                اندازه‌ی دیوارِ خودت را بفرست
              </h2>
              <p className="ink2" style={{ margin: 0 }}>
                قد و عرض دیوار، رنگ نخ و زمان تحویل را با هم تعیین می‌کنیم؛ بعد
                از تأیید طرح، بافت شروع می‌شود.
              </p>
            </div>
            <div className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
              <TransitionLink
                className="btn btn--dark btn--lg magnetic"
                href="/custom-order"
                dataNav
              >
                فرم سفارش اختصاصی
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
              </TransitionLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
