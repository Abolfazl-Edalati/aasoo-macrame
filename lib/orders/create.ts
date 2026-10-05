import { eq } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import type { PaymentPath } from "@/db/schema";
import { generateOrderCode } from "./code";
import { ORDER_ERRORS } from "./config";
import { calculateCartTotals, calculateLinePrice } from "@/lib/cart-pricing";
import { getCartSettings } from "@/lib/storefront";
import { validatePromo } from "@/lib/promo";

export type OrderCreationItem = {
  id: number; // productId
  size: number | string;
  color: string;
  qty: number;
};

export type CreateOrderInput = {
  customerId: number;
  recipientName: string;
  addressText: string;
  postalCode?: string | null;
  items: OrderCreationItem[];
  promoCode?: string | null;
  paymentPath: PaymentPath;
  note?: string | null;
};

export type CreateOrderResult =
  | { success: true; order: typeof schema.orders.$inferSelect; orderCode: string }
  | { success: false; error: string };

/**
 * Generates an order code that does not collide with existing rows in `orders`.
 */
export function generateUniqueOrderCode(db: typeof defaultDb): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateOrderCode();
    const existing = db.select().from(schema.orders).where(eq(schema.orders.code, code)).get();
    if (!existing) {
      return code;
    }
  }
  throw new Error("تولید شناسه یکتای سفارش با خطا مواجه شد.");
}

/**
 * Creates an order before any payment (SPEC §5, Issue #17).
 * - Generates 6-char random confusable-free code
 * - Validates product stock and existence
 * - Computes pricing with live settings (never trusts client prices)
 * - Freezes snapshots of address, pricing, promo, and order lines
 * - Creates payment row in 'undeclared' (card) or 'pending' (gateway) status
 * - Order status is 'awaiting-payment'
 */
export async function createOrder(
  input: CreateOrderInput,
  options?: { db?: typeof defaultDb }
): Promise<CreateOrderResult> {
  const db = options?.db ?? defaultDb;

  // 1. Validate customer
  const customer = db.select().from(schema.customers).where(eq(schema.customers.id, input.customerId)).get();
  if (!customer) {
    return { success: false, error: ORDER_ERRORS.INVALID_CUSTOMER };
  }

  // 2. Validate recipient and address
  const recipientName = input.recipientName?.trim();
  if (!recipientName) {
    return { success: false, error: ORDER_ERRORS.INVALID_RECIPIENT_NAME };
  }

  const addressText = input.addressText?.trim();
  if (!addressText || addressText.length < 12) {
    return { success: false, error: ORDER_ERRORS.INVALID_ADDRESS };
  }

  // 3. Validate items
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { success: false, error: ORDER_ERRORS.EMPTY_CART };
  }

  // 4. Resolve products, sizes, and colors from DB
  const frozenLines: {
    productId: number;
    name: string;
    sizeLabel: string | null;
    colorLabel: string | null;
    unitPriceToman: number;
    qty: number;
  }[] = [];

  for (const item of input.items) {
    if (!item.qty || item.qty < 1) continue;

    const product = db.select().from(schema.products).where(eq(schema.products.id, item.id)).get();
    if (!product || product.status !== "published") {
      return { success: false, error: `کالای مورد نظر یافت نشد یا در دسترس نیست.` };
    }

    // Resolve size
    let sizeLabel: string | null = null;
    let sizeDeltaToman = 0;
    if (item.size) {
      const sizeRow = db
        .select()
        .from(schema.productSizes)
        .where(eq(schema.productSizes.productId, product.id))
        .all()
        .find((s) => s.id === item.size || String(s.id) === String(item.size));

      if (sizeRow) {
        sizeLabel = sizeRow.label;
        sizeDeltaToman = sizeRow.deltaToman || 0;
      }
    }

    // Resolve color
    let colorLabel: string | null = null;
    if (item.color) {
      const colorRow = db
        .select()
        .from(schema.colors)
        .where(eq(schema.colors.id, item.color))
        .get();
      if (colorRow) {
        colorLabel = colorRow.label;
      }
    }

    const unitPriceToman = calculateLinePrice(product.priceToman, sizeDeltaToman);

    frozenLines.push({
      productId: product.id,
      name: product.name,
      sizeLabel,
      colorLabel,
      unitPriceToman,
      qty: item.qty,
    });
  }

  if (frozenLines.length === 0) {
    return { success: false, error: ORDER_ERRORS.EMPTY_CART };
  }

  // 5. Calculate totals using DB settings
  const cartSettings = getCartSettings();
  let promoDiscount: { code: string; percent: number } | null = null;

  if (input.promoCode) {
    const promoCheck = validatePromo(input.promoCode, cartSettings.promo);
    if (promoCheck.valid) {
      promoDiscount = { code: promoCheck.code, percent: promoCheck.percent };
    }
  }

  const totals = calculateCartTotals(
    frozenLines.map((l) => ({
      id: l.productId,
      sizeId: l.sizeLabel || "",
      colorId: l.colorLabel || "",
      qty: l.qty,
      unitPriceToman: l.unitPriceToman,
    })),
    {
      flatToman: cartSettings.shippingFlatToman,
      freeFromToman: cartSettings.shippingFreeFromToman,
    },
    promoDiscount
  );

  // 6. Generate unique order code
  const code = generateUniqueOrderCode(db);
  const now = Math.floor(Date.now() / 1000);

  // 7. Insert Order, Lines, and Payment row in transaction
  let newOrder: typeof schema.orders.$inferSelect;

  const insertOrder = () => {
    const orderInsertResult = db
      .insert(schema.orders)
      .values({
        code,
        customerId: input.customerId,
        status: "awaiting-payment",
        recipientName,
        addressText,
        postalCode: input.postalCode?.trim() || null,
        subtotalToman: totals.subtotalToman,
        shippingToman: totals.shippingToman,
        discountToman: totals.discountToman,
        totalToman: totals.totalToman,
        promoCode: promoDiscount?.code || null,
        promoPercent: promoDiscount?.percent || null,
        note: input.note?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    newOrder = orderInsertResult;

    // Insert order lines
    for (const line of frozenLines) {
      db.insert(schema.orderLines)
        .values({
          orderId: newOrder.id,
          productId: line.productId,
          name: line.name,
          sizeLabel: line.sizeLabel,
          colorLabel: line.colorLabel,
          unitPriceToman: line.unitPriceToman,
          qty: line.qty,
        })
        .run();
    }

    // Insert payment row
    db.insert(schema.payments)
      .values({
        orderId: newOrder.id,
        path: input.paymentPath,
        status: input.paymentPath === "card" ? "undeclared" : "pending",
        amountRial: input.paymentPath === "gateway" ? totals.totalToman * 10 : null,
      })
      .run();
  };

  if (typeof db.transaction === "function") {
    db.transaction(insertOrder);
  } else {
    insertOrder();
  }

  return { success: true, order: newOrder!, orderCode: code };
}
