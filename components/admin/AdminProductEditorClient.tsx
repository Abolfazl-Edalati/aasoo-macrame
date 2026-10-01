"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { AdminProductDetail, AdminProductInput } from "@/lib/admin/products";
import type { AdminCollectionItem, AdminColorItem } from "@/lib/admin/taxonomy";
import type { AdminImageRecord } from "@/lib/admin/uploads";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  uploadImageAction,
} from "@/app/admin/products/actions";
import { formatTomanDigits, toFa } from "@/lib/format";

export type AdminProductEditorClientProps = {
  product?: AdminProductDetail | null;
  collections: AdminCollectionItem[];
  colors: AdminColorItem[];
  availableImages: AdminImageRecord[];
};

export function AdminProductEditorClient({
  product,
  collections,
  colors,
  availableImages: initialAvailableImages,
}: AdminProductEditorClientProps) {
  const router = useRouter();
  const isEditing = Boolean(product?.id);

  // Form states
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [subtitle, setSubtitle] = useState(product?.subtitle ?? "");
  const [collectionId, setCollectionId] = useState(
    product?.collectionId ?? collections[0]?.id ?? "wall"
  );
  const [status, setStatus] = useState<"draft" | "published">(
    (product?.status as "draft" | "published") ?? "draft"
  );
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [handmade, setHandmade] = useState(product?.handmade ?? true);
  const [sort, setSort] = useState(product?.sort ?? 0);

  const [priceToman, setPriceToman] = useState<number | string>(
    product?.priceToman ?? ""
  );
  const [compareAtToman, setCompareAtToman] = useState<number | string>(
    product?.compareAtToman ?? ""
  );
  const [stock, setStock] = useState<number | string>(product?.stock ?? 0);

  const [dimensions, setDimensions] = useState(product?.dimensions ?? "");
  const [materials, setMaterials] = useState(product?.materials ?? "");
  const [care, setCare] = useState(product?.care ?? "");
  const [weave, setWeave] = useState(product?.weave ?? "");
  const [weightKg, setWeightKg] = useState<number | string>(
    product?.weightKg ?? ""
  );
  const [madeIn, setMadeIn] = useState(product?.madeIn ?? "کارگاه گره");

  const [description, setDescription] = useState(product?.description ?? "");
  const [story, setStory] = useState(product?.story ?? "");

  // Sizes state (flat with deltaToman)
  const [sizes, setSizes] = useState<
    Array<{ id?: number; label: string; deltaToman: number; sort: number }>
  >(
    product?.sizes.map((s) => ({
      id: s.id,
      label: s.label,
      deltaToman: s.deltaToman,
      sort: s.sort,
    })) ?? []
  );

  // Colors state (selected color IDs)
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(
    product?.colors.map((c) => c.id) ?? []
  );

  // Assigned images state (sorted array: index 0 is hero)
  const [assignedImages, setAssignedImages] = useState<
    Array<{
      imageId: number;
      path: string;
      alt: string;
      artist?: string | null;
      license?: string | null;
    }>
  >(
    product?.images.map((img) => ({
      imageId: img.imageId,
      path: img.path,
      alt: img.alt,
      artist: img.artist,
      license: img.license,
    })) ?? []
  );

  const [libraryImages, setLibraryImages] = useState<AdminImageRecord[]>(
    initialAvailableImages
  );

  // Upload modal/form state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [altText, setAltText] = useState("");
  const [artistName, setArtistName] = useState("");
  const [licenseText, setLicenseText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // General submission state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handlers for sizes
  const handleAddSize = () => {
    setSizes((prev) => [
      ...prev,
      { label: "", deltaToman: 0, sort: prev.length + 1 },
    ]);
  };

  const handleUpdateSize = (
    index: number,
    field: "label" | "deltaToman",
    value: string | number
  ) => {
    setSizes((prev) => {
      const next = [...prev];
      if (field === "deltaToman") {
        next[index] = { ...next[index], deltaToman: Number(value) || 0 };
      } else {
        next[index] = { ...next[index], label: String(value) };
      }
      return next;
    });
  };

  const handleRemoveSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  // Handlers for colors
  const toggleColor = (colorId: string) => {
    setSelectedColorIds((prev) =>
      prev.includes(colorId)
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId]
    );
  };

  // Handlers for images
  const handleSetHero = (index: number) => {
    if (index === 0) return;
    setAssignedImages((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  const handleRemoveImage = (index: number) => {
    setAssignedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectFromLibrary = (img: AdminImageRecord) => {
    if (assignedImages.some((a) => a.imageId === img.id)) return;
    setAssignedImages((prev) => [
      ...prev,
      {
        imageId: img.id,
        path: img.path,
        alt: img.alt,
        artist: img.artist,
        license: img.license,
      },
    ]);
  };

  // Upload new image
  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("لطفاً یک فایل انتخاب کنید.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("alt", altText || name || "تصویر محصول");
      if (artistName) formData.append("artist", artistName);
      if (licenseText) formData.append("license", licenseText);

      const res = await uploadImageAction(formData);
      if (res.success && res.image) {
        setLibraryImages((prev) => [res.image, ...prev]);
        setAssignedImages((prev) => [
          ...prev,
          {
            imageId: res.image.id,
            path: res.image.path,
            alt: res.image.alt,
            artist: res.image.artist,
            license: res.image.license,
          },
        ]);
        // Reset form
        setSelectedFile(null);
        setAltText("");
        setArtistName("");
        setLicenseText("");
      } else {
        setUploadError(res.error || "خطا در بارگذاری تصویر.");
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "خطای ناشناخته در آپلود.");
    } finally {
      setIsUploading(false);
    }
  };

  // Submit product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("نام محصول الزامی است.");
      return;
    }

    const cleanSlug = (slug || name).trim().replace(/\s+/g, "-");
    if (!cleanSlug) {
      setErrorMsg("اسلاگ فارسی محصول الزامی است.");
      return;
    }

    const price = Number(priceToman);
    if (isNaN(price) || price < 0) {
      setErrorMsg("قیمت محصول باید یک عدد معتبر باشد.");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("توضیحات محصول الزامی است.");
      return;
    }

    setSaving(true);

    const payload: AdminProductInput = {
      name: name.trim(),
      slug: cleanSlug,
      subtitle: subtitle.trim() || null,
      collectionId,
      status,
      priceToman: price,
      compareAtToman: compareAtToman ? Number(compareAtToman) : null,
      stock: Number(stock) || 0,
      dimensions: dimensions.trim() || null,
      materials: materials.trim() || null,
      care: care.trim() || null,
      weave: weave.trim() || null,
      weightKg: weightKg ? Number(weightKg) : null,
      madeIn: madeIn.trim() || null,
      handmade,
      isNew,
      description: description.trim(),
      story: story.trim() || null,
      sort: Number(sort) || 0,
      sizes: sizes.map((s, idx) => ({
        label: s.label.trim(),
        deltaToman: s.deltaToman,
        sort: idx + 1,
      })),
      colorIds: selectedColorIds,
      images: assignedImages.map((img, idx) => ({
        imageId: img.imageId,
        sort: idx, // 0 is hero
      })),
    };

    try {
      if (isEditing && product) {
        const res = await updateProductAction(product.id, payload);
        if (res.success) {
          setSuccessMsg("محصول با موفقیت به‌روزرسانی شد.");
          router.refresh();
        } else {
          setErrorMsg(res.error || "خطا در ویرایش محصول.");
        }
      } else {
        const res = await createProductAction(payload);
        if (res.success && res.product) {
          setSuccessMsg("محصول جدید با موفقیت ایجاد شد.");
          router.push(`/admin/products/${res.product.id}`);
        } else {
          setErrorMsg(res.error || "خطا در ایجاد محصول.");
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "خطای ناشناخته رخ داد.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product?.id) return;
    if (
      !confirm(
        `آیا از حذف محصول «${product.name}» اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        router.push("/admin/products");
      } else {
        setErrorMsg(res.error || "خطا در حذف محصول.");
        setSaving(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "خطا در حذف محصول.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-line sticky top-16 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="text-xs text-ink-3 hover:text-ink transition-colors"
          >
            ← بازگشت به لیست
          </Link>
          <span className="text-line">|</span>
          <h1 className="font-display text-xl text-ink">
            {isEditing ? `ویرایش: ${product?.name}` : "افزودن محصول جدید"}
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="btn btn--outline btn--sm text-rose-700 hover:bg-rose-50 hover:border-rose-300 text-xs cursor-pointer"
            >
              حذف محصول
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn btn--primary text-sm min-w-32 cursor-pointer"
          >
            {saving ? "در حال ذخیره…" : isEditing ? "ذخیره تغییرات" : "ایجاد محصول"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {successMsg}
        </div>
      )}

      {/* Grid: Left Column Main Content, Right Column Metadata & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Basic info */}
          <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
            <h2 className="font-bold text-ink text-base border-b border-line pb-2">
              اطلاعات اصلی محصول
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  نام محصول <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!isEditing && !slug) {
                      setSlug(e.target.value.trim().replace(/\s+/g, "-"));
                    }
                  }}
                  placeholder="مثال: دیوارکوب پر سیمرغ"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  اسلاگ فارسی (نامک در آدرس URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="مثال: دیوارکوب-پر-سیمرغ"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-accent"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                زیرعنوان یا برچسب کوتاه
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="مثال: بافت دستبافت با نخ پنبه ارگانیک"
                className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                توضیحات کامل محصول <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیح کامل در مورد بافت، زیبایی‌شناسی، نحوه نصب و جزئیات…"
                className="w-full p-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                روایت و داستان اثر (Story)
              </label>
              <textarea
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="داستان الهام‌بخش یا روایت شکل‌گیری این قطعه…"
                className="w-full p-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent leading-relaxed"
              />
            </div>
          </div>

          {/* Section: Technical Specs & Dimensions */}
          <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
            <h2 className="font-bold text-ink text-base border-b border-line pb-2">
              مشخصات فنی و ابعاد
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  ابعاد محصول (متن آزاد)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="مثال: عرض ۵۰ سانتی‌متر، قد با ریشه ۸۵ سانتی‌متر"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  جنس و متریال
                </label>
                <input
                  type="text"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="مثال: نخ پنبه ۴ میلی‌متر، چوب طبیعی جنگلی"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  دستور نگهداری و شست‌وشو
                </label>
                <input
                  type="text"
                  value={care}
                  onChange={(e) => setCare(e.target.value)}
                  placeholder="مثال: گردگیری با سشوار سرد، عدم شست‌وشو با آب"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  نوع گره و بافت
                </label>
                <input
                  type="text"
                  value={weave}
                  onChange={(e) => setWeave(e.target.value)}
                  placeholder="مثال: گره مربعی، خفت، شیاری"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  وزن تقریبی (کیلوگرم)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="مثال: 1.2"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  محل تولید و بافت
                </label>
                <input
                  type="text"
                  value={madeIn}
                  onChange={(e) => setMadeIn(e.target.value)}
                  placeholder="مثال: کارگاه گره اصفهان"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Section: Sizes (Flat with delta_toman) */}
          <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <div>
                <h2 className="font-bold text-ink text-base">سایزهای محصول</h2>
                <p className="text-xs text-ink-3">
                  سایزها به صورت تخت با اختلاف قیمت (تومان) ثبت می‌شوند؛ بدون ماتریس ترکیبی.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSize}
                className="btn btn--outline btn--sm text-xs cursor-pointer"
              >
                + افزودن سایز
              </button>
            </div>

            {sizes.length === 0 ? (
              <p className="text-xs text-ink-3 py-3 text-center">
                سایز اختصاصی تعریف نشده است (محصول تک‌سایز با قیمت پایه فروخته می‌شود).
              </p>
            ) : (
              <div className="space-y-3">
                {sizes.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-bg rounded-lg border border-line"
                  >
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] text-ink-3 mb-0.5">
                        عنوان سایز
                      </label>
                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) =>
                          handleUpdateSize(idx, "label", e.target.value)
                        }
                        placeholder="مثال: استاندارد (۵۰×۸۰)"
                        className="w-full h-9 px-3 rounded border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div className="w-full sm:w-48">
                      <label className="block text-[11px] text-ink-3 mb-0.5">
                        اختلاف قیمت با قیمت پایه (تومان)
                      </label>
                      <input
                        type="number"
                        step="5000"
                        value={s.deltaToman}
                        onChange={(e) =>
                          handleUpdateSize(idx, "deltaToman", e.target.value)
                        }
                        placeholder="0"
                        className="w-full h-9 px-3 rounded border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                        dir="ltr"
                      />
                    </div>

                    <div className="pt-4 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(idx)}
                        className="text-xs text-rose-600 hover:text-rose-800 p-2 cursor-pointer"
                        title="حذف این سایز"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Image Assignment & Hero Ordering */}
          <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
            <div className="border-b border-line pb-2">
              <h2 className="font-bold text-ink text-base">
                تصاویر محصول و تصویر شاخص (Hero)
              </h2>
              <p className="text-xs text-ink-3">
                تصویر اول به عنوان تصویر شاخص (Hero) در فروشگاه نمایش داده می‌شود.
              </p>
            </div>

            {/* Assigned images list */}
            <div>
              <h3 className="text-xs font-semibold text-ink-2 mb-2">
                تصاویر منتسب به این محصول ({toFa(assignedImages.length)})
              </h3>

              {assignedImages.length === 0 ? (
                <p className="text-xs text-ink-3 py-4 text-center bg-bg rounded-lg border border-dashed border-line">
                  هنوز تصویری به این محصول اختصاص نیافته است.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {assignedImages.map((img, idx) => (
                    <div
                      key={img.imageId}
                      className={`relative rounded-lg border p-2 bg-bg flex flex-col justify-between ${
                        idx === 0
                          ? "border-accent ring-1 ring-accent"
                          : "border-line"
                      }`}
                    >
                      <div className="aspect-square relative rounded bg-surface overflow-hidden mb-2">
                        <Image
                          src={img.path}
                          alt={img.alt}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 right-1 text-[10px] bg-accent text-white px-1.5 py-0.5 rounded shadow-xs font-medium">
                            تصویر اصلی (Hero)
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-ink-3 truncate mb-2">
                        {img.alt || "بدون توضیح"}
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-line/60">
                        {idx !== 0 ? (
                          <button
                            type="button"
                            onClick={() => handleSetHero(idx)}
                            className="text-[11px] text-accent hover:underline cursor-pointer"
                          >
                            انتخاب به عنوان Hero
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            شاخص
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload New Image Box */}
            <div className="bg-bg rounded-lg border border-line p-4 space-y-3 mt-4">
              <h3 className="text-xs font-bold text-ink">
                بارگذاری تصویر جدید با ثبت اطلاعات حق نشر و عکاس
              </h3>

              {uploadError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-ink-3 mb-1">
                    فایل تصویر (JPG, PNG, WebP)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] ?? null)
                    }
                    className="w-full text-xs text-ink file:mr-0 file:ml-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-surface-alt file:text-ink hover:file:bg-line cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-ink-3 mb-1">
                    متن جایگزین (Alt)
                  </label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="مثال: نمای نزدیک از گره‌های بافت مکرومه"
                    className="w-full h-8 px-2.5 rounded border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-ink-3 mb-1">
                    عکاس / هنرمند (Artist Credit)
                  </label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="مثال: استودیو عکاسی گره"
                    className="w-full h-8 px-2.5 rounded border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-ink-3 mb-1">
                    مجوز / لایسنس (License)
                  </label>
                  <input
                    type="text"
                    value={licenseText}
                    onChange={(e) => setLicenseText(e.target.value)}
                    placeholder="مثال: اختصاصی کارگاه / CC-BY"
                    className="w-full h-8 px-2.5 rounded border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={isUploading || !selectedFile}
                  className="btn btn--outline btn--sm text-xs cursor-pointer"
                >
                  {isUploading ? "در حال آپلود…" : "آپلود و انتساب به محصول"}
                </button>
              </div>
            </div>

            {/* Select from existing library images */}
            {libraryImages.length > 0 && (
              <div className="pt-2">
                <details className="text-xs">
                  <summary className="font-medium text-ink-2 cursor-pointer hover:text-accent">
                    انتخاب از تصاویر موجود در کتابخانه ({toFa(libraryImages.length)} تصویر)
                  </summary>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 max-h-48 overflow-y-auto p-2 bg-bg rounded-lg border border-line">
                    {libraryImages.map((img) => {
                      const isAssigned = assignedImages.some(
                        (a) => a.imageId === img.id
                      );
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => handleSelectFromLibrary(img)}
                          disabled={isAssigned}
                          className={`relative aspect-square rounded overflow-hidden border ${
                            isAssigned
                              ? "opacity-40 border-line"
                              : "border-line hover:border-accent cursor-pointer"
                          }`}
                        >
                          <Image
                            src={img.path}
                            alt={img.alt}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Status & Visibility Card */}
          <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
            <h2 className="font-bold text-ink text-base border-b border-line pb-2">
              وضعیت و انتشار
            </h2>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                وضعیت انتشار
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
                className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
              >
                <option value="draft">پیش‌نویس (مخفی در فروشگاه)</option>
                <option value="published">منتشر شده (قابل خرید)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                دسته‌بندی <span className="text-rose-500">*</span>
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-line/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-xs text-ink">نشان «محصول جدید» (New)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={handmade}
                  onChange={(e) => setHandmade(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-xs text-ink">نشان «دست‌بافت ۱۰۰٪»</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                ترتیب اولویت نمایش (sort)
              </label>
              <input
                type="number"
                value={sort}
                onChange={(e) => setSort(Number(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                dir="ltr"
              />
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
            <h2 className="font-bold text-ink text-base border-b border-line pb-2">
              قیمت و موجودی انبار
            </h2>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                قیمت فروش (تومان) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={priceToman}
                onChange={(e) => setPriceToman(e.target.value)}
                placeholder="مثال: 450000"
                className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent font-mono"
                dir="ltr"
              />
              {priceToman ? (
                <span className="text-[11px] text-ink-3 mt-1 block">
                  معادل: {formatTomanDigits(Number(priceToman))} تومان
                </span>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                قیمت اصلی / خط‌خورده (تومان)
              </label>
              <input
                type="number"
                value={compareAtToman}
                onChange={(e) => setCompareAtToman(e.target.value)}
                placeholder="اختیاری — مثال: 500000"
                className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                موجودی قابل سفارش در انبار <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent font-mono"
                dir="ltr"
              />
              <span className="text-[11px] text-ink-3 mt-1 block">
                موجودی روی سطح محصول ذخیره می‌شود؛ رنگ‌ها موجودی جداگانه ندارند.
              </span>
            </div>
          </div>

          {/* Color palette selector card */}
          <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
            <div className="border-b border-line pb-2">
              <h2 className="font-bold text-ink text-base">رنگ‌های قابل انتخاب</h2>
              <p className="text-xs text-ink-3">
                رنگ‌های موجود برای این محصول را از پالت مشترک انتخاب کنید.
              </p>
            </div>

            <div className="space-y-2">
              {colors.map((c) => {
                const checked = selectedColorIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? "bg-accent-soft border-accent text-ink"
                        : "bg-bg border-line text-ink-2 hover:border-line-2"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-xs font-medium">{c.label}</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColor(c.id)}
                      className="rounded border-line text-accent focus:ring-accent"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
