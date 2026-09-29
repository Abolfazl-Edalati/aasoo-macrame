import { eq, and, sql } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import { customOrderSubmissions, submissionColors } from "@/db/schema";
import { validateIranianPhone } from "@/lib/phone";

export type CustomOrderInput = {
  name: string;
  phone: string;
  collectionId?: string | null;
  isBulk?: boolean;
  deadline?: string | null;
  dimensionsText?: string | null;
  colors?: string[];
  description: string;
  wantsSample?: boolean;
  honeypot?: string | null;
};

export type CustomOrderResult =
  | { success: true; code: string; id?: number }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function checkCustomOrderRateLimit(
  phone: string,
  dbClient = defaultDb
): Promise<boolean> {
  const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
  const row = dbClient
    .select({ count: sql<number>`count(*)` })
    .from(customOrderSubmissions)
    .where(
      and(
        eq(customOrderSubmissions.phone, phone),
        sql`${customOrderSubmissions.createdAt} > ${oneHourAgo}`
      )
    )
    .get();

  const count = Number(row?.count ?? 0);
  // ~3/hour per-phone cooldown counted from recent rows (SPEC §6)
  return count < 3;
}

export async function submitCustomOrder(
  input: CustomOrderInput,
  options?: { db?: typeof defaultDb; ip?: string | null }
): Promise<CustomOrderResult> {
  const dbClient = options?.db ?? defaultDb;

  // Anti-spam 1: honeypot field is never stored; fake success returned to bot
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { success: true, code: "CO-00000" };
  }

  const name = input.name?.trim() ?? "";
  if (!name || name.length < 2) {
    return {
      success: false,
      error: "لطفاً نام و نام خانوادگی خود را وارد کنید.",
      fieldErrors: { name: "نام الزامی است (حداقل ۲ حرف)." },
    };
  }

  const phoneRes = validateIranianPhone(input.phone ?? "");
  if (!phoneRes.valid) {
    return {
      success: false,
      error: phoneRes.error,
      fieldErrors: { phone: phoneRes.error },
    };
  }
  const canonicalPhone = phoneRes.phone;

  const desc = input.description?.trim() ?? "";
  if (!desc || desc.length < 20) {
    return {
      success: false,
      error: "توضیح کار باید حداقل ۲۰ حرف باشد تا جزئیات بافت مشخص شود.",
      fieldErrors: { description: "توضیحات باید حداقل ۲۰ حرف باشد." },
    };
  }

  // Anti-spam 2: ~3/hour per-phone cooldown counted from recent rows (SPEC §6)
  const isAllowed = await checkCustomOrderRateLimit(canonicalPhone, dbClient);
  if (!isAllowed) {
    return {
      success: false,
      error:
        "تعداد درخواست‌های شما بیش از حد مجاز است (حداکثر ۳ درخواست در ساعت). لطفاً کمی بعد دوباره امتحان کنید.",
    };
  }

  // Insert submission row (email dropped per SPEC §6 / ADR-0005)
  const [submission] = dbClient
    .insert(customOrderSubmissions)
    .values({
      name,
      phone: canonicalPhone,
      email: null,
      collectionId: input.collectionId?.trim() || null,
      isBulk: Boolean(input.isBulk),
      deadline: input.deadline?.trim() || null,
      dimensionsText: input.dimensionsText?.trim() || null,
      description: desc,
      wantsSample: Boolean(input.wantsSample),
      ip: options?.ip ?? null,
    })
    .returning({ id: customOrderSubmissions.id })
    .all();

  if (input.colors && input.colors.length > 0) {
    for (const colorId of input.colors) {
      if (colorId && colorId.trim()) {
        try {
          dbClient
            .insert(submissionColors)
            .values({
              submissionId: submission.id,
              colorId: colorId.trim(),
            })
            .run();
        } catch {
          // Ignore invalid color foreign keys if any
        }
      }
    }
  }

  const code = `CO-${String(submission.id).padStart(5, "0")}`;
  return { success: true, code, id: submission.id };
}
