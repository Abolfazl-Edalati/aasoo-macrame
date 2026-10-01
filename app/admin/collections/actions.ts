"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/server";
import {
  createAdminCollection,
  updateAdminCollection,
  deleteAdminCollection,
  createAdminColor,
  updateAdminColor,
  deleteAdminColor,
} from "@/lib/admin/taxonomy";

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || user.type !== "staff") {
    throw new Error("دسترسی غیرمجاز: نشست کارکنان یافت نشد.");
  }
  return user.staff;
}

export async function createCollectionAction(data: {
  id: string;
  name: string;
  desc?: string | null;
  sort?: number;
}) {
  try {
    await requireStaff();
    createAdminCollection(data);
    revalidatePath("/admin/collections");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ایجاد دسته‌بندی.";
    return { success: false, error: message };
  }
}

export async function updateCollectionAction(
  id: string,
  data: { name?: string; desc?: string | null; sort?: number }
) {
  try {
    await requireStaff();
    updateAdminCollection(id, data);
    revalidatePath("/admin/collections");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ویرایش دسته‌بندی.";
    return { success: false, error: message };
  }
}

export async function deleteCollectionAction(id: string) {
  try {
    await requireStaff();
    deleteAdminCollection(id);
    revalidatePath("/admin/collections");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در حذف دسته‌بندی.";
    if (message.includes("COLLECTION_IN_USE")) {
      return {
        success: false,
        error: "این دسته‌بندی دارای محصولات فعال است و امکان حذف آن وجود ندارد.",
      };
    }
    return { success: false, error: message };
  }
}

export async function createColorAction(data: {
  id: string;
  label: string;
  hex: string;
  sort?: number;
}) {
  try {
    await requireStaff();
    createAdminColor(data);
    revalidatePath("/admin/collections");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ایجاد رنگ.";
    return { success: false, error: message };
  }
}

export async function updateColorAction(
  id: string,
  data: { label?: string; hex?: string; sort?: number }
) {
  try {
    await requireStaff();
    updateAdminColor(id, data);
    revalidatePath("/admin/collections");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ویرایش رنگ.";
    return { success: false, error: message };
  }
}

export async function deleteColorAction(
  id: string,
  replacementColorId?: string
) {
  try {
    await requireStaff();
    deleteAdminColor(id, { replacementColorId });
    revalidatePath("/admin/collections");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در حذف رنگ.";
    if (message.includes("COLOR_IN_USE")) {
      return {
        success: false,
        error: "این رنگ در محصولات در حال استفاده است و نیاز به تعیین رنگ جایگزین دارد.",
        requiresReassignment: true,
      };
    }
    return { success: false, error: message };
  }
}
