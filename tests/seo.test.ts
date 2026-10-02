import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sitemap, { generateSitemaps } from "@/app/sitemap";
import robots from "@/app/robots";
import { metadata as shopMetadata } from "@/app/shop/page";
import { metadata as aboutMetadata } from "@/app/about/page";
import { metadata as cartMetadata } from "@/app/cart/page";
import { metadata as contactMetadata } from "@/app/contact/page";
import { metadata as designSystemMetadata } from "@/app/design-system/page";
import { metadata as checkoutLayoutMetadata } from "@/app/checkout/layout";
import { metadata as adminLayoutMetadata } from "@/app/admin/layout";
import { generateMetadata as generateProductMetadata } from "@/app/product/[slug]/page";
import { generateMetadata as generateOrderMetadata } from "@/app/order/[code]/page";
import { getImageCredits } from "@/lib/storefront";

describe("SEO Surface: Sitemap & Robots", () => {
  it("generates sitemap IDs using generateSitemaps", async () => {
    const sitemaps = await generateSitemaps();
    assert.ok(Array.isArray(sitemaps));
    assert.equal(sitemaps.length, 1);
    assert.equal(sitemaps[0].id, "0");
  });

  it("handles sitemap generation with Promise<string> id per Next.js 16 spec", async () => {
    const sitemapResult = await sitemap({
      id: Promise.resolve("0"),
    });

    assert.ok(Array.isArray(sitemapResult));

    // Verify static storefront routes are present
    const urls = sitemapResult.map((item) => item.url);
    const hasHome = urls.some((u) => u.endsWith("gereh.shop") || u.endsWith("/"));
    const hasShop = urls.some((u) => u.includes("/shop"));
    const hasAbout = urls.some((u) => u.includes("/about"));
    const hasContact = urls.some((u) => u.includes("/contact"));
    const hasDesignSystem = urls.some((u) => u.includes("/design-system"));

    assert.ok(hasHome, "Sitemap should contain home route");
    assert.ok(hasShop, "Sitemap should contain shop route");
    assert.ok(hasAbout, "Sitemap should contain about route");
    assert.ok(hasContact, "Sitemap should contain contact route");
    assert.ok(hasDesignSystem, "Sitemap should contain design-system route");

    // Admin and checkout must NEVER be in sitemap
    const hasAdmin = urls.some((u) => u.includes("/admin"));
    const hasCheckout = urls.some((u) => u.includes("/checkout"));
    assert.equal(hasAdmin, false, "Admin routes must not be in sitemap");
    assert.equal(hasCheckout, false, "Checkout routes must not be in sitemap");
  });

  it("returns robots.txt with disallow rules for /admin/ and /checkout/", () => {
    const robotsResult = robots();
    assert.ok(robotsResult.rules);

    const rules = Array.isArray(robotsResult.rules)
      ? robotsResult.rules
      : [robotsResult.rules];

    assert.ok(rules.length > 0);
    const mainRule = rules[0];
    assert.equal(mainRule.userAgent, "*");
    assert.equal(mainRule.allow, "/");

    const disallow = Array.isArray(mainRule.disallow)
      ? mainRule.disallow
      : [mainRule.disallow];

    assert.ok(disallow.includes("/admin/"));
    assert.ok(disallow.includes("/checkout/"));
    assert.ok(robotsResult.sitemap);
    assert.ok(String(robotsResult.sitemap).endsWith("/sitemap.xml"));
  });

  it("enforces noindex on /admin/* and /checkout/*", () => {
    // Checkout layout noindex
    const checkoutRobots = checkoutLayoutMetadata.robots as { index?: boolean; follow?: boolean };
    assert.equal(checkoutRobots?.index, false);
    assert.equal(checkoutRobots?.follow, false);

    // Admin layout noindex
    const adminRobots = adminLayoutMetadata.robots as { index?: boolean; follow?: boolean };
    assert.equal(adminRobots?.index, false);
    assert.equal(adminRobots?.follow, false);
  });
});

describe("SEO Surface: Metadata & Titles", () => {
  it("configures RootLayout with static sitewide OG image and title template", () => {
    const layoutSource = fs.readFileSync(
      path.join(process.cwd(), "app", "layout.tsx"),
      "utf-8"
    );

    // Verify title template
    assert.ok(layoutSource.includes('template: "%s — گِرِه"'));
    // Verify static sitewide OG image
    assert.ok(layoutSource.includes("/images/macrame-hanger-set.jpg"));
    assert.ok(layoutSource.includes('siteName: "گِرِه"'));
    assert.ok(layoutSource.includes('card: "summary_large_image"'));
  });

  it("conforms storefront routes to Persian titles («نام» — گِرِه pattern)", async () => {
    // Root template is "%s — گِرِه", so child page titles are "«نام»"
    assert.equal(shopMetadata.title, "«فروشگاه»");
    assert.equal(aboutMetadata.title, "«درباره و آموزش»");
    assert.equal(cartMetadata.title, "«سبد خرید»");
    assert.equal(contactMetadata.title, "«سفارش اختصاصی و تماس»");
    assert.equal(designSystemMetadata.title, "«دیزاین‌سیستم»");
    assert.equal(checkoutLayoutMetadata.title, "«تسویه حساب»");

    // Dynamic product route
    const productMeta = await generateProductMetadata({
      params: Promise.resolve({ slug: "tablo-par" }),
    });
    assert.ok(productMeta.title);
    assert.match(String(productMeta.title), /^«.+»$/);

    // Dynamic order route with noindex
    const orderMeta = await generateOrderMetadata({
      params: Promise.resolve({ code: "ABC123" }),
    });
    assert.equal(orderMeta.title, "«سفارش ABC123»");
    const orderRobots = orderMeta.robots as { index?: boolean; follow?: boolean };
    assert.equal(orderRobots?.index, false);
  });

  it("retrieves image license credits from images table for footer attribution", () => {
    const credits = getImageCredits();
    assert.ok(Array.isArray(credits));
    assert.ok(credits.length > 0);
    assert.ok(credits[0].path);
    assert.ok(credits[0].license !== undefined);
  });
});
