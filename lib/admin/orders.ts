import { eq, desc, and, or, inArray, like } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import type { OrderStatus, PaymentPath, PaymentStatus } from "@/db/schema";
import { isPaymentStale, transitionOrderStatus } from "@/lib/orders/machine";
import {
  approveCardPayment,
  rejectCardPayment,
  staffOverrideApprove,
} from "@/lib/orders/card-payment";

export type AttentionQueueItem = {
  id: number;
  code: string;
  customerId: number;
  customerName: string | null;
  customerPhone: string;
  recipientName: string;
  totalToman: number;
  createdAt: number;
  paymentPath: PaymentPath;
  paymentStatus: PaymentStatus;
  declaredAt: number | null;
  isStale: boolean;
  last4: string | null;
  traceCode: string | null;
  authority: string | null;
};

export type KanbanOrderItem = {
  id: number;
  code: string;
  recipientName: string;
  customerPhone: string;
  totalToman: number;
  status: OrderStatus;
  trackingCode: string | null;
  lines: {
    name: string;
    qty: number;
    sizeLabel: string | null;
    colorLabel: string | null;
  }[];
  createdAt: number;
  updatedAt: number;
};

export type KanbanBoardData = {
  paid: KanbanOrderItem[];
  inProgress: KanbanOrderItem[];
  shipped: KanbanOrderItem[];
};

export type AdminOrderListItem = {
  id: number;
  code: string;
  recipientName: string;
  customerPhone: string;
  status: OrderStatus;
  paymentPath: PaymentPath;
  paymentStatus: PaymentStatus;
  totalToman: number;
  linesCount: number;
  lines: {
    name: string;
    qty: number;
    sizeLabel: string | null;
    colorLabel: string | null;
  }[];
  isStale: boolean;
  createdAt: number;
};

/**
 * Retrieves the «محتاج توجه» attention queue (SPEC §7, prototype B "Queue").
 * Items:
 * - Card-to-card declared payments awaiting review (status = 'declared')
 * - 72h-stale declarations (computed from declared_at)
 * - Unpaid gateway-pending orders (path = 'gateway', status = 'pending')
 */
export function getAdminAttentionQueue(options?: { db?: any }): AttentionQueueItem[] {
  const db = options?.db ?? defaultDb;

  const rows = db
    .select({
      id: schema.orders.id,
      code: schema.orders.code,
      customerId: schema.orders.customerId,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
      recipientName: schema.orders.recipientName,
      totalToman: schema.orders.totalToman,
      createdAt: schema.orders.createdAt,
      paymentPath: schema.payments.path,
      paymentStatus: schema.payments.status,
      declaredAt: schema.payments.declaredAt,
      last4: schema.payments.last4,
      traceCode: schema.payments.traceCode,
      authority: schema.payments.authority,
    })
    .from(schema.orders)
    .innerJoin(schema.payments, eq(schema.payments.orderId, schema.orders.id))
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(
      and(
        eq(schema.orders.status, "awaiting-payment"),
        or(
          eq(schema.payments.status, "declared"),
          and(
            eq(schema.payments.path, "gateway"),
            eq(schema.payments.status, "pending")
          )
        )
      )
    )
    .orderBy(desc(schema.orders.createdAt))
    .all();

  return rows
    .map((r: any) => ({
      ...r,
      isStale: r.paymentPath === "card" && isPaymentStale(r.declaredAt),
    }))
    .sort((a: any, b: any) => {
      // Stale items float to the very top
      if (a.isStale && !b.isStale) return -1;
      if (!a.isStale && b.isStale) return 1;
      return b.createdAt - a.createdAt;
    });
}

/**
 * Retrieves orders for the «جریان بافت» fulfillment kanban board (paid → in-progress → shipped).
 */
export function getAdminKanbanOrders(options?: { db?: any }): KanbanBoardData {
  const db = options?.db ?? defaultDb;

  const orders = db
    .select({
      id: schema.orders.id,
      code: schema.orders.code,
      recipientName: schema.orders.recipientName,
      customerPhone: schema.customers.phone,
      totalToman: schema.orders.totalToman,
      status: schema.orders.status,
      trackingCode: schema.orders.trackingCode,
      createdAt: schema.orders.createdAt,
      updatedAt: schema.orders.updatedAt,
    })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(inArray(schema.orders.status, ["paid", "in-progress", "shipped"]))
    .orderBy(desc(schema.orders.updatedAt))
    .all();

  const board: KanbanBoardData = {
    paid: [],
    inProgress: [],
    shipped: [],
  };

  for (const o of orders) {
    const lines = db
      .select({
        name: schema.orderLines.name,
        qty: schema.orderLines.qty,
        sizeLabel: schema.orderLines.sizeLabel,
        colorLabel: schema.orderLines.colorLabel,
      })
      .from(schema.orderLines)
      .where(eq(schema.orderLines.orderId, o.id))
      .all();

    const item: KanbanOrderItem = {
      ...o,
      status: o.status as OrderStatus,
      lines,
    };

    if (o.status === "paid") {
      board.paid.push(item);
    } else if (o.status === "in-progress") {
      board.inProgress.push(item);
    } else if (o.status === "shipped") {
      board.shipped.push(item);
    }
  }

  return board;
}

