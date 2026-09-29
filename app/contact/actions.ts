"use server";

import { headers } from "next/headers";
import { submitCustomOrder, type CustomOrderInput, type CustomOrderResult } from "@/lib/custom-order";

export async function submitCustomOrderAction(
  input: CustomOrderInput
): Promise<CustomOrderResult> {
  let ip: string | null = null;
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    ip = forwardedFor ? forwardedFor.split(",")[0].trim() : headerList.get("x-real-ip");
  } catch {
    // If running in test or static context where headers are unavailable
    ip = null;
  }

  return submitCustomOrder(input, { ip });
}
