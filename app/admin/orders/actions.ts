"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/server";
import type { OrderStatus } from "@/db/schema";
import {
  adminApproveOrder,
  adminRejectOrder,
  adminOverrideApproveOrder,
  adminTransitionOrder,
} from "@/lib/admin/orders";

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || user.type !== "staff") {
    throw new Error("دسترسی غیرمجاز: نشست کارکنان یافت نشد.");
  }
  return user.staff;
}

/**
 * Staff approves a card-to-card declaration.
 */
export async function approveDeclarationAction(
  orderId: number,
  staffNote?: string
) {
  try {
    const staff = await requireStaff();
    const result = await adminApproveOrder(orderId, {
      staffUserId: staff.id,
      staffNote,
    });

    if (result.success) {
      revalidatePath("/admin");
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
    }
    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || "خطا در تأیید پرداخت." };
  }
}

/**
 * Staff rejects a card-to-card declaration with a mandatory reason.
 */
export async function rejectDeclarationAction(
  orderId: number,
  reason: string,
  staffNote?: string
) {
  try {
    const staff = await requireStaff();
    if (!reason || !reason.trim()) {
      return { success: false, error: "دلیل رد پرداخت الزامی است." };
    }

    const result = await adminRejectOrder(orderId, {
      staffUserId: staff.id,
      reason: reason.trim(),
      staffNote,
    });

    if (result.success) {
      revalidatePath("/admin");
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
    }
    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || "خطا در رد پرداخت." };
  }
}

/**
 * Staff override-approves any unpaid order (e.g. cash, late money).
 */
export async function overrideApproveOrderAction(
  orderId: number,
  staffNote?: string
) {
  try {
    const staff = await requireStaff();
    const result = await adminOverrideApproveOrder(orderId, {
      staffUserId: staff.id,
      staffNote,
    });

    if (result.success) {
      revalidatePath("/admin");
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
    }
    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || "خطا در تأیید دستی پرداخت." };
  }
}

/**
 * Post-paid staff status transitions (in-progress, shipped, delivered, cancelled-refunded).
 */
export async function transitionOrderStatusAction(
  orderId: number,
  newStatus: OrderStatus,
  options?: {
    trackingCode?: string;
    note?: string;
  }
) {
  try {
    const staff = await requireStaff();
    const result = await adminTransitionOrder(orderId, newStatus, {
      staffUserId: staff.id,
      trackingCode: options?.trackingCode,
      note: options?.note,
    });

    if (result.success) {
      revalidatePath("/admin");
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
    }
    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || "خطا در تغییر وضعیت سفارش." };
  }
}
