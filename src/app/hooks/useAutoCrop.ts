// src/app/hooks/useAutoCrop.ts
"use client";

import { useState, useEffect } from "react";
import { detectWhiteMargins, CropInsets } from "../detectBorders";

const ZERO_INSETS: CropInsets = {
  topPercent: 0,
  bottomPercent: 0,
  leftPercent: 0,
  rightPercent: 0,
};

const cropCache = new Map<string, CropInsets>();

export function useAutoCrop(imageUrl: string | undefined, enabled: boolean) {
  // Almacena la URL y el resultado que ya terminó de calcularse
  const [result, setResult] = useState<{ url: string; insets: CropInsets } | null>(null);

  useEffect(() => {
    if (!imageUrl || !enabled || cropCache.has(imageUrl)) {
      return;
    }

    let isMounted = true;

    // La llamada a setState solo ocurre dentro de los callbacks asíncronos (.then / .catch)
    detectWhiteMargins(imageUrl)
      .then((calculatedInsets) => {
        cropCache.set(imageUrl, calculatedInsets);
        if (isMounted) {
          setResult({ url: imageUrl, insets: calculatedInsets });
        }
      })
      .catch(() => {
        cropCache.set(imageUrl, ZERO_INSETS);
        if (isMounted) {
          setResult({ url: imageUrl, insets: ZERO_INSETS });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageUrl, enabled]);

  // 1. Insets derivados durante el render
  const insets: CropInsets = (() => {
    if (!imageUrl || !enabled) return ZERO_INSETS;
    if (cropCache.has(imageUrl)) return cropCache.get(imageUrl)!;
    if (result && result.url === imageUrl) return result.insets;
    return ZERO_INSETS;
  })();

  // 2. Estado calculating derivado (sin necesidad de setState síncrono)
  const calculating = Boolean(
    enabled &&
    imageUrl &&
    !cropCache.has(imageUrl) &&
    (!result || result.url !== imageUrl)
  );

  return { insets, calculating };
}