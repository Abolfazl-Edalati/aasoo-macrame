import React from "react";

type MarqueeProps = {
  items?: string[];
  className?: string;
};

const DEFAULT_ITEMS = [
  "تابلو دیواری",
  "گل‌آویز",
  "گردن‌آویز",
  "منسوج دیواری",
  "کیت آموزش",
  "سفارش اختصاصی",
];

export function Marquee({ items = DEFAULT_ITEMS, className = "" }: MarqueeProps) {
  return (
    <div className={`marquee ${className}`} aria-hidden="true">
      <div className="marquee-track">
        {items.map((item, idx) => (
          <span key={`a-${idx}`}>{item}</span>
        ))}
        {items.map((item, idx) => (
          <span key={`b-${idx}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}
