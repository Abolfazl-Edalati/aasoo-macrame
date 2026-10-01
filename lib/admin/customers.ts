import { eq, desc, sql } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import type { OrderStatus } from "@/db/schema";

type DbClient = typeof defaultDb;

export type AdminCustomerListItem = {
  id: number;
  phone: string;
  name: string | null;
  createdAt: number;
  ordersCount: number;
  totalSpentToman: number;
  lastOrderAt: number | null;
};

export type AdminCustomerDetail = {
  id: number;
  phone: string;
  name: string | null;
  createdAt: number;
  ordersCount: number;
  totalSpentToman: number;
  addresses: (typeof schema.customerAddresses.$inferSelect)[];
  orders: {
    id: number;
    code: string;
    status: OrderStatus;
    totalToman: number;
    recipientName: string;
    linesCount: number;
    createdAt: number;
  }[];
};

export function getAdminCustomersList(
  filters?: { search?: string },
  options?: { db?: DbClient }
): AdminCustomerListItem[] {
  const db = options?.db ?? defaultDb;

  const customers = db
    .select()
    .from(schema.customers)
    .orderBy(desc(schema.customers.createdAt))
    .all();

  // Aggregate orders for each customer
  const allOrders = db
    .select({
      id: schema.orders.id,
      customerId: schema.orders.customerId,
      totalToman: schema.orders.totalToman,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .all();

  const customerOrdersMap = new Map<
    number,
    { count: number; spent: number; lastAt: number | null }
  >();

  const paidStatuses: OrderStatus[] = [
    "paid",
    "in-progress",
    "shipped",
    "delivered",
  ];

  for (const o of allOrders) {
    const existing = customerOrdersMap.get(o.customerId) ?? {
      count: 0,
      spent: 0,
      lastAt: null,
    };
    existing.count += 1;
    if (paidStatuses.includes(o.status as OrderStatus)) {
      existing.spent += o.totalToman;
    }
    if (!existing.lastAt || o.createdAt > existing.lastAt) {
      existing.lastAt = o.createdAt;
    }
    customerOrdersMap.set(o.customerId, existing);
  }

  let list: AdminCustomerListItem[] = customers.map((c: typeof schema.customers.$inferSelect) => {
    const stats = customerOrdersMap.get(c.id) ?? {
      count: 0,
      spent: 0,
      lastAt: null,
    };
    return {
      id: c.id,
      phone: c.phone,
      name: c.name,
      createdAt: c.createdAt,
      ordersCount: stats.count,
      totalSpentToman: stats.spent,
      lastOrderAt: stats.lastAt,
    };
  });

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.phone.includes(q) ||
        (c.name && c.name.toLowerCase().includes(q))
    );
  }

  return list;
}

export function getAdminCustomerDetail(
  id: number,
  options?: { db?: DbClient }
): AdminCustomerDetail | null {
  const db = options?.db ?? defaultDb;

  const customer = db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id))
    .get();

  if (!customer) return null;

  const addresses = db
    .select()
    .from(schema.customerAddresses)
    .where(eq(schema.customerAddresses.customerId, id))
    .orderBy(desc(schema.customerAddresses.createdAt))
    .all();

  const customerOrders = db
    .select({
      id: schema.orders.id,
      code: schema.orders.code,
      status: schema.orders.status,
      totalToman: schema.orders.totalToman,
      recipientName: schema.orders.recipientName,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .where(eq(schema.orders.customerId, id))
    .orderBy(desc(schema.orders.createdAt))
    .all();

  const orderIds = customerOrders.map((o) => o.id);

  const lineCountMap = new Map<number, number>();
  if (orderIds.length > 0) {
    const lineCounts = db
      .select({
        orderId: schema.orderLines.orderId,
        count: sql<number>`count(*)`,
      })
      .from(schema.orderLines)
      .groupBy(schema.orderLines.orderId)
      .all();

    for (const lc of lineCounts) {
      lineCountMap.set(lc.orderId, Number(lc.count));
    }
  }

  const paidStatuses: OrderStatus[] = [
    "paid",
    "in-progress",
    "shipped",
    "delivered",
  ];

  let totalSpentToman = 0;
  for (const o of customerOrders) {
    if (paidStatuses.includes(o.status as OrderStatus)) {
      totalSpentToman += o.totalToman;
    }
  }

  return {
    id: customer.id,
    phone: customer.phone,
    name: customer.name,
    createdAt: customer.createdAt,
    ordersCount: customerOrders.length,
    totalSpentToman,
    addresses,
    orders: customerOrders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status as OrderStatus,
      totalToman: o.totalToman,
      recipientName: o.recipientName,
      linesCount: lineCountMap.get(o.id) ?? 0,
      createdAt: o.createdAt,
    })),
  };
}
