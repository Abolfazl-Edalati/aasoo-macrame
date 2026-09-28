import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/storefront";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuyPanel } from "@/components/product/ProductBuyPanel";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { formatTomanDigits } from "@/lib/format";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "محصول یافت نشد — گِرِه",
    };
  }

  return {
    title: `${product.name} — گِرِه`,
    description:
      product.subtitle ||
      "مشخصات، ابعاد، جنس نخ و افزودن مکرومه دستبافت به سبد خرید.",
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product.collectionId, product.id, 5);

  return (
    <main id="main">
      <div className="wrap" style={{ paddingBlock: "var(--s-5)" } as React.CSSProperties}>
        <nav
          className="od-row muted"
          style={{ "--od-gap": "8px", fontSize: "var(--fs-100)" } as React.CSSProperties}
          aria-label="مسیر"
        >
          <TransitionLink className="underline" href="/">
            خانه
          </TransitionLink>
          <span aria-hidden="true">/</span>
          <TransitionLink className="underline" href="/shop">
            فروشگاه
          </TransitionLink>
          <span aria-hidden="true">/</span>
          <span>{product.collectionName}</span>
        </nav>
      </div>

      <section
        className="wrap"
        style={{ paddingBottom: "var(--s-9)" } as React.CSSProperties}
      >
        <div
          className="od-grid"
          style={
            {
              "--od-cols": "2",
              "--od-gap": "48px",
              alignItems: "start",
            } as React.CSSProperties
          }
          id="p-layout"
        >
          {/* Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Buy Panel & Details */}
          <ProductBuyPanel product={product} />
        </div>
      </section>

      {/* Related Products Rail */}
      {related.length > 0 ? (
        <section
          className="section section--t"
          style={
            {
              borderTop: "1px solid var(--line)",
              background: "var(--surface)",
            } as React.CSSProperties
          }
        >
          <div className="wrap">
            <h2 style={{ fontSize: "var(--fs-400)" }}>هم‌ست با این کار</h2>
            <div
              className="od-rail"
              id="related"
              style={
                {
                  "--od-gap": "20px",
                  paddingBlock: "var(--s-4)",
                } as React.CSSProperties
              }
              aria-label="محصولات مرتبط"
            >
              {related.map((rel) => {
                const img = rel.heroImage ?? {
                  path: "/images/macrame-goa-large.jpg",
                  alt: rel.name,
                  width: 800,
                  height: 800,
                };
                return (
                  <TransitionLink
                    key={rel.id}
                    className="tile"
                    style={{ width: "min(74vw, 260px)" } as React.CSSProperties}
                    href={`/product/${encodeURIComponent(rel.slug)}`}
                    data-nav
                  >
                    <span className="tile-media">
                      <img
                        className="od-media od-media-cover"
                        style={{ "--od-ratio": "1.2" } as React.CSSProperties}
                        src={img.path}
                        width={img.width || 800}
                        height={img.height || 800}
                        alt={img.alt || rel.name}
                        loading="lazy"
                      />
                    </span>
                    <span className="tile-body">
                      <span
                        className="tile-name"
                        style={{ fontSize: "var(--fs-200)" }}
                      >
                        {rel.name}
                      </span>
                      <span className="price">
                        <span className="mono-num">
                          {formatTomanDigits(rel.priceToman)}
                        </span>{" "}
                        <small>تومان</small>
                      </span>
                    </span>
                  </TransitionLink>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
