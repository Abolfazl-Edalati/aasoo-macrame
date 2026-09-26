"use client";
// PROTOTYPE screens — shared building blocks the three shells arrange
// differently. Fake data only; "actions" mutate local state so the flow is
// feelable, and every one of them fires a toast instead of persisting.
import { useState, type ReactNode } from "react";
import {
  type Order, type NavKey, fa, toman, STATUS_FA, PAY_FA, isStale,
  orders as ORDERS, products, collections, palette, customers,
  inquiries as INQUIRIES, articles, faqs, channels, settingsKv,
} from "./data";
export { STATUS_FA, PAY_FA, isStale };
import "./proto.css";

export const ST: Record<string, string> = {
  "awaiting-payment": "st--warn", paid: "st--ok", "in-progress": "",
  shipped: "", delivered: "st--ok", cancelled: "st--mute", "cancelled-refunded": "st--err",
  pending: "st--warn", verified: "st--ok", expired: "st--mute",
  undeclared: "st--mute", declared: "st--warn", approved: "st--ok", rejected: "st--err",
};
export const Status = ({ s, fa: label }: { s: string; fa: string }) => (
  <span className={`st ${ST[s] ?? ""}`}>{label}</span>
);
export const Stale = () => <span className="st st--stale" title="بیش از ۷۲ ساعت از اعلام گذشته">مانده</span>;

export type Toast = { id: number; text: string };
let tid = 0;
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (text: string) => {
    const id = ++tid;
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  };
  return { toasts, push };
}
export const Toasts = ({ toasts }: { toasts: Toast[] }) => (
  <div className="toast-region" aria-live="polite">
    {toasts.map(t => (
      <div key={t.id} className="toast"><span className="icon">✕ پروتوتایپ — ذخیره نمی‌شود</span><span>{t.text}</span></div>
    ))}
  </div>
);

