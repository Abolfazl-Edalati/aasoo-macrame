import { eq, and, sql, desc } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import { customerAddresses } from "@/db/schema";
import { AUTH_CONFIG, AUTH_ERRORS } from "./config";

export interface AddressInput {
  label: string;
  recipientName: string;
  text: string;
  postalCode?: string | null;
}

export type AddressResult =
  | {
      success: true;
      address: {
        id: number;
        customerId: number;
        label: string;
        recipientName: string;
        text: string;
        postalCode: string | null;
        createdAt: number;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Returns all saved addresses for a customer, capped at 5 in app code.
 * No default address concept — always an explicit pick (SPEC §4).
 */
export async function getCustomerAddresses(
  customerId: number,
  options?: { db?: typeof defaultDb }
) {
  const dbClient = options?.db ?? defaultDb;
  return dbClient
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, customerId))
    .orderBy(desc(customerAddresses.createdAt))
    .all();
}

/**
 * Creates a customer address.
 * Enforces:
 * - Maximum 5 addresses per customer
 * - Address text minlength 12 characters (SPEC §4, cart.html)
 */
export async function createCustomerAddress(
  customerId: number,
  input: AddressInput,
  options?: { db?: typeof defaultDb }
): Promise<AddressResult> {
  const dbClient = options?.db ?? defaultDb;

  // Validate text minlength 12
  const text = input.text.trim();
  if (text.length < AUTH_CONFIG.ADDRESS_MIN_LENGTH) {
    return {
      success: false,
      error: AUTH_ERRORS.ADDRESS_TOO_SHORT,
    };
  }

  const recipientName = input.recipientName.trim();
  if (!recipientName) {
    return {
      success: false,
      error: "نام گیرنده الزامی است.",
    };
  }

  const label = input.label.trim() || "خانه";

  // Check 5 address cap
  const countRow = dbClient
    .select({ count: sql<number>`count(*)` })
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, customerId))
    .get();

  const currentCount = Number(countRow?.count ?? 0);
  if (currentCount >= AUTH_CONFIG.MAX_ADDRESSES_PER_CUSTOMER) {
    return {
      success: false,
      error: AUTH_ERRORS.MAX_ADDRESSES_REACHED,
    };
  }

  const [address] = dbClient
    .insert(customerAddresses)
    .values({
      customerId,
      label,
      recipientName,
      text,
      postalCode: input.postalCode?.trim() || null,
    })
    .returning()
    .all();

  return {
    success: true,
    address,
  };
}

/**
 * Deletes a customer address by id, scoped to the customer.
 */
export async function deleteCustomerAddress(
  customerId: number,
  addressId: number,
  options?: { db?: typeof defaultDb }
): Promise<boolean> {
  const dbClient = options?.db ?? defaultDb;

  const res = dbClient
    .delete(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, customerId)
      )
    )
    .run();

  return res.changes > 0;
}
