"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/server";
import {
  adminArchiveCustomOrder,
  adminDeleteCustomOrder,
} from "@/lib/admin/custom-orders";

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || user.type !== "staff") {
    throw new Error("دسترسی غیرمجاز: نشست کارکنان یافت نشد.");
  }
  return user.staff;
}

export async function archiveCustomOrderAction(id: number, archive: boolean) {
  try {
    await requireStaff();
    adminArchiveCustomOrder(id, archive);
    revalidatePath("/admin/custom-orders");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در بایگانی درخواست.";
    return { success: false, error: message };
  }
}

export async function deleteCustomOrderAction(id: number) {
  try {
    await requireStaff();
    adminDeleteCustomOrder(id);
    revalidatePath("/admin/custom-orders");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در حذف درخواست.";
    return { success: false, error: message };
  }
}
