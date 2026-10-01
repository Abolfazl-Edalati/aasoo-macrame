import { eq, asc, inArray } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";

type DbClient = typeof defaultDb;

export type AdminPromoConfig = {
  code: string;
  percent: number;
  enabled: boolean;
};

export type AdminContactChannelInput = {
  id?: number;
  type: "phone" | "whatsapp" | "telegram" | "instagram";
  label: string;
  value: string;
  enabled: boolean;
  sort: number;
};

export type AdminSettingsData = {
  shippingFlatToman: number;
  shippingFreeFromToman: number;
  promo: AdminPromoConfig | null;
  channels: (typeof schema.contactChannels.$inferSelect)[];
};

export type AdminSettingsWholesalePayload = {
  shippingFlatToman: number;
  shippingFreeFromToman: number;
  promo: AdminPromoConfig | null;
  channels: AdminContactChannelInput[];
};

export function getAdminSettings(options?: { db?: DbClient }): AdminSettingsData {
  const db = options?.db ?? defaultDb;

  const settingRows = db.select().from(schema.settings).all();
  const settingMap: Record<string, string> = {};
  for (const s of settingRows) {
    settingMap[s.key] = s.value;
  }

  const flat = Number(settingMap.shippingFlatToman ?? 90000);
  const freeFrom = Number(settingMap.shippingFreeFromToman ?? 300000);

  let promo: AdminPromoConfig | null = null;
  if (settingMap.promo) {
    try {
      const parsed = JSON.parse(settingMap.promo);
      if (parsed && typeof parsed.code === "string") {
        promo = {
          code: parsed.code.trim().toUpperCase(),
          percent: Number(parsed.percent ?? 0),
          enabled: Boolean(parsed.enabled),
        };
      }
    } catch {}
  }
  if (!promo && settingMap.promoCode) {
    promo = {
      code: settingMap.promoCode.trim().toUpperCase(),
      percent: Number(settingMap.promoPercent ?? 0),
      enabled: settingMap.promoEnabled === "true" || settingMap.promoEnabled === "1",
    };
  }

  const channels = db
    .select()
    .from(schema.contactChannels)
    .orderBy(asc(schema.contactChannels.sort), asc(schema.contactChannels.id))
    .all();

  return {
    shippingFlatToman: isNaN(flat) ? 90000 : flat,
    shippingFreeFromToman: isNaN(freeFrom) ? 300000 : freeFrom,
    promo,
    channels,
  };
}

export function saveAdminSettingsWholesale(
  payload: AdminSettingsWholesalePayload,
  options?: { db?: DbClient }
) {
  const db = options?.db ?? defaultDb;

  const flat = Math.max(0, Math.round(payload.shippingFlatToman));
  const freeFrom = Math.max(0, Math.round(payload.shippingFreeFromToman));

  // 1. Settings upserts
  const upsertSetting = (key: string, val: string) => {
    const existing = db
      .select({ key: schema.settings.key })
      .from(schema.settings)
      .where(eq(schema.settings.key, key))
      .get();

    if (existing) {
      db.update(schema.settings)
        .set({ value: val })
        .where(eq(schema.settings.key, key))
        .run();
    } else {
      db.insert(schema.settings).values({ key, value: val }).run();
    }
  };

  upsertSetting("shippingFlatToman", String(flat));
  upsertSetting("shippingFreeFromToman", String(freeFrom));

  if (payload.promo && payload.promo.code?.trim()) {
    const promoObj = {
      code: payload.promo.code.trim().toUpperCase(),
      percent: Math.min(100, Math.max(0, Math.round(payload.promo.percent))),
      enabled: Boolean(payload.promo.enabled),
    };
    upsertSetting("promo", JSON.stringify(promoObj));
    upsertSetting("promoCode", promoObj.code);
    upsertSetting("promoPercent", String(promoObj.percent));
    upsertSetting("promoEnabled", promoObj.enabled ? "true" : "false");
  } else {
    upsertSetting("promo", "");
    upsertSetting("promoCode", "");
    upsertSetting("promoPercent", "0");
    upsertSetting("promoEnabled", "false");
  }

  // 2. Channels sync
  const currentChannels = db.select().from(schema.contactChannels).all();
  const currentIds = currentChannels.map((c) => c.id);

  const payloadIds = payload.channels
    .map((c) => c.id)
    .filter((id): id is number => typeof id === "number");

  // Delete channels not in payload
  const toDelete = currentIds.filter((id: number) => !payloadIds.includes(id));
  if (toDelete.length > 0) {
    db.delete(schema.contactChannels)
      .where(inArray(schema.contactChannels.id, toDelete))
      .run();
  }

  // Insert or update channels
  for (let i = 0; i < payload.channels.length; i++) {
    const ch = payload.channels[i];
    const sort = ch.sort ?? i + 1;
    const label = ch.label.trim();
    const value = ch.value.trim();

    if (ch.id && currentIds.includes(ch.id)) {
      db.update(schema.contactChannels)
        .set({
          type: ch.type,
          label,
          value,
          enabled: Boolean(ch.enabled),
          sort,
        })
        .where(eq(schema.contactChannels.id, ch.id))
        .run();
    } else {
      db.insert(schema.contactChannels)
        .values({
          type: ch.type,
          label,
          value,
          enabled: Boolean(ch.enabled),
          sort,
        })
        .run();
    }
  }
}
