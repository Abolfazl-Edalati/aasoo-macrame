"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCollectionItem, AdminColorItem } from "@/lib/admin/taxonomy";
import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  createColorAction,
  updateColorAction,
  deleteColorAction,
} from "@/app/admin/collections/actions";
import { toFa } from "@/lib/format";

export type AdminTaxonomyClientProps = {
  initialCollections: AdminCollectionItem[];
  initialColors: AdminColorItem[];
};

export function AdminTaxonomyClient({
  initialCollections,
  initialColors,
}: AdminTaxonomyClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"collections" | "colors">("collections");

  // Collection modal/editing state
  const [showColModal, setShowColModal] = useState(false);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colId, setColId] = useState("");
  const [colName, setColName] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [colSort, setColSort] = useState(0);

  // Color modal/editing state
  const [showColorModal, setShowColorModal] = useState(false);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [colorId, setColorId] = useState("");
  const [colorLabel, setColorLabel] = useState("");
  const [colorHex, setColorHex] = useState("#A65A38");
  const [colorSort, setColorSort] = useState(0);

  // Reassignment modal state
  const [reassignModalColor, setReassignModalColor] = useState<AdminColorItem | null>(null);
  const [replacementColorId, setReplacementColorId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Collection Handlers
  const handleOpenColModal = (col?: AdminCollectionItem) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (col) {
      setEditingColId(col.id);
      setColId(col.id);
      setColName(col.name);
      setColDesc(col.desc || "");
      setColSort(col.sort);
    } else {
      setEditingColId(null);
      setColId("");
      setColName("");
      setColDesc("");
      setColSort(initialCollections.length + 1);
    }
    setShowColModal(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim() || (!editingColId && !colId.trim())) return;

    setLoading(true);
    setErrorMsg("");
    try {
      if (editingColId) {
        const res = await updateCollectionAction(editingColId, {
          name: colName,
          desc: colDesc || null,
          sort: Number(colSort),
        });
        if (res.success) {
          setShowColModal(false);
          setSuccessMsg("دسته‌بندی با موفقیت ویرایش شد.");
          router.refresh();
        } else {
          setErrorMsg(res.error || "خطا در ویرایش دسته‌بندی.");
        }
      } else {
        const res = await createCollectionAction({
          id: colId,
          name: colName,
          desc: colDesc || null,
          sort: Number(colSort),
        });
        if (res.success) {
          setShowColModal(false);
          setSuccessMsg("دسته‌بندی جدید ایجاد شد.");
          router.refresh();
        } else {
          setErrorMsg(res.error || "خطا در ایجاد دسته‌بندی.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (c: AdminCollectionItem) => {
    if (c.productCount > 0) {
      alert(`دسته‌بندی «${c.name}» دارای ${toFa(c.productCount)} محصول است و امکان حذف آن وجود ندارد.`);
      return;
    }

    if (!confirm(`آیا از حذف دسته‌بندی «${c.name}» اطمینان دارید؟`)) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await deleteCollectionAction(c.id);
      if (res.success) {
        setSuccessMsg("دسته‌بندی حذف شد.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "خطا در حذف دسته‌بندی.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Color Handlers
  const handleOpenColorModal = (c?: AdminColorItem) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (c) {
      setEditingColorId(c.id);
      setColorId(c.id);
      setColorLabel(c.label);
      setColorHex(c.hex);
      setColorSort(c.sort);
    } else {
      setEditingColorId(null);
      setColorId("");
      setColorLabel("");
      setColorHex("#8A9A86");
      setColorSort(initialColors.length + 1);
    }
    setShowColorModal(true);
  };

  const handleSaveColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorLabel.trim() || !colorHex.trim() || (!editingColorId && !colorId.trim())) return;

    setLoading(true);
    setErrorMsg("");
    try {
      if (editingColorId) {
        const res = await updateColorAction(editingColorId, {
          label: colorLabel,
          hex: colorHex,
          sort: Number(colorSort),
        });
        if (res.success) {
          setShowColorModal(false);
          setSuccessMsg("رنگ با موفقیت ویرایش شد.");
          router.refresh();
        } else {
          setErrorMsg(res.error || "خطا در ویرایش رنگ.");
        }
      } else {
        const res = await createColorAction({
          id: colorId,
          label: colorLabel,
          hex: colorHex,
          sort: Number(colorSort),
        });
        if (res.success) {
          setShowColorModal(false);
          setSuccessMsg("رنگ جدید به پالت اضافه شد.");
          router.refresh();
        } else {
          setErrorMsg(res.error || "خطا در ایجاد رنگ.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteColorClick = (c: AdminColorItem) => {
    setErrorMsg("");
    if (c.usageCount > 0) {
      // Trigger Reassign-Before-Delete UX
      setReassignModalColor(c);
      const otherColors = initialColors.filter((col) => col.id !== c.id);
      setReplacementColorId(otherColors[0]?.id || "");
    } else {
      // Unused color, safe to delete directly
      if (!confirm(`آیا از حذف رنگ «${c.label}» اطمینان دارید؟`)) return;
      executeDeleteColor(c.id);
    }
  };

  const executeDeleteColor = async (id: string, replacementId?: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await deleteColorAction(id, replacementId);
      if (res.success) {
        setReassignModalColor(null);
        setSuccessMsg("رنگ با موفقیت حذف شد.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "خطا در حذف رنگ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-line">
        <div>
          <h1 className="font-display text-2xl text-ink">دسته‌بندی و پالت رنگ‌ها</h1>
          <p className="text-xs text-ink-3 mt-1">
            مدیریت مجموعه‌های فروشگاه و پالت رنگی مشترک با تضمین عدم حذف آبشاری.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "collections" ? (
            <button
              type="button"
              onClick={() => handleOpenColModal()}
              className="btn btn--primary text-sm cursor-pointer"
            >
              + افزودن دسته جدید
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenColorModal()}
              className="btn btn--primary text-sm cursor-pointer"
            >
              + افزودن رنگ به پالت
            </button>
          )}
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

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("collections")}
          className={`chip text-sm cursor-pointer ${
            activeTab === "collections" ? "is-selected" : ""
          }`}
        >
          دسته‌بندی‌ها ({toFa(initialCollections.length)})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("colors")}
          className={`chip text-sm cursor-pointer ${
            activeTab === "colors" ? "is-selected" : ""
          }`}
        >
          پالت رنگ‌های مشترک ({toFa(initialColors.length)})
        </button>
      </div>

      {/* TAB 1: Collections */}
      {activeTab === "collections" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialCollections.map((col) => (
            <div
              key={col.id}
              className="bg-surface rounded-xl border border-line p-5 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h2 className="font-bold text-ink text-base">{col.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-alt text-ink-3 font-mono">
                    {col.id}
                  </span>
                </div>
                <p className="text-xs text-ink-3 mt-1 min-h-[2.5rem]">
                  {col.desc || "بدون توضیح"}
                </p>
              </div>

              <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                <span className="text-ink-3">
                  محصولات:{" "}
                  <strong className="text-ink">{toFa(col.productCount)}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenColModal(col)}
                    className="btn btn--outline btn--sm text-xs cursor-pointer"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCollection(col)}
                    disabled={col.productCount > 0}
                    className="btn btn--outline btn--sm text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
                    title={
                      col.productCount > 0
                        ? "این دسته دارای محصول است و قابل حذف نیست"
                        : "حذف دسته"
                    }
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Colors */}
      {activeTab === "colors" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {initialColors.map((color) => (
            <div
              key={color.id}
              className="bg-surface rounded-xl border border-line p-4 space-y-3 flex flex-col justify-between shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl border border-black/10 shrink-0 shadow-xs"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-ink text-sm truncate">
                    {color.label}
                  </h2>
                  <p className="text-xs text-ink-3 font-mono truncate" dir="ltr">
                    {color.hex} · {color.id}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                <span className="text-ink-3">
                  استفاده در:{" "}
                  <strong
                    className={
                      color.usageCount > 0 ? "text-accent" : "text-ink"
                    }
                  >
                    {toFa(color.usageCount)} مورد
                  </strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenColorModal(color)}
                    className="btn btn--outline btn--sm text-[11px] cursor-pointer"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteColorClick(color)}
                    className="btn btn--outline btn--sm text-[11px] text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collection Modal */}
      {showColModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-line max-w-md w-full p-6 space-y-4 shadow-lg">
            <h3 className="font-bold text-ink text-lg">
              {editingColId ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}
            </h3>

            <form onSubmit={handleSaveCollection} className="space-y-3">
              {!editingColId && (
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">
                    شناسه انگلیسی (ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={colId}
                    onChange={(e) => setColId(e.target.value)}
                    placeholder="مثال: decor یا sets"
                    className="w-full h-9 px-3 rounded-lg border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-accent"
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  عنوان دسته‌بندی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="مثال: دیوارکوب، تزیینات…"
                  className="w-full h-9 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  توضیحات کوتاه
                </label>
                <textarea
                  rows={2}
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  placeholder="توضیح کوتاه دسته برای نمایش در فروشگاه…"
                  className="w-full p-2.5 rounded-lg border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  ترتیب نمایش (sort)
                </label>
                <input
                  type="number"
                  value={colSort}
                  onChange={(e) => setColSort(Number(e.target.value) || 0)}
                  className="w-full h-9 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="btn btn--outline btn--sm text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--primary text-xs cursor-pointer"
                >
                  {loading ? "در حال ذخیره…" : "ذخیره دسته‌بندی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Color Modal */}
      {showColorModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-line max-w-md w-full p-6 space-y-4 shadow-lg">
            <h3 className="font-bold text-ink text-lg">
              {editingColorId ? "ویرایش رنگ" : "افزودن رنگ به پالت مشترک"}
            </h3>

            <form onSubmit={handleSaveColor} className="space-y-3">
              {!editingColorId && (
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">
                    شناسه انگلیسی رنگ (ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={colorId}
                    onChange={(e) => setColorId(e.target.value)}
                    placeholder="مثال: sage یا clay"
                    className="w-full h-9 px-3 rounded-lg border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-accent"
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  نام فارسی رنگ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={colorLabel}
                  onChange={(e) => setColorLabel(e.target.value)}
                  placeholder="مثال: سبز مریم‌گلی، خاکی، کرم طبیعی…"
                  className="w-full h-9 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  کد هگز رنگ (Hex) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-10 h-9 p-0.5 rounded border border-line cursor-pointer bg-bg"
                  />
                  <input
                    type="text"
                    required
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    placeholder="#8A9A86"
                    className="flex-1 h-9 px-3 rounded-lg border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-accent"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  ترتیب نمایش (sort)
                </label>
                <input
                  type="number"
                  value={colorSort}
                  onChange={(e) => setColorSort(Number(e.target.value) || 0)}
                  className="w-full h-9 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowColorModal(false)}
                  className="btn btn--outline btn--sm text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--primary text-xs cursor-pointer"
                >
                  {loading ? "در حال ذخیره…" : "ذخیره رنگ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign-Before-Delete Modal (CRITICAL UX REQUIREMENT) */}
      {reassignModalColor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-line max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <span
                className="w-8 h-8 rounded-full border border-black/10 shrink-0 mt-0.5"
                style={{ backgroundColor: reassignModalColor.hex }}
              />
              <div>
                <h3 className="font-bold text-ink text-lg">
                  انتقال و حذف رنگ «{reassignModalColor.label}»
                </h3>
                <p className="text-xs text-rose-700 mt-1 font-medium">
                  این رنگ در {toFa(reassignModalColor.usageCount)} مورد (محصولات فروشگاه یا درخواست‌های بافت) استفاده شده است.
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed bg-amber-50 border border-amber-200 p-3 rounded-xl">
              طبق قوانین سیستم، حذف آبشاری (Cascade) برای حفظ تاریخچه سفارش‌ها و مشخصات محصولات ممنوع است. لطفاً پیش از حذف، رنگ جایگزین را برای انتقال تمام محصولات مشخص کنید:
            </p>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                انتخاب رنگ جایگزین:
              </label>
              <select
                value={replacementColorId}
                onChange={(e) => setReplacementColorId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
              >
                {initialColors
                  .filter((col) => col.id !== reassignModalColor.id)
                  .map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label} ({col.id} - {col.hex})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setReassignModalColor(null)}
                disabled={loading}
                className="btn btn--outline btn--sm text-xs cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() =>
                  executeDeleteColor(
                    reassignModalColor.id,
                    replacementColorId
                  )
                }
                disabled={loading || !replacementColorId}
                className="btn btn--primary text-xs bg-rose-700 hover:bg-rose-800 text-white cursor-pointer"
              >
                {loading ? "در حال انتقال و حذف…" : "انتقال ارجاعات و حذف قطعی"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
