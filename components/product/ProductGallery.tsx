"use client";

import { useState } from "react";

type GalleryImage = {
  id: number;
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="od-stack" style={{ "--od-gap": "16px" } as React.CSSProperties} id="gallery">
        <figure className="gallery-main" id="gwrap">
          <div className="od-media flex items-center justify-center bg-stone-100 text-stone-400">
            تصویری موجود نیست
          </div>
        </figure>
      </div>
    );
  }

  const activeImage = images[selectedIndex] || images[0];
  const ratio =
    activeImage.width && activeImage.height
      ? (activeImage.width / activeImage.height).toFixed(4)
      : "1.3333";

  const handleSelect = (index: number) => {
    if (index === selectedIndex) return;

    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReduced) {
      setSelectedIndex(index);
      return;
    }

    setIsFading(true);
    setTimeout(() => {
      setSelectedIndex(index);
      setIsFading(false);
    }, 130);
  };

  return (
    <div className="od-stack" style={{ "--od-gap": "16px" } as React.CSSProperties} id="gallery">
      <figure className="gallery-main" id="gwrap">
        <img
          id="gmain"
          className="od-media"
          src={activeImage.path}
          width={activeImage.width || 1920}
          height={activeImage.height || 1440}
          alt={activeImage.alt || productName}
          style={
            {
              "--od-ratio": ratio,
              opacity: isFading ? 0 : 1,
              transition: "opacity 130ms cubic-bezier(0,0,0.2,1)",
            } as React.CSSProperties
          }
        />
      </figure>

      {images.length > 1 ? (
        <div
          className="gallery-thumbs"
          id="gthumbs"
          role="group"
          aria-label="گزینش تصویر"
        >
          {images.map((im, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                key={im.id || i}
                type="button"
                aria-pressed={isSelected}
                aria-label={`نمایش تصویر ${i + 1}`}
                onClick={() => handleSelect(i)}
              >
                <img
                  className="od-media od-media-cover"
                  style={{ "--od-ratio": "1" } as React.CSSProperties}
                  src={im.path}
                  width={im.width || 200}
                  height={im.height || 200}
                  alt=""
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
