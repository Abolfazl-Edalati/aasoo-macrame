"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/server";
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  type AdminProductInput,
} from "@/lib/admin/products";
import { saveUploadedImage } from "@/lib/admin/uploads";

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || user.type !== "staff") {
    throw new Error("دسترسی غیرمجاز: نشست کارکنان یافت نشد.");
  }
  return user.staff;
}

export async function createProductAction(input: AdminProductInput) {
  try {
    await requireStaff();
    const product = createAdminProduct(input);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath(`/product/${product.slug}`);
    return { success: true, product };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ایجاد محصول.";
    if (message.includes("SLUG_ALREADY_EXISTS")) {
      return { success: false, error: "این نامک (اسلاگ) قبلاً برای محصول دیگری ثبت شده است." };
    }
    return { success: false, error: message };
  }
}

export async function updateProductAction(
  id: number,
  input: Partial<AdminProductInput>
) {
  try {
    await requireStaff();
    const product = updateAdminProduct(id, input);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/shop");
    revalidatePath(`/product/${product.slug}`);
    return { success: true, product };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در به‌روزرسانی محصول.";
    if (message.includes("SLUG_ALREADY_EXISTS")) {
      return { success: false, error: "این نامک (اسلاگ) قبلاً برای محصول دیگری ثبت شده است." };
    }
    return { success: false, error: message };
  }
}

export async function deleteProductAction(id: number) {
  try {
    await requireStaff();
    deleteAdminProduct(id);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در حذف محصول.";
    return { success: false, error: message };
  }
}

export async function uploadImageAction(formData: FormData) {
  try {
    await requireStaff();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "لطفاً یک فایل تصویر معتبر انتخاب کنید." };
    }

    const alt = (formData.get("alt") as string) || file.name || "تصویر محصول";
    const artist = (formData.get("artist") as string) || null;
    const license = (formData.get("license") as string) || null;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = await saveUploadedImage({
      buffer,
      filename: file.name,
      alt,
      artist,
      license,
    });

    return { success: true, image };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در بارگذاری تصویر.";
    return { success: false, error: message };
  }
}