/* ---------------- orders list ---------------- */
export function OrdersList({ open, push, dense }: { open: (c: string) => void; push: (s: string) => void; dense?: "cards" | "table" | "board" }) {
  const [tab, setTab] = useState("attention");
  const [q, setQ] = useState("");
  const flagged = (o: Order) =>
    o.status === "awaiting-payment" && (o.payStatus === "declared" || o.payStatus === "pending");
  const by = (pred: (o: Order) => boolean) =>
    ORDERS.filter(o => (o.code.includes(q) || o.customerName.includes(q) || o.phone.includes(q)) && pred(o));
  const groups =
    tab === "attention" ? [{ h: "محتاج توجه من", xs: by(flagged) }] :
    tab === "open" ? [{ h: "باز", xs: by(o => !["delivered", "cancelled", "cancelled-refunded"].includes(o.status)) }] :
    [{ h: "همه", xs: by(() => true) }];

  const chip = (k: string, label: string, n?: number) => (
    <button className={`chip ${tab === k ? "is-selected" : ""}`} onClick={() => setTab(k)} style={{ height: 40 }}>
      {label}{n != null && <span className="chip__count">{fa(n)}</span>}
    </button>
  );

  const row = (o: Order) => {
    if (dense === "table") return (
      <tr key={o.code} onClick={() => open(o.code)}>
        <td className="proto-num" style={{ fontWeight: 700 }}>{o.code}</td>
        <td>{o.customerName}<div style={{ color: "var(--muted)", fontSize: 13 }} className="proto-num">{o.phone}</div></td>
        <td>{o.lines.map(l => l.name).join(" + ")}</td>
        <td>{o.path === "card" ? "کارت‌به‌کارت" : "درگاه"}</td>
        <td><Status s={o.status} fa={STATUS_FA[o.status]} />{" "}<Status s={o.payStatus} fa={PAY_FA[o.payStatus]} />{isStale(o) && <Stale />}</td>
        <td style={{ fontWeight: 700 }} className="proto-num">{toman(o.total)}</td>
        <td style={{ color: "var(--muted)" }}>{o.createdAt}</td>
      </tr>
    );
    return (
      <article key={o.code} className={flagged(o) ? "is-flag" : ""} onClick={() => open(o.code)} style={{ cursor: "pointer" }}>
        <div className="od-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <b className="proto-num" style={{ fontSize: "var(--fs-200)" }}>{o.code}</b>
          <span className="od-row" style={{ gap: 6 }}>
            <Status s={o.status} fa={STATUS_FA[o.status]} />
            <Status s={o.payStatus} fa={PAY_FA[o.payStatus]} />
            {isStale(o) && <Stale />}
          </span>
        </div>
        <div>{o.customerName} · <span className="proto-num" style={{ color: "var(--muted)" }}>{o.phone}</span></div>
        <div style={{ color: "var(--ink-2)" }}>{o.lines.map(l => `${l.name} (${l.size} · ${l.color}) ×${fa(l.qty)}`).join(" — ")}</div>
        <div className="od-row" style={{ justifyContent: "space-between" }}>
          <span style={{ color: "var(--muted)" }}>{o.path === "card" ? "کارت‌به‌کارت" : "درگاه زرین‌پال"} · {o.createdAt}</span>
          <b className="proto-num">{toman(o.total)}</b>
        </div>
      </article>
    );
  };

  return (
    <section className="od-stack" style={{ gap: "var(--s-4)" }}>
      <div className="pt-filters">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="جست‌وجوی کد سفارش، نام، موبایل…"
          className="field" style={{ flex: "1 1 240px", minWidth: 0, height: 44, padding: "0 var(--s-4)", border: "1.5px solid var(--line)", borderRadius: "var(--r-sm)", background: "var(--surface)" }} />
        {chip("attention", "محتاج توجه", ORDERS.filter(flagged).length)}
        {chip("open", "باز")}
        {chip("all", "همه", ORDERS.length)}
        <button className="btn btn--quiet btn--sm" onClick={() => push("صادرات CSV در پروتوتایپ پیاده نشده")}>خروجی CSV</button>
      </div>
      {groups.map(g => (
        <div key={g.h} className="od-stack" style={{ gap: "var(--s-3)" }}>
          {dense === "board" ? (
            <div className="pt-board" style={{ gridAutoColumns: "minmax(220px,1fr)" }}>
              <h3>{g.h} ({fa(g.xs.length)})</h3>
              {g.xs.map(row)}
            </div>
          ) : (
            <>
              <h3 style={{ margin: 0 }}>{g.h} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({fa(g.xs.length)})</span></h3>
              {dense === "table" ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="pt"><thead><tr>
                    <th>کد</th><th>مشتری</th><th>اقلام</th><th>مسیر</th><th>وضعیت</th><th>مبلغ</th><th>تاریخ</th>
                  </tr></thead><tbody>{g.xs.map(row)}</tbody></table>
                </div>
              ) : <div className="pt-queue">{g.xs.map(row)}</div>}
            </>
          )}
        </div>
      ))}
    </section>
  );
}

