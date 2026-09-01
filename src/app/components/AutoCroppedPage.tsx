// components/AutoCroppedPage.tsx
"use client";

import React from "react";
import { useAutoCrop } from "../hooks/useAutoCrop";

interface Props {
  src: string;
  alt?: string;
  autoCropEnabled: boolean;
  filterStyle?: string;
}

export default function AutoCroppedPage({
  src,
  alt = "Comic Page",
  autoCropEnabled,
  filterStyle = "none",
}: Props) {
  const { insets } = useAutoCrop(src, autoCropEnabled);

  // Calcular el factor de escala necesario para llenar el espacio tras recortar los márgenes
  const visibleWidthRatio = (100 - insets.leftPercent - insets.rightPercent) / 100;
  const visibleHeightRatio = (100 - insets.topPercent - insets.bottomPercent) / 100;
  const scale = autoCropEnabled
    ? 1 / Math.max(visibleWidthRatio, visibleHeightRatio, 0.5)
    : 1;

  // Centroide del recorte para centrar la transformación
  const originX = 50 + (insets.leftPercent - insets.rightPercent) / 2;
  const originY = 50 + (insets.topPercent - insets.bottomPercent) / 2;

  const clipPathStyle = autoCropEnabled
    ? `inset(${insets.topPercent}% ${insets.rightPercent}% ${insets.bottomPercent}% ${insets.leftPercent}%)`
    : "none";

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <img
        src={src}
        alt={alt}
        style={{
          clipPath: clipPathStyle,
          transform: `scale(${scale})`,
          transformOrigin: `${originX}% ${originY}%`,
          filter: filterStyle,
          transition: "clip-path 200ms ease, transform 200ms ease, filter 150ms ease",
        }}
        className="max-h-full max-w-full object-contain will-change-transform shadow-2xl select-none"
      />
    </div>
  );
}