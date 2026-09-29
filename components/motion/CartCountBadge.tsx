"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { getCartCount, subscribeCart } from "@/lib/cart";
import { toFa } from "@/lib/format";

export function CartCountBadge() {
  const count = useSyncExternalStore(
    subscribeCart,
    () => getCartCount(),
    () => 0
  );
  const [isBumping, setIsBumping] = useState(false);

  useEffect(() => {
    const handleBump = () => {
      setIsBumping(false);
      requestAnimationFrame(() => {
        setIsBumping(true);
        setTimeout(() => setIsBumping(false), 400);
      });
    };

    window.addEventListener("gereh:cart-bump", handleBump);
    return () => {
      window.removeEventListener("gereh:cart-bump", handleBump);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span
      className={`cart-count ${isBumping ? "bump" : ""}`}
      aria-label={`تعداد اقلام سبد: ${toFa(count)}`}
    >
      {toFa(count)}
    </span>
  );
}
