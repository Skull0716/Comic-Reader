// components/ComicPageImage.tsx
"use client";

import React, { memo } from "react";

interface ComicPageImageProps {
  src: string;
  alt: string;
  filterStyle: string;
}

const ComicPageImage = memo(function ComicPageImage({
  src,
  alt,
  filterStyle,
}: ComicPageImageProps) {
  return (
    <div className="relative flex items-center justify-center h-full max-w-full overflow-hidden will-change-transform">
      <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="sync"
        style={{
          filter: filterStyle,
          backfaceVisibility: "hidden",
          transform: "translate3d(0,0,0)",
        }}
        className="max-h-full max-w-full object-contain shadow-2xl select-none pointer-events-none"
      />
    </div>
  );
});

export default ComicPageImage;