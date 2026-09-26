// PROTOTYPE — throwaway. Answers wayfinder ticket #6: what shape does the
// admin panel take? Three structurally different shells for the SAME fake
// data (orders, order detail w/ payment flip, product edit, collections,
// colors, customers, custom-order inquiries, content, settings).
// Switchable via ?variant=. No persistence, no real actions.
import "./design.css";
import { Shell } from "./shell";

export const dynamic = "force-dynamic";

export default async function ProtoAdmin(
  props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }
) {
  const sp = (await props.searchParams) ?? {};
  const raw = sp.variant;
  const variant =
    raw === "B" || raw === "C" ? (raw as "A" | "B" | "C") : "A";
  return <Shell variant={variant} />;
}
