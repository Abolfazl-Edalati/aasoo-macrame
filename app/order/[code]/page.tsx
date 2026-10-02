import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/server";
import { OrderDetailClient } from "@/components/order/OrderDetailClient";
import { getSiteSettings } from "@/lib/storefront";
import { ORDER_CONFIG } from "@/lib/orders/config";

type OrderPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `«سفارش ${code.toUpperCase()}»`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  // 1. Authenticate user
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?next=/order/${upperCode}`);
  }

  // 2. Fetch order from DB
  const order = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.code, upperCode))
    .get();

  if (!order) {
    notFound();
  }

  // 3. Authorization check: owner customer or staff
  if (currentUser.type === "customer" && order.customerId !== currentUser.customer.id) {
    notFound();
  }

  // 4. Fetch lines, payment, and declarations
  const lines = db
    .select()
    .from(schema.orderLines)
    .where(eq(schema.orderLines.orderId, order.id))
    .all();

  const payment = db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, order.id))
    .get();

  const declarationsHistory = db
    .select()
    .from(schema.declarations)
    .where(eq(schema.declarations.orderId, order.id))
    .orderBy(desc(schema.declarations.createdAt))
    .all();

  // 5. Get bank info from settings (or defaults)
  const siteSettings = getSiteSettings();
  const bankInfo = {
    bankName: siteSettings.bankName || ORDER_CONFIG.DEFAULT_CARD_INFO.bankName,
    cardNumber: siteSettings.cardNumber || ORDER_CONFIG.DEFAULT_CARD_INFO.cardNumber,
    cardHolder: siteSettings.cardHolder || ORDER_CONFIG.DEFAULT_CARD_INFO.cardHolder,
    shaba: siteSettings.shaba || ORDER_CONFIG.DEFAULT_CARD_INFO.shaba,
  };

  return (
    <main id="main">
      <OrderDetailClient
        order={order}
        lines={lines}
        payment={payment ?? null}
        declarationsHistory={declarationsHistory}
        bankInfo={bankInfo}
      />
    </main>
  );
}
