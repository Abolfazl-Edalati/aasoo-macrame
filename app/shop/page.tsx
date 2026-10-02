import type { Metadata } from "next";
import {
  getCollections,
  getAllColors,
  getShopProducts,
  type ShopFilterParams,
} from "@/lib/storefront";
import { ShopFilterBar } from "@/components/shop/ShopFilterBar";
import { ProductCard } from "@/components/product/ProductCard";
import { TransitionLink } from "@/components/motion/TransitionLink";

export const metadata: Metadata = {
  title: "«فروشگاه»",
  description:
    "فروشگاه محصولات مکرومه دستبافت، تابلو دیواری، گل‌آویز و اکسسوری با نخ پنبه طبیعی.",
};

type ShopPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;

  const collection =
    typeof resolvedParams.collection === "string"
      ? resolvedParams.collection
      : undefined;

  const color =
    typeof resolvedParams.color === "string" ? resolvedParams.color : undefined;

  const maxPrice =
    typeof resolvedParams.maxPrice === "string"
      ? Number(resolvedParams.maxPrice)
      : undefined;

  const minPrice =
    typeof resolvedParams.minPrice === "string"
      ? Number(resolvedParams.minPrice)
      : undefined;

  const inStock =
    resolvedParams.stock === "true" || resolvedParams.stock === "1";

  const sort =
    typeof resolvedParams.sort === "string" &&
    ["new", "cheap", "exp", "rate"].includes(resolvedParams.sort)
      ? (resolvedParams.sort as "new" | "cheap" | "exp" | "rate")
      : "new";

  const q =
    typeof resolvedParams.q === "string" ? resolvedParams.q.trim() : undefined;

  const filterParams: ShopFilterParams = {
    collection,
    color,
    maxPrice,
    minPrice,
    inStock,
    sort,
    q,
  };

  const collections = getCollections();
  const colors = getAllColors();
  const { items, totalPublished } = getShopProducts(filterParams);

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
          <span>فروشگاه</span>
        </nav>
      </div>

      <ShopFilterBar
        collections={collections}
        colors={colors}
        activeFilters={filterParams}
        totalPublished={totalPublished}
        filteredCount={items.length}
      />

      <section
        className="section--t"
        style={{ paddingTop: 0 } as React.CSSProperties}
        aria-label="نتایج فروشگاه"
      >
        <div className="wrap">
          {items.length > 0 ? (
            <div
              id="grid"
              className="od-grid grid-products"
              style={{ "--od-gap": "24px" } as React.CSSProperties}
            >
              {items.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div id="empty" className="empty-state">
              <svg className="knot-mark" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d="M24 6c-9 6-14 12-14 18s6 12 14 18c8-6 14-12 14-18S33 12 24 6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
              <h3>هیچ قطعه‌ای با این فیلترها پیدا نشد</h3>
              <p>
                دامنه‌ی قیمت را بازتر کنید یا دسته را عوض کنید. اگر چیزی در ذهن
                دارید که در فهرست نیست، سفارش اختصاصی بدهید — بافت می‌کنیم.
              </p>
              <div
                className="od-row"
                style={{ "--od-gap": "12px", flexWrap: "wrap" } as React.CSSProperties}
              >
                <TransitionLink className="btn btn--primary" href="/shop">
                  نمایش همه
                </TransitionLink>
                <TransitionLink className="btn btn--outline" href="/custom-order" dataNav>
                  سفارش اختصاصی
                </TransitionLink>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