/* ---------------- order detail ---------------- */
export function OrderDetail({ code, push }: { code: string; push: (s: string) => void }) {
  const o = ORDERS.find(x => x.code === code) ?? ORDERS[0];
  const [status, setStatus] = useState(o.status);
  const [pay, setPay] = useState(o.payStatus);
  const flow: Order["status"][] = ["paid", "in-progress", "shipped", "delivered"];
  const next = flow[flow.indexOf(status) + 1];
  const flip = (s: Order["payStatus"], verb: string) => { setPay(s); push(`وضعیت پرداخت → ${verb} (فقط پروتوتایپ)`); };
  return (
    <div className="od-stack" style={{ gap: "var(--s-5)" }}>
      <div className="od-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--s-3)" }}>
        <div className="od-stack" style={{ gap: 4 }}>
          <h2 style={{ margin: 0 }} className="proto-num">سفارش {o.code}</h2>
          <span style={{ color: "var(--muted)" }}>{o.customerName} · <span className="proto-num">{o.phone}</span> · {o.createdAt}</span>
        </div>
        <div className="od-row" style={{ gap: 6, flexWrap: "wrap" }}>
          <Status s={status} fa={STATUS_FA[status]} />
          <Status s={pay} fa={PAY_FA[pay]} />
          {isStale(o) && <Stale />}
        </div>
      </div>

      <div className="card od-stack" style={{ padding: "var(--s-5)", gap: "var(--s-3)" }}>
        <b>اقلام سفارش <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>(اسنپ‌شات — تغییر محصول تاریخچه را دست نمی‌زند)</span></b>
        <table className="pt"><thead><tr><th>محصول</th><th>سایز</th><th>رنگ</th><th>تعداد</th><th>واحّد</th></tr></thead>
          <tbody>{o.lines.map((l, i) => <tr key={i} style={{ cursor: "default" }}>
            <td>{l.name}</td><td>{l.size}</td><td>{l.color}</td><td className="proto-num">{fa(l.qty)}</td><td className="proto-num">{toman(l.unit)}</td>
          </tr>)}</tbody></table>
        <div style={{ display: "grid", gap: 2, marginInlineStart: "auto", textAlign: "start" }}>
          <span>جمع: <b className="proto-num">{toman(o.subtotal)}</b></span>
          {o.shipping > 0 && <span>ارسال: <b className="proto-num">{toman(o.shipping)}</b></span>}
          {o.discount > 0 && <span>تخفیف{o.promo && <> ({o.promo.code})</>}: <b style={{ color: "var(--success)" }} className="proto-num">−{toman(o.discount)}</b></span>}
          <span style={{ fontSize: "var(--fs-200)" }}>پرداختی: <b className="proto-num">{toman(o.total)}</b> {o.shipping === 0 && o.subtotal >= 300000 && <span className="badge badge--new" style={{ padding: "2px 10px" }}>ارسال رایگان</span>}</span>
        </div>
      </div>

      {o.path === "card" && (
        <div className="card od-stack" style={{ padding: "var(--s-5)", gap: "var(--s-3)", ...(pay === "declared" && isStale(o) ? { borderColor: "var(--error)" } : {}) }}>
          <b>پرداخت کارت‌به‌کارت</b>
          {o.declarations?.map((d, i) => (
            <div key={i} className="od-row" style={{ justifyContent: "space-between", flexWrap: "wrap", padding: "var(--s-2) 0", borderTop: i ? "1px dashed var(--line)" : "none", gap: 8 }}>
              <span>from card <b className="proto-num">•••• {d.last4}</b>{d.trace && <> · کد پیگیری <span className="proto-num">{d.trace}</span></>} · {d.at}</span>
              {d.outcome === "pending" ? <Status s="declared" fa="اعلام‌شده" /> :
                d.outcome === "approved" ? <Status s="approved" fa="تأییدشده" /> :
                  <span className="od-row" style={{ gap: 6 }}><Status s="rejected" fa="ردشده" /><i style={{ color: "var(--error)", fontSize: 13 }}>{d.reason}</i></span>}
            </div>
          ))}
          {isStale(o) && <p style={{ margin: 0, background: "#F6E8C6", borderRadius: "var(--r-sm)", padding: "var(--s-2) var(--s-3)", fontSize: 13 }}>بیش از ۷۲ ساعت از آخرین اعلام می‌گذرد — اگر واریزی نبود، رد کنید.</p>}
          <div className="od-row" style={{ flexWrap: "wrap", gap: "var(--s-2)" }}>
            <button className="btn btn--primary btn--sm" onClick={() => flip("approved", "تأیید")}>واریزی هست — تأیید پرداخت</button>
            <button className="btn btn--outline btn--sm" onClick={() => flip("rejected", "رد")}>واریزی نیست — رد اعلام</button>
            <button className="btn btn--quiet btn--sm" onClick={() => flip("approved", "تأیید دستی (override)")}>پرداخت حضوری/تلفنی — تأیید دستی با یادداشت</button>
          </div>
        </div>
      )}
      {o.path === "gateway" && (
        <div className="card od-stack" style={{ padding: "var(--s-5)", gap: "var(--s-2)" }}>
          <b>پرداخت درگاه (زرین‌پال)</b>
          {o.authority && <span>authority: <span className="proto-num">{o.authority}</span></span>}
          {o.refId && <span>کد مرجع: <b className="proto-num">{o.refId}</b></span>}
          <span>مبلغ درگاهی: <span className="proto-num">{fa(o.total * 10)} ریال</span></span>
          {pay === "pending" && <p style={{ margin: 0, color: "var(--muted)" }}>cron بازیابی هر ۱۵ دقیقه چک می‌کند؛ اینجا دکمه‌ای لازم نیست — فقط نمایش وضعیت.</p>}
          {pay === "expired" && <p style={{ margin: 0, color: "var(--muted)" }}>مهلت ۲۴ساعته تمام شد و تراکنش موفق نبود — سفارش خودکار لغو شد.</p>}
        </div>
      )}

      <div className="card" style={{ padding: "var(--s-5)" }}>
        <b>آدرس (اسنپ‌شات)</b>
        <p style={{ margin: "var(--s-2) 0 0" }}><span className="badge" style={{ padding: "2px 10px" }}>{o.address.label}</span> {o.address.recipient} — {o.address.text}{o.address.postal && <> · کدپستی <span className="proto-num">{o.address.postal}</span></>}</p>
      </div>

      {o.staffNote && <div className="card" style={{ padding: "var(--s-5)" }}><b>یادداشت پرسنل</b><p style={{ margin: "var(--s-2) 0 0", color: "var(--ink-2)" }}>{o.staffNote}</p></div>}

      <div className="od-row" style={{ flexWrap: "wrap", gap: "var(--s-2)" }}>
        {next && status !== "awaiting-payment" && (
          <button className="btn btn--dark btn--sm" onClick={() => { setStatus(next); push(`وضعیت → ${STATUS_FA[next]}`); }}>
            {next === "shipped" ? "ارسال شد + ثبت کد رهگیری" : next === "delivered" ? "تحویل شد" : "شروع بافت"}
          </button>
        )}
        {(status === "paid" || status === "in-progress") && (
          <button className="btn btn--outline btn--sm" onClick={() => { setStatus("cancelled-refunded"); push("لغو + بازپرداخت خارج از سامانه انجام می‌شود"); }}>لغو و بازپرداخت</button>
        )}
        {status === "awaiting-payment" && (
          <button className="btn btn--outline btn--sm" onClick={() => { setStatus("cancelled"); push("لغو شد"); }}>لغو</button>
        )}
        {o.tracking && <span>کد رهگیری: <b className="proto-num">{o.tracking}</b></span>}
      </div>
    </div>
  );
}

