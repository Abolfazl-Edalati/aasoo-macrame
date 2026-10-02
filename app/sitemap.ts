import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";

/**
 * Multiple sitemap generation with Next.js 16 (SPEC §1).
 * In Next.js 16, generateSitemaps' id is passed as a Promise<string> to sitemap({ id }).
 */
export async function generateSitemaps() {
  return [{ id: "0" }];
}

export default async function sitemap(props?: {
  id?: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  if (props?.id) {
    const resolvedId = await props.id;
    // SPEC §1: generateSitemaps' id is Promise<string> — await before Number()
    void Number(resolvedId);
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://gereh.shop").replace(/\/+$/, "");

  // 1. Static storefront routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/design-system`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Only published products listed (SPEC §2, #21)
  const publishedProducts = db
    .select({
      slug: schema.products.slug,
    })
    .from(schema.products)
    .where(eq(schema.products.status, "published"))
    .all();

  for (const product of publishedProducts) {
    routes.push({
      url: `${baseUrl}/product/${encodeURIComponent(product.slug)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return routes;
}
