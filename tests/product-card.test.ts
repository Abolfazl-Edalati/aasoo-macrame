import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getFeaturedProducts, getShopProducts, getRelatedProducts } from "@/lib/storefront";

describe("Product Card & Catalog Attachments", () => {
  it("getFeaturedProducts returns enriched product items with hero, secondary image, collection and colors", () => {
    const products = getFeaturedProducts(4);
    assert.ok(products.length > 0, "Should return featured products");

    for (const p of products) {
      assert.ok(p.id, "Product must have id");
      assert.ok(p.name, "Product must have name");
      assert.ok(p.slug, "Product must have slug");
      assert.ok(p.collectionId, "Product must have collectionId");
      assert.ok(typeof p.priceToman === "number", "Product must have priceToman");
      assert.ok(p.heroImage, "Product must have heroImage");
      assert.ok(p.heroImage.path.startsWith("/images/"), "Hero image must point to /images/");

      // Check collectionName attachment
      assert.ok(typeof p.collectionName === "string", "Product must have collectionName string");
      assert.ok(p.collectionName.length > 0, "Collection name must not be empty");

      // Check colors attachment
      assert.ok(Array.isArray(p.colors), "Product must have colors array");
      if (p.colors.length > 0) {
        assert.ok(p.colors[0].id, "Color item must have id");
        assert.ok(p.colors[0].label, "Color item must have label");
        assert.ok(p.colors[0].hex, "Color item must have hex code");
      }
    }

    // At least one seeded product has a secondary image (e.g. dideh-80 has 3 images)
    const withSecondary = products.filter((p) => p.secondaryImage !== null);
    assert.ok(withSecondary.length > 0, "At least one product should have secondary image");
    assert.ok(withSecondary[0].secondaryImage?.path.startsWith("/images/"));
  });

  it("getShopProducts attaches collectionName and colors for all items", () => {
    const { items, totalPublished } = getShopProducts({});
    assert.ok(totalPublished > 0, "Should have published products");
    assert.ok(items.length > 0, "Items list should not be empty");

    for (const item of items) {
      assert.ok(item.collectionName, "Each shop item must have a collection name");
      assert.ok(Array.isArray(item.colors), "Each shop item must have colors array");
    }
  });

  it("getRelatedProducts attaches enriched image and metadata", () => {
    const featured = getFeaturedProducts(1)[0];
    const related = getRelatedProducts(featured.collectionId, featured.id, 3);
    for (const r of related) {
      assert.notEqual(r.id, featured.id, "Related product must not include the current product");
      assert.ok(r.heroImage, "Related product must have hero image");
      assert.ok(r.collectionName, "Related product must have collection name");
      assert.ok(Array.isArray(r.colors), "Related product must have colors array");
    }
  });
});
