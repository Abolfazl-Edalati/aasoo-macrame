"use client";

import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/cart";
import { toFa } from "@/lib/format";

export function CartCountBadge() {
  const [count, setCount] = useState(0);
  const [isBumping, setIsBumping] = useState(false);

  useEffect(() => {
    setCount(getCartCount());

    const handleUpdate = () => {
      setCount(getCartCount());
    };

    const handleBump = () => {
      setCount(getCartCount());
      setIsBumping(false);
      // Trigger bump animation
      requestAnimationFrame(() => {
        setIsBumping(true);
        setTimeout(() => setIsBumping(false), 400);
      });
    };

    window.addEventListener("gereh:cart", handleUpdate);
    window.addEventListener("gereh:cart-bump", handleBump);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("gereh:cart", handleUpdate);
      window.removeEventListener("gereh:cart-bump", handleBump);
      window.removeEventListener("storage", handleUpdate);
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
