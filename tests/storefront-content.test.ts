import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAllArticles,
  getFaqItems,
  getContactChannels,
  getSiteSettings,
  getImageCredits,
} from "@/lib/storefront";

describe("storefront content queries", () => {
  it("getAllArticles returns full articles with body and image", () => {
    const articles = getAllArticles();
    assert.ok(articles.length >= 4, "Should have seeded articles");
    for (const a of articles) {
      assert.ok(a.id, "Article must have id");
      assert.ok(a.title, "Article must have title");
      assert.ok(a.excerpt, "Article must have excerpt");
      assert.ok(a.body, "Article must have full body");
      assert.ok(a.tag, "Article must have tag");
      assert.ok(a.date, "Article must have date");
      assert.ok(a.readMin > 0, "Article must have readMin");
      assert.ok(a.image?.path, "Article must have joined hero image path");
    }
  });

  it("getFaqItems returns faq items sorted by sort", () => {
    const items = getFaqItems();
    assert.ok(items.length >= 5, "Should have seeded FAQ items");
    for (const item of items) {
      assert.ok(item.question, "FAQ must have question");
      assert.ok(item.answer, "FAQ must have answer");
      assert.equal(typeof item.sort, "number");
    }
    for (let i = 1; i < items.length; i++) {
      assert.ok(items[i].sort >= items[i - 1].sort, "FAQ items must be in ascending sort order");
    }
  });

  it("getContactChannels returns enabled channels without email addresses", () => {
    const channels = getContactChannels();
    assert.ok(channels.length >= 2, "Should have contact channels");
    for (const ch of channels) {
      assert.equal(ch.enabled, true, "Only enabled channels returned");
      assert.notEqual(ch.type, "email", "Email channels forbidden per ADR-0005");
      assert.ok(!ch.value.includes("@"), "Values must not contain email addresses per ADR-0005");
    }
  });

  it("getSiteSettings returns map without hello@gereh.shop", () => {
    const settings = getSiteSettings();
    assert.ok(settings.name, "Settings should have name");
    assert.ok(settings.phone, "Settings should have phone");
    for (const [, val] of Object.entries(settings)) {
      assert.ok(!val.includes("hello@gereh.shop"), "No hello@gereh.shop in settings per ADR-0005");
    }
  });

  it("getImageCredits returns image list with artist and license", () => {
    const credits = getImageCredits();
    assert.ok(credits.length >= 7, "Should have image credits");
    for (const c of credits) {
      assert.ok(c.path, "Credit must have path");
      assert.ok(c.artist, "Credit must have artist");
      assert.ok(c.license, "Credit must have license");
    }
  });
});