/* ---------------- products ---------------- */
export function Products({ push }: { push: (s: string) => void }) {
  const [edit, setEdit] = useState<string | null>(null);
  const p = products.find(x => x.slug === edit);
  if (p) return (
    <div className="od-stack" style={{ gap: "var(--s-4)", maxWidth: 860 }}>
      <button className="btn btn--quiet btn--sm" style={{ alignSelf: "start" }} onClick={() => { setEdit(null); }}>→ بازگشت به فهرست</button>
      <h2 style={{ margin: 0 }}>{p.name} <span className={p.status === "draft" ? "st" : "st st--ok"}>{p.status === "draft" ? "پیش‌نویس" : "منتشر"}</span></h2>
      <div className="card od-stack" style={{ padding: "var(--s-5)", gap: "var(--s-4)" }}>
        <div className="od-grid" style={{ ["--od-cols" as never]: 2 }}>
          <label className="field od-stack"><span>نام</span><input defaultValue={p.name} /></label>
          <label className="field od-stack"><span>زیرعنوان</span><input defaultValue={p.subtitle} /></label>
          <label className="field od-stack"><span>قیمت (تومان)</span><input defaultValue={fa(p.price)} /></label>
          <label className="field od-stack"><span>قیمت قبل (اختیاری)</span><input defaultValue={p.compareAt ? fa(p.compareAt) : ""} /></label>
          <label className="field od-stack"><span>موجودی</span><input defaultValue={fa(p.stock)} /></label>
          <label className="field od-stack"><span>دسته</span><select defaultValue={p.collection}>{collections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
          <label className="field od-stack"><span>وزن (کیلو)</span><input defaultValue={String(p.weightKg)} /></label>
          <label className="field od-stack"><span>ساخت تهران · دست‌بافت</span><input defaultValue={p.handmade ? "دست‌بافت" : "کیت"} readOnly style={{ opacity: .6 }} /></label>
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>رنگ‌ها <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>(از پالت مشترک)</span></span>
          <div className="od-row" style={{ flexWrap: "wrap", marginTop: 8 }}>
            {palette.map(c => <span key={c.slug} title={c.label} className={`swatch ${p.colors.includes(c.slug) ? "is-selected" : ""}`} style={{ ["--c" as never]: c.hex, opacity: p.colors.includes(c.slug) ? 1 : .35, width: 44, height: 44, borderRadius: "var(--r-full)", border: "1px solid var(--line)", background: "var(--surface)" }} />)}
          </div>
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>سایز‌ها (+اختلاف قیمت)</span>
          <div className="od-stack" style={{ gap: 8, marginTop: 8 }}>
            {p.sizes.map((s, i) => <div key={i} className="od-row" style={{ gap: "var(--s-2)" }}><input defaultValue={s.label} style={{ flex: 1, height: 40, padding: "0 var(--s-3)", border: "1.5px solid var(--line)", borderRadius: "var(--r-sm)" }} /><input defaultValue={s.delta ? fa(s.delta) : "۰"} style={{ width: 120, height: 40, padding: "0 var(--s-3)", border: "1.5px solid var(--line)", borderRadius: "var(--r-sm)" }} className="proto-num" /><button className="btn btn--quiet btn--sm" onClick={() => push("حذف سایز در پروتوتایپ")}>حذف</button></div>)}
            <button className="btn btn--quiet btn--sm" style={{ alignSelf: "start" }} onClick={() => push("سایز جدید (پروتوتایپ)")}>+ افزودن سایز</button>
          </div>
        </div>
        <div className="od-row" style={{ flexWrap: "wrap", gap: "var(--s-2)" }}>
          <button className="btn btn--primary" onClick={() => { push("ذخیره شد (پروتوتایپ)"); setEdit(null); }}>ذخیره</button>
          <button className="btn btn--outline" onClick={() => push(p.status === "draft" ? "انتشار (پروتوتایپ)" : "رفتن به پیش‌نویس (پروتوتایپ)")}>{p.status === "draft" ? "انتشار" : "پیش‌نویس"}</button>
          <button className="btn btn--quiet" onClick={() => push("تکثیر (پروتوتایپ)")}>تکثیر</button>
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="pt"><thead><tr><th>محصول</th><th>دسته</th><th>قیمت</th><th>موجودی</th><th>رنگ‌ها</th><th>وضعیت</th></tr></thead>
        <tbody>{products.map(x => (
          <tr key={x.slug} onClick={() => setEdit(x.slug)}>
            <td><div className="od-row" style={{ gap: 10 }}><img src={`/proto-admin/img/${x.image}`} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "var(--r-sm)" }} /><span><b>{x.name}</b>{x.isNew && <span className="badge badge--new" style={{ marginInlineStart: 6, padding: "1px 8px" }}>جدید</span>}<div style={{ color: "var(--muted)", fontSize: 12 }} className="proto-num">{x.slug}</div></span></div></td>
            <td>{collections.find(c => c.slug === x.collection)?.name}</td>
            <td className="proto-num">{toman(x.price)}</td>
            <td className="proto-num" style={x.stock === 0 ? { color: "var(--error)", fontWeight: 700 } : {}}>{fa(x.stock)}</td>
            <td><div className="od-row" style={{ gap: 4 }}>{x.colors.map(c => { const cc = palette.find(q => q.slug === c); return <span key={c} title={cc?.label} style={{ width: 16, height: 16, borderRadius: "var(--r-full)", background: cc?.hex, display: "inline-block", border: "1px solid var(--line)" }} />; })}</div></td>
            <td><span className={x.status === "draft" ? "st" : "st st--ok"}>{x.status === "draft" ? "پیش‌نویس" : "منتشر"}</span></td>
          </tr>
        ))}</tbody></table>
      <button className="btn btn--primary btn--sm" style={{ marginTop: "var(--s-4)" }} onClick={() => push("فرم محصول نو (پروتوتایپ)")}>+ محصول تازه</button>
    </div>
  );
}

