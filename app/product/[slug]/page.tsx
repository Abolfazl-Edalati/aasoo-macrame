import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/storefront";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuyPanel } from "@/components/product/ProductBuyPanel";
import { ProductCard } from "@/components/product/ProductCard";
import { TransitionLink } from "@/components/motion/TransitionLink";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "«محصول یافت نشد»",
    };
  }

  return {
    title: `«${product.name}»`,
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
              {related.map((rel, i) => (
                <div
                  key={rel.id}
                  style={{ width: "min(74vw, 260px)", flexShrink: 0 }}
                >
                  <ProductCard product={rel} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
