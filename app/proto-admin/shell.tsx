"use client";
// PROTOTYPE shells — three radically different structures for the SAME
// screens + fake data. Switch with the floating pill (or ?variant=A|B|C, ←/→).
// A "Console"  · right-side rail, dense tables, classic admin
// B "Queue"    · no sidebar; attention-queue home, drawer detail, kanban
// C "Compact"  · left rail (tests the RTL-first argument), modal order flow
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NAV, type NavKey, orders } from "./data";
import {
  OrdersList, OrderDetail, SCREENS, Toasts, useToasts, Status, Stale,
  STATUS_FA, PAY_FA, isStale,
} from "./screens";
import "./proto.css";

type Variant = "A" | "B" | "C";
const NAMES: Record<Variant, string> = { A: "Console", B: "Queue", C: "Compact" };

export function Shell({ variant }: { variant: Variant }) {
  return (
    <div dir="rtl" className="proto-scope">
      {variant === "A" && <Console />}
      {variant === "B" && <Queue />}
      {variant === "C" && <Compact />}
      <Switcher current={variant} />
    </div>
  );
}

/* ============ shared nav state hook ============ */
function useNav() {
  const [nav, setNav] = useState<NavKey>("orders");
  const [order, setOrder] = useState<string | null>(null);
  const { toasts, push } = useToasts();
  const openOrder = (c: string) => { setOrder(c); setNav("order"); };
  const go = (k: NavKey) => { setNav(k); if (k !== "order") setOrder(null); };
  return { nav, order, go, openOrder, toasts, push };
}

const ProtoNote = () => (
  <span className="pt-proto-note">پروتوتایپ — هیچ داده‌ای ذخیره نمی‌شود</span>
);

/* ============ VARIANT A — Console ============ */
function Console() {
  const n = useNav();
  const S = n.nav === "order" ? null : SCREENS[n.nav as Exclude<NavKey, "order">];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0,1fr)", minHeight: "100vh" }}>
      <aside className="pt-rail">
        <div className="od-stack" style={{ gap: 2, marginBottom: "var(--s-4)" }}>
          <b style={{ fontSize: "var(--fs-300)" }}>گِرِه</b>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>پنل مدیریت</span>
        </div>
        {NAV.map(i => (
          <a key={i.key} href="#" onClick={e => { e.preventDefault(); n.go(i.key); }} className={n.nav === i.key ? "is-active" : ""}>
            <span>{i.fa}</span><span className="n proto-num">{i.n}</span>
          </a>
        ))}
        <div style={{ marginTop: "auto" }}><ProtoNote /></div>
      </aside>
      <main>
        <div className="pt-topbar" style={{ padding: "var(--s-3) var(--s-6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ fontSize: "var(--fs-200)" }}>{n.nav === "order" ? `سفارش ${n.order}` : S?.fa}</b>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>ابolfazl · خروج</span>
        </div>
        <div style={{ padding: "var(--s-6)" }}>
          {n.nav === "order" && n.order
            ? <div className="od-stack" style={{ gap: "var(--s-4)", maxWidth: 900 }}>
                <button className="btn btn--quiet btn--sm" style={{ alignSelf: "start" }} onClick={() => n.go("orders")}>→ بازگشت</button>
                <OrderDetail code={n.order} push={n.push} />
              </div>
            : S?.el({ push: n.push, openOrder: n.openOrder })}
        </div>
      </main>
      <Toasts toasts={n.toasts} />
    </div>
  );
}

/* ============ VARIANT B — Queue ============ */
function Queue() {
  const { toasts, push } = useToasts();
  const [tab, setTab] = useState<"home" | NavKey>("home");
  const [drawer, setDrawer] = useState<string | null>(null);
  const openOrder = (c: string) => setDrawer(c);
  const flagged = orders.filter(o => o.status === "awaiting-payment" && (o.payStatus === "declared" || o.payStatus === "pending"));
  const S = tab === "home" ? null : SCREENS[tab as Exclude<NavKey, "order">];
  return (
    <div style={{ minHeight: "100vh", paddingBottom: 120 }}>
      <div className="pt-topbar" style={{ padding: "var(--s-4) var(--s-6)" }}>
        <div className="od-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--s-3)" }}>
          <b style={{ fontSize: "var(--fs-200)" }}>گِرِه · امروز</b>
          <ProtoNote />
        </div>
        <nav className="od-row" style={{ gap: "var(--s-2)", marginTop: "var(--s-4)", overflowX: "auto", paddingBottom: 2 }}>
          <button className={`chip ${tab === "home" ? "is-selected" : ""}`} style={{ height: 40 }} onClick={() => setTab("home")}>خانه {flagged.length > 0 && <span className="chip__count proto-num">{flagged.length}</span>}</button>
          {NAV.map(i => <button key={i.key} className={`chip ${tab === i.key ? "is-selected" : ""}`} style={{ height: 40 }} onClick={() => setTab(i.key)}>{i.fa}</button>)}
        </nav>
      </div>
      <div style={{ padding: "var(--s-6) var(--s-6) 0" }}>
        {tab === "home" && (
          <div className="od-stack" style={{ gap: "var(--s-6)", maxWidth: 1000, marginInline: "auto" }}>
            <h2 style={{ margin: 0 }}>محتاج توجه</h2>
            <div className="pt-queue">
              {flagged.map(o => (
                <article key={o.code} className={isStale(o) ? "is-flag" : ""} onClick={() => openOrder(o.code)} style={{ cursor: "pointer" }}>
                  <div className="od-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                    <b className="proto-num">{o.code}</b>
                    <span className="od-row" style={{ gap: 6 }}><Status s={o.payStatus} fa={PAY_FA[o.payStatus]} />{isStale(o) && <Stale />}</span>
                  </div>
                  <span>{o.customerName} — {o.path === "card" ? "اعلام کارت‌به‌کارت" : "پرداخت درگاهی در جریان"} · {o.createdAt}</span>
                </article>
              ))}
              {flagged.length === 0 && <p style={{ color: "var(--muted)" }}>خالی! امروز چیزی منتظر شما نیست.</p>}
            </div>
            <section className="od-stack" style={{ gap: "var(--s-3)" }}>
              <h2 style={{ margin: 0 }}>جریان بافت</h2>
              <div className="pt-board">
                {(["paid", "in-progress", "shipped"] as const).map(st => {
                  const xs = orders.filter(o => o.status === st);
                  return (
                    <section key={st}>
                      <h3>{STATUS_FA[st]}<span className="proto-num">{xs.length}</span></h3>
                      {xs.map(o => (
                        <button key={o.code} className="pt-tile" onClick={() => openOrder(o.code)}>
                          <b className="proto-num">{o.code}</b>
                          <span>{o.customerName}</span>
                          <span style={{ color: "var(--muted)", fontSize: 13 }}>{o.lines.map(l => l.name).join(" + ")}</span>
                        </button>
                      ))}
                      {xs.length === 0 && <span style={{ color: "var(--muted)", fontSize: 13, padding: "0 var(--s-2)" }}>—</span>}
                    </section>
                  );
                })}
              </div>
            </section>
          </div>
        )}
        {S && (tab === "orders"
          ? <OrdersList dense="cards" open={openOrder} push={push} />
          : S.el({ push, openOrder }))}
      </div>
      {drawer && (
        <>
          <div onClick={() => setDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(27,23,20,.35)", zIndex: 55 }} />
          <aside className="drawer is-open" style={{ position: "fixed", top: 0, bottom: 0, insetInlineStart: 0, width: "min(560px, 92vw)", background: "var(--surface)", borderInlineEnd: "1px solid var(--line)", zIndex: 60, boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
            <header style={{ padding: "var(--s-4) var(--s-5)" }}>
              <b>جزئیات سفارش <span className="proto-num">{drawer}</span></b>
              <button className="btn btn--quiet btn--sm" onClick={() => setDrawer(null)}>بستن ✕</button>
            </header>
            <div className="od-scroll" style={{ overflowY: "auto", padding: "var(--s-5)" }}>
              <OrderDetail code={drawer} push={push} />
            </div>
          </aside>
        </>
      )}
      <Toasts toasts={toasts} />
    </div>
  );
}

/* ============ VARIANT C — Compact ============ */
function Compact() {
  const n = useNav();
  const [modal, setModal] = useState<string | null>(null);
  const S = n.nav === "order" ? null : SCREENS[n.nav as Exclude<NavKey, "order">];
  return (
    <div dir="ltr" style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr)", minHeight: "100vh" }}>
      <aside className="pt-rail" style={{ padding: "var(--s-4) var(--s-2)", alignItems: "center", borderInlineEnd: "1px solid var(--line)", borderInlineStart: "none" }}>
        <b style={{ fontSize: 18, marginBottom: "var(--s-3)" }}>گ</b>
        {NAV.map(i => (
          <a key={i.key} href="#" title={i.fa} onClick={e => { e.preventDefault(); n.go(i.key); }}
            className={n.nav === i.key ? "is-active" : ""}
            style={{ width: 44, justifyContent: "center", position: "relative", fontSize: 18, padding: 0 }}>
            {{ orders: "☰", inquiries: "✉", products: "▦", taxonomy: "◉", customers: "☺", content: "✎", settings: "⚙" }[i.key]}
            {i.n > 0 && <span style={{ position: "absolute", top: 4, insetInlineEnd: 4, fontSize: 10, background: "var(--accent)", color: "#fff", borderRadius: 99, padding: "0 4px" }} className="proto-num">{i.n}</span>}
          </a>
        ))}
      </aside>
      <main dir="rtl" style={{ padding: "var(--s-5) var(--s-6) 120px" }}>
        <div className="od-row" style={{ justifyContent: "space-between", marginBottom: "var(--s-5)" }}>
          <b style={{ fontSize: "var(--fs-200)" }}>{n.nav === "order" ? `سفارش ${n.order}` : S?.fa}</b>
          <ProtoNote />
        </div>
        {n.nav === "order" && n.order
          ? <div className="od-stack" style={{ gap: "var(--s-4)", maxWidth: 860 }}>
              <ol className="steps">
                <li className="is-done">ثبت</li><li className="is-done">پرداخت</li><li className="is-active">بافت</li><li>ارسال</li>
              </ol>
              <OrderDetail code={n.order} push={n.push} />
            </div>
          : n.nav === "orders"
            ? <OrdersList dense="table" open={c => setModal(c)} push={n.push} />
            : S?.el({ push: n.push, openOrder: c => setModal(c) })}
      </main>
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(27,23,20,.45)", zIndex: 70, display: "grid", placeItems: "center", padding: "var(--s-5)" }}>
          <div onClick={e => e.stopPropagation()} dir="rtl" style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", maxWidth: 720, width: "100%", maxHeight: "86vh", overflowY: "auto", padding: "var(--s-6)", boxShadow: "var(--sh-3)" }}>
            <div className="od-row" style={{ justifyContent: "space-between", marginBottom: "var(--s-4)" }}>
              <b style={{ fontSize: "var(--fs-200)" }}>ویرایش سفارش</b>
              <button className="btn btn--quiet btn--sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <OrderDetail code={modal} push={n.push} />
          </div>
        </div>
      )}
      <Toasts toasts={n.toasts} />
    </div>
  );
}

/* ============ switcher ============ */
function Switcher({ current }: { current: Variant }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const set = (v: Variant) => {
    const p = new URLSearchParams(sp.toString());
    p.set("variant", v);
    router.replace(`${pathname}?${p.toString()}`);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const i = (["A", "B", "C"] as const).indexOf(current);
      if (e.key === "ArrowRight") set((["A", "B", "C"] as const)[(i + 1) % 3]);
      if (e.key === "ArrowLeft") set((["A", "B", "C"] as const)[(i + 2) % 3]);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
  return (
    <div dir="rtl" style={{ position: "fixed", bottom: "var(--s-5)", insetInlineStart: "50%", transform: "translateX(50%)", zIndex: 90, display: "flex", gap: 6, background: "var(--ink)", color: "var(--bg)", borderRadius: 99, padding: 6, boxShadow: "var(--sh-3)" }}>
      {(["A", "B", "C"] as Variant[]).map(v => (
        <button key={v} onClick={() => set(v)} style={{ font: "inherit", fontWeight: 700, fontSize: 13, borderRadius: 99, padding: "8px 14px", cursor: "pointer", border: "none", background: v === current ? "var(--accent)" : "transparent", color: v === current ? "#fff" : "var(--bg)" }}>
          {v} · {NAMES[v]}
        </button>
      ))}
      <span style={{ fontSize: 12, opacity: .6, alignSelf: "center", paddingInline: 6 }}>← →</span>
    </div>
  );
}