/* ---------------- taxonomy + palette ---------------- */
export function Taxonomy({ push }: { push: (s: string) => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="od-stack" style={{ gap: "var(--s-6)", maxWidth: 860 }}>
      <section className="card od-stack" style={{ padding: "var(--s-5)", gap: "var(--s-3)" }}>
        <b>دسته‌ها</b>
        {collections.map(c => <div key={c.slug} className="od-row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "var(--s-2)" }}><span>{c.name} <span className="proto-num" style={{ color: "var(--muted)", fontSize: 13 }}>{fa(c.count)} محصول</span></span><span className="od-row" style={{ gap: 6 }}><button className="btn btn--quiet btn--sm" onClick={() => push("ویرایش (پروتوتایپ)")}>ویرایش</button></span></div>)}
        <button className="btn btn--quiet btn--sm" style={{ alignSelf: "start" }} onClick={() => setAdding(a => !a)}>+ دسته تازه</button>
      </section>
      <section className="card od-stack" style={{ padding: "var(--s-5)", gap: "var(--s-3)" }}>
        <b>پالت رنگ نخ <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>— مشترک بین فروشگاه، فرم سفارش اختصاصی و فیلترها</span></b>
        {palette.map(c => (
          <div key={c.slug} className="od-row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "var(--s-2)", gap: "var(--s-2)" }}>
            <span className="od-row" style={{ gap: 10 }}><span style={{ width: 22, height: 22, borderRadius: "var(--r-full)", background: c.hex, border: "1px solid var(--line)", display: "inline-block" }} /><b>{c.label}</b><span className="proto-num" style={{ color: "var(--muted)", fontSize: 13 }}>{fa(c.count)} محصول · {c.slug}</span></span>
            <span className="od-row" style={{ gap: 6 }}>
              <button className="btn btn--quiet btn--sm" onClick={() => push("ویرایش رنگ (پروتوتایپ)")}>ویرایش</button>
              <button className="btn btn--outline btn--sm" disabled style={{ opacity: .5, cursor: "not-allowed" }} title="تا محصولی به این رنگ هست، حذف نمی‌شود">حذف</button>
            </span>
          </div>
        ))}
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>حذف رنگِ پرکاربرد بسته است — اول باید رنگ محصولات را عوض کنید.</p>
      </section>
    </div>
  );
}

/* ---------------- customers ---------------- */
export function Customers() {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="pt"><thead><tr><th>مشتری</th><th>موبایل</th><th>سفارش‌ها</th><th>جمع خرید</th><th>آخرین فعالیت</th></tr></thead>
        <tbody>{customers.map(c => (
          <tr key={c.phone}>
            <td>{c.name}</td><td className="proto-num">{c.phone}</td>
            <td className="proto-num">{fa(c.orders)}</td><td className="proto-num">{toman(c.spend)}</td><td style={{ color: "var(--muted)" }}>{c.last}</td>
          </tr>
        ))}</tbody></table>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>حذف حساب در v1 نیست؛ آدرس‌ها داخل صفحه مشتری.</p>
    </div>
  );
}

/* ---------------- inquiries ---------------- */
export function Inquiries({ push }: { push: (s: string) => void }) {
  const [items, setItems] = useState(INQUIRIES);
  const [arch, setArch] = useState(false);
  const shown = items.filter(i => !!i.archivedAt === arch);
  return (
    <div className="od-stack" style={{ gap: "var(--s-4)", maxWidth: 900 }}>
      <div className="pt-filters">
        <button className={`chip ${!arch ? "is-selected" : ""}`} onClick={() => setArch(false)} style={{ height: 40 }}>فعال <span className="chip__count">{fa(items.filter(i => !i.archivedAt).length)}</span></button>
        <button className={`chip ${arch ? "is-selected" : ""}`} onClick={() => setArch(true)} style={{ height: 40 }}>بایگانی <span className="chip__count">{fa(items.filter(i => !!i.archivedAt).length)}</span></button>
      </div>
      <div className="pt-queue">
        {shown.map(i => (
          <article key={i.id} className="od-stack" style={{ gap: "var(--s-2)" }}>
            <div className="od-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <b>{i.name}</b>
              <span className="od-row" style={{ gap: 8 }}>
                {i.isBulk && <span className="badge badge--new" style={{ padding: "1px 8px" }}>عمده</span>}
                {i.collection && <span className="badge" style={{ padding: "1px 8px" }}>{collections.find(c => c.slug === i.collection)?.name ?? i.collection}</span>}
                {!i.collection && !i.isBulk && <span className="badge" style={{ padding: "1px 8px", opacity: .7 }}>«دیگر»</span>}
                {i.archivedAt ? <span className="st st--mute">بایگانی {i.archivedAt}</span> : <span style={{ color: "var(--muted)" }}>{i.at}</span>}
              </span>
            </div>
            <div><a href={`tel:${i.phone}`} className="proto-num" style={{ color: "var(--accent)", fontWeight: 700, direction: "ltr" }}>{i.phone}</a> {i.email && <>· <span dir="ltr" style={{ color: "var(--muted)" }}>{i.email}</span></>}</div>
            <p style={{ margin: 0, color: "var(--ink-2)" }}>{i.desc}</p>
            <div className="od-row" style={{ flexWrap: "wrap", gap: "var(--s-2)", color: "var(--muted)", fontSize: 13 }}>
              {i.dims && <span>ابعاد: {i.dims}</span>}<span>مهلت: {i.deadline}</span>
              <span>رنگ‌ها: {i.colors.map(c => palette.find(p => p.slug === c)?.label).join("، ")}</span>
              {i.sample && <span>نمونه نخ می‌خواهد</span>}
            </div>
            {!i.archivedAt && (
              <div className="od-row" style={{ gap: "var(--s-2)", marginTop: "var(--s-1)" }}>
                <button className="btn btn--quiet btn--sm" onClick={() => { setItems(xs => xs.map(x => x.id === i.id ? { ...x, archivedAt: "امروز" } : x)); push("بایگانی شد (پروتوتایپ)"); }}>بایگانی</button>
                <button className="btn btn--outline btn--sm" onClick={() => { setItems(xs => xs.filter(x => x.id !== i.id)); push("حذف شد (پروتوتایپ)"); }}>حذف</button>
              </div>
            )}
          </article>
        ))}
        {shown.length === 0 && <p style={{ color: "var(--muted)" }}>موردی نیست.</p>}
      </div>
    </div>
  );
}

/* ---------------- content (articles + faq) ---------------- */
export function Content({ push }: { push: (s: string) => void }) {
  return (
    <div className="od-stack" style={{ gap: "var(--s-6)", maxWidth: 860 }}>
      <section className="od-stack" style={{ gap: "var(--s-3)" }}>
        <b>مجله</b>
        {articles.map(a => <div key={a.id} className="card od-row" style={{ padding: "var(--s-4)", justifyContent: "space-between" }}><span>{a.title} <span className="badge" style={{ padding: "1px 8px" }}>{a.tag}</span></span><button className="btn btn--quiet btn--sm" onClick={() => push("ویرایشگر مقاله (پروتوتایپ)")}>ویرایش بدنه</button></div>)}
      </section>
      <section className="od-stack" style={{ gap: "var(--s-3)" }}>
        <b>پرسش‌های متداول</b>
        {faqs.map((f, i) => <div key={i} className="card od-row" style={{ padding: "var(--s-4)", justifyContent: "space-between", gap: "var(--s-3)" }}><span style={{ color: "var(--ink-2)" }}>{f}</span><span className="od-row" style={{ gap: 6 }}><button className="btn btn--quiet btn--sm" onClick={() => push("جابه‌جایی ترتیب (پروتوتایپ)")}>↑↓</button><button className="btn btn--quiet btn--sm" onClick={() => push("ویرایش (پروتوتایپ)")}>ویرایش</button></span></div>)}
        <button className="btn btn--quiet btn--sm" style={{ alignSelf: "start" }} onClick={() => push("پرسش نو (پروتوتایپ)")}>+ پرسش تازه</button>
      </section>
    </div>
  );
}

/* ---------------- settings ---------------- */
export function Settings({ push }: { push: (s: string) => void }) {
  const [chans, setChans] = useState(channels);
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= chans.length) return;
    setChans(xs => { const c = [...xs]; const [x] = c.splice(i, 1); c.splice(j, 0, x); return c; });
  };
  return (
    <div className="od-stack" style={{ gap: "var(--s-6)", maxWidth: 860 }}>
      <section className="card od-stack" style={{ padding: "var(--s-5)", gap: "var(--s-3)" }}>
        <b>راه‌های تماس <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>— همان‌ها که کنار فرم سفارش اختصاصی نمایش داده می‌شوند</span></b>
        {chans.map((c, i) => (
          <div key={c.type + i} className="od-row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "var(--s-2)", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <span className="od-row" style={{ gap: 10 }}>
              <button className="btn btn--quiet btn--sm" onClick={() => move(i, -1)}>↑</button>
              <button className="btn btn--quiet btn--sm" onClick={() => move(i, 1)}>↓</button>
              <b>{c.label}</b><span className="proto-num" style={{ color: "var(--muted)" }}>{c.value}</span>
            </span>
            <label className="switch"><input type="checkbox" defaultChecked={c.enabled} onChange={() => push("فعال/غیرفعال (پروتوتایپ)")} /><span className="od-stack"><b style={{ fontWeight: 500 }}>{c.enabled ? "نمایش در سایت" : "پنهان"}</b></span></label>
          </div>
        ))}
        <button className="btn btn--quiet btn--sm" style={{ alignSelf: "start" }} onClick={() => push("کانال نو (پروتوتایپ)")}>+ راه تماس تازه</button>
      </section>
      <section className="card od-stack" style={{ padding: "var(--s-5)", gap: "var(--s-3)" }}>
        <b>تنظیمات سایت <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>— (settings کلید/مقدار)</span></b>
        {settingsKv.map(s => (
          <label key={s.key} className="field od-row" style={{ justifyContent: "space-between", gap: "var(--s-4)", flexWrap: "wrap" }}>
            <code dir="ltr" style={{ color: "var(--muted)", fontSize: 13 }}>{s.key}</code>
            <input defaultValue={s.val} style={{ flex: "1 1 260px", height: 44, padding: "0 var(--s-3)", border: "1.5px solid var(--line)", borderRadius: "var(--r-sm)", background: "var(--surface)" }} className="proto-num" />
          </label>
        ))}
        <button className="btn btn--primary btn--sm" style={{ alignSelf: "start" }} onClick={() => push("ذخیره تنظیمات (پروتوتایپ)")}>ذخیره</button>
      </section>
    </div>
  );
}

/* ---------------- screens registry ---------------- */
export const SCREENS: Record<Exclude<NavKey, "order">, { fa: string; el: (a: { push: (s: string) => void; openOrder: (c: string) => void }) => ReactNode }> = {
  orders: { fa: "سفارش‌ها", el: ({ push, openOrder }) => <OrdersList dense="cards" open={openOrder} push={push} /> },
  inquiries: { fa: "درخواست‌های بافت", el: ({ push }) => <Inquiries push={push} /> },
  products: { fa: "محصولات", el: ({ push }) => <Products push={push} /> },
  taxonomy: { fa: "دسته و رنگ", el: ({ push }) => <Taxonomy push={push} /> },
  customers: { fa: "مشتری‌ها", el: () => <Customers /> },
  content: { fa: "مجله و پرسش‌ها", el: ({ push }) => <Content push={push} /> },
  settings: { fa: "تنظیمات", el: ({ push }) => <Settings push={push} /> },
};
