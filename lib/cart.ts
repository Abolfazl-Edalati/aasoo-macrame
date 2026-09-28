"use client";

export type CartLine = {
  id: number;
  size: number | string;
  color: string;
  qty: number;
};

export const CART_STORAGE_KEY = "gereh.cart.v1";

export function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartLine[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {}
  window.dispatchEvent(new CustomEvent("gereh:cart", { detail: cart }));
}

export function getCartCount(): number {
  const cart = getCart();
  return cart.reduce((total, line) => total + (line.qty || 0), 0);
}

export function addToCart(
  item: { id: number; size: number | string; color: string; stock: number; name: string },
  qty = 1
) {
  if (item.stock <= 0) return;
  const cart = getCart();
  const safeQty = Math.max(1, Math.min(qty, item.stock));
  const line = cart.find(
    (l) => l.id === item.id && String(l.size) === String(item.size) && l.color === item.color
  );

  if (line) {
    line.qty = Math.min(line.qty + safeQty, item.stock);
  } else {
    cart.push({
      id: item.id,
      size: item.size,
      color: item.color,
      qty: safeQty,
    });
  }

  saveCart(cart);
  bumpCartBadge();
  showToast(`«${item.name}» به سبد اضافه شد`, "check");
}

export function bumpCartBadge() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("gereh:cart-bump"));
}

export function showToast(message: string, icon: "check" | "info" = "check") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("gereh:toast", { detail: { message, icon } }));
}
