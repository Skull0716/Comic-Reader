// hooks/usePageSpreads.ts
"use client";

import { useMemo, useState, useCallback } from "react";
import { ReadingMode, ReadingDirection, PageSpread } from "../types/viewer";

function calculateSpreadIndex(page: number, mode: ReadingMode): number {
  if (mode === "single" || mode === "webtoon") return Math.max(0, page);
  if (page <= 0) return 0;
  return Math.floor((page - 1) / 2) + 1;
}

export function usePageSpreads(
  totalPages: number,
  mode: ReadingMode,
  direction: ReadingDirection,
  initialPage: number = 0
) {
  // Generar pliegos respetando la portada como página individual
  const spreads = useMemo<PageSpread[]>(() => {
    if (totalPages <= 0) return [];
    if (mode === "single" || mode === "webtoon") {
      return Array.from({ length: totalPages }, (_, i) => ({ indices: [i] }));
    }

    const result: PageSpread[] = [{ indices: [0] }]; // Portada individual

    for (let i = 1; i < totalPages; i += 2) {
      if (i + 1 < totalPages) {
        result.push({ indices: [i, i + 1] });
      } else {
        result.push({ indices: [i] });
      }
    }
    return result;
  }, [totalPages, mode]);

  const [spreadIndex, setSpreadIndex] = useState(() =>
    calculateSpreadIndex(initialPage, mode)
  );

  // Sincronización oficial de cambio de modo sin useRef
  const [prevMode, setPrevMode] = useState(mode);

  if (prevMode !== mode) {
    setPrevMode(mode);
    const currentFirstPage = spreads[spreadIndex]?.indices?.[0] ?? 0;
    setSpreadIndex(calculateSpreadIndex(currentFirstPage, mode));
  }

  // Índice seguro garantizado dentro del rango disponible
  const safeSpreadIndex =
    spreads.length > 0
      ? Math.min(Math.max(0, spreadIndex), spreads.length - 1)
      : 0;

  const canGoForward = safeSpreadIndex < spreads.length - 1;
  const canGoBackward = safeSpreadIndex > 0;

  const advance = useCallback(() => {
    setSpreadIndex((curr) => (curr < spreads.length - 1 ? curr + 1 : curr));
  }, [spreads.length]);

  const retreat = useCallback(() => {
    setSpreadIndex((curr) => (curr > 0 ? curr - 1 : curr));
  }, []);

  const handleNextAction = direction === "ltr" ? advance : retreat;
  const handlePrevAction = direction === "ltr" ? retreat : advance;

  return {
    currentSpread: spreads[safeSpreadIndex] || { indices: [0] },
    spreadIndex: safeSpreadIndex,
    totalSpreads: spreads.length,
    advance,
    retreat,
    handleNextAction,
    handlePrevAction,
    canGoForward,
    canGoBackward,
  };
}