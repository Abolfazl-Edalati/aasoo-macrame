"use client";

import { useState, useId } from "react";
import Image from "next/image";
import type { FullArticle } from "@/lib/storefront";

export function ArticleCard({
  article,
  index = 0,
}: {
  article: FullArticle;
  index?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <article
      className="card reveal overflow-hidden flex flex-col"
      style={{ "--i": index } as React.CSSProperties}
    >
      {article.image && (
        <div className="relative w-full aspect-[4/3] bg-surface-alt overflow-hidden">
          <Image
            src={article.image.path.startsWith("/") ? article.image.path : `/${article.image.path}`}
            alt={article.image.alt || article.title}
            width={article.image.width || 800}
            height={article.image.height || 600}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div
        className="od-stack flex-1 flex flex-col"
        style={
          {
            "--od-gap": "12px",
            padding: "var(--spacing-5) var(--spacing-6) var(--spacing-6)",
          } as React.CSSProperties
        }
      >
        <div className="post-meta flex items-center justify-between text-xs text-muted mb-1">
          <span className="chip" style={{ minHeight: "32px", pointerEvents: "none" }}>
            {article.tag}
          </span>
          <span>
            {article.date} · {article.readMin} دقیقه
          </span>
        </div>

        <h3
          style={{ margin: 0, fontSize: "var(--text-300)" }}
          className="font-display leading-snug"
        >
          {article.title}
        </h3>

        <p className="od-clamp-3 ink2 leading-relaxed" style={{ margin: 0 }}>
          {article.excerpt}
        </p>

        <div className="mt-auto pt-4 border-t border-line/50">
          <button
            className="btn btn--quiet btn--sm"
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? "بستن متن" : "متن کامل"}
          </button>

          {isOpen && (
            <div
              id={contentId}
              className="acc-body mt-3 pt-3 border-t border-line text-ink-2 text-sm leading-relaxed whitespace-pre-line bg-surface-alt/40 p-4 rounded-lg"
            >
              <p style={{ margin: 0 }}>{article.body}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