/**
 * Dense list of all orders with optional filter and search (SPEC §7).
 */
export function getAdminOrdersList(
  filter?: { status?: string; search?: string },
  options?: { db?: any }
): AdminOrderListItem[] {
  const db = options?.db ?? defaultDb;

  const rows = db
    .select({
      id: schema.orders.id,
      code: schema.orders.code,
      recipientName: schema.orders.recipientName,
      customerPhone: schema.customers.phone,
      status: schema.orders.status,
      paymentPath: schema.payments.path,
      paymentStatus: schema.payments.status,
      declaredAt: schema.payments.declaredAt,
      totalToman: schema.orders.totalToman,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .innerJoin(schema.payments, eq(schema.payments.orderId, schema.orders.id))
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .orderBy(desc(schema.orders.createdAt))
    .all();

  let list: AdminOrderListItem[] = rows.map((r: any) => {
    const lines = db
      .select({
        name: schema.orderLines.name,
        qty: schema.orderLines.qty,
        sizeLabel: schema.orderLines.sizeLabel,
        colorLabel: schema.orderLines.colorLabel,
      })
      .from(schema.orderLines)
      .where(eq(schema.orderLines.orderId, r.id))
      .all();

    return {
      id: r.id,
      code: r.code,
      recipientName: r.recipientName,
      customerPhone: r.customerPhone,
      status: r.status as OrderStatus,
      paymentPath: r.paymentPath as PaymentPath,
      paymentStatus: r.paymentStatus as PaymentStatus,
      totalToman: r.totalToman,
      linesCount: lines.length,
      lines,
      isStale: r.paymentPath === "card" && isPaymentStale(r.declaredAt),
      createdAt: r.createdAt,
    };
  });

  if (filter?.status && filter.status !== "all") {
    if (filter.status === "attention") {
      list = list.filter(
        (o) =>
          o.status === "awaiting-payment" &&
          (o.paymentStatus === "declared" ||
            (o.paymentPath === "gateway" && o.paymentStatus === "pending"))
      );
    } else if (filter.status === "open") {
      list = list.filter(
        (o) => !["delivered", "cancelled", "cancelled-refunded"].includes(o.status)
      );
    } else {
      list = list.filter((o) => o.status === filter.status);
    }
  }

  if (filter?.search) {
    const q = filter.search.trim().toLowerCase();
    list = list.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.recipientName.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Full-page detail for /admin/orders/[id] (SPEC §7).
 */
export function getAdminOrderDetail(
  idOrCode: string | number,
  options?: { db?: any }
) {
  const db = options?.db ?? defaultDb;

  let order: any;
  if (typeof idOrCode === "number" || /^\d+$/.test(String(idOrCode))) {
    const id = typeof idOrCode === "number" ? idOrCode : parseInt(idOrCode, 10);
    order = db.select().from(schema.orders).where(eq(schema.orders.id, id)).get();
  } else {
    order = db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.code, String(idOrCode).toUpperCase()))
      .get();
  }

  if (!order) return null;

  const customer = db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, order.customerId))
    .get();

  const payment = db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, order.id))
    .get();

  const lines = db
    .select()
    .from(schema.orderLines)
    .where(eq(schema.orderLines.orderId, order.id))
    .all();

  const declarations = db
    .select()
    .from(schema.declarations)
    .where(eq(schema.declarations.orderId, order.id))
    .orderBy(desc(schema.declarations.id))
    .all();

  const isStale =
    payment?.path === "card" &&
    order.status === "awaiting-payment" &&
    payment.status === "declared" &&
    isPaymentStale(payment.declaredAt);

  return {
    order,
    customer,
    payment,
    lines,
    declarations,
    isStale,
  };
}

/**
 * Staff declaration review: Approve card-to-card payment
 */
export async function adminApproveOrder(
  orderId: number,
  context: { staffUserId: number; staffNote?: string },
  options?: { db?: any }
) {
  return approveCardPayment(orderId, context, options);
}

/**
 * Staff declaration review: Reject declaration with reason
 */
export async function adminRejectOrder(
  orderId: number,
  context: { staffUserId: number; reason: string; staffNote?: string },
  options?: { db?: any }
) {
  return rejectCardPayment(orderId, context, options);
}

/**
 * Staff override-approve any unpaid order
 */
export async function adminOverrideApproveOrder(
  orderId: number,
  context: { staffUserId: number; staffNote?: string },
  options?: { db?: any }
) {
  return staffOverrideApprove(orderId, context, options);
}

/**
 * Post-paid staff transitions: in-progress, shipped, delivered, cancelled-refunded
 */
export async function adminTransitionOrder(
  orderId: number,
  newStatus: OrderStatus,
  context: {
    staffUserId: number;
    trackingCode?: string;
    note?: string;
  },
  options?: { db?: any }
) {
  return transitionOrderStatus(
    orderId,
    newStatus,
    {
      actor: "staff",
      staffUserId: context.staffUserId,
      trackingCode: context.trackingCode,
      note: context.note,
    },
    options
  );
}
