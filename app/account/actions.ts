"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/server";
import { createCustomerAddress, deleteCustomerAddress } from "@/lib/auth/address";

export async function updateCustomerNameAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.type !== "customer") {
    return { success: false, error: "لطفاً ابتدا وارد شوید." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { success: false, error: "نام نمی‌تواند خالی باشد." };
  }

  db.update(customers)
    .set({ name })
    .where(eq(customers.id, currentUser.customer.id))
    .run();

  revalidatePath("/account");
  return { success: true };
}

export async function addAddressAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.type !== "customer") {
    return { success: false as const, error: "لطفاً ابتدا وارد شوید." };
  }

  const label = String(formData.get("label") ?? "").trim() || "خانه";
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim() || null;

  const res = await createCustomerAddress(currentUser.customer.id, {
    label,
    recipientName,
    text,
    postalCode,
  });

  if (res.success) {
    revalidatePath("/account/addresses");
  }

  return res;
}

export async function deleteAddressAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.type !== "customer") {
    return { success: false, error: "لطفاً ابتدا وارد شوید." };
  }

  const addressId = Number(formData.get("addressId"));
  if (!addressId) {
    return { success: false, error: "شناسه آدرس نامعتبر است." };
  }

  const deleted = await deleteCustomerAddress(currentUser.customer.id, addressId);
  if (deleted) {
    revalidatePath("/account/addresses");
  }

  return { success: deleted };
}
