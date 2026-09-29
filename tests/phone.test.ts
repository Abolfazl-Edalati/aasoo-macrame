import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeIranianPhone, validateIranianPhone } from "@/lib/phone";

describe("normalizeIranianPhone", () => {
  it("normalizes standard Latin mobile number", () => {
    assert.equal(normalizeIranianPhone("09123456789"), "09123456789");
  });

  it("converts Persian digits to Latin", () => {
    assert.equal(normalizeIranianPhone("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
  });

  it("converts Arabic digits to Latin", () => {
    assert.equal(normalizeIranianPhone("٠٩١٢٣٤٥٦٧٨٩"), "09123456789");
  });

  it("strips separators (spaces, dashes, parentheses)", () => {
    assert.equal(normalizeIranianPhone("0912-345 6789"), "09123456789");
    assert.equal(normalizeIranianPhone("(0912) 345-6789"), "09123456789");
  });

  it("folds +98 prefix to 09", () => {
    assert.equal(normalizeIranianPhone("+989123456789"), "09123456789");
  });

  it("folds 0098 prefix to 09", () => {
    assert.equal(normalizeIranianPhone("00989123456789"), "09123456789");
  });

  it("folds leading 9 (without 0) to 09", () => {
    assert.equal(normalizeIranianPhone("9123456789"), "09123456789");
  });
});

describe("validateIranianPhone", () => {
  it("validates correct 09 mobile number", () => {
    const res = validateIranianPhone("09123456789");
    assert.equal(res.valid, true);
    assert.equal(res.phone, "09123456789");
  });

  it("rejects landlines starting with 021, etc.", () => {
    const res = validateIranianPhone("02188888888");
    assert.equal(res.valid, false);
    assert.ok(res.error);
  });

  it("rejects numbers with wrong length", () => {
    const res = validateIranianPhone("09123456");
    assert.equal(res.valid, false);
    assert.ok(res.error);
  });
});
