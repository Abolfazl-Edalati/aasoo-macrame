"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/server";
import {
  saveAdminSettingsWholesale,
  type AdminSettingsWholesalePayload,
} from "@/lib/admin/settings";

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || user.type !== "staff") {
    throw new Error("دسترسی غیرمجاز: نشست کارکنان یافت نشد.");
  }
  return user.staff;
}

export async function saveAdminSettingsAction(
  payload: AdminSettingsWholesalePayload
) {
  try {
    await requireStaff();
    saveAdminSettingsWholesale(payload);
    revalidatePath("/admin/settings");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/contact");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ذخیره تنظیمات.";
    return { success: false, error: message };
  }
}
