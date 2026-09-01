// hooks/useComicFilters.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ImageFilterSettings, DEFAULT_FILTERS } from "../types/filters";
import { updateComicFilters } from "../db";

export function useComicFilters(
  comicId: string | null,
  initialSettings?: ImageFilterSettings
) {
  // Inicializa directamente con los settings del cómic montado
  const [filters, setFilters] = useState<ImageFilterSettings>(
    initialSettings || DEFAULT_FILTERS
  );

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timer si el componente se desmonta
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleFiltersChange = useCallback(
    (newFilters: ImageFilterSettings) => {
      setFilters(newFilters);

      if (!comicId) return;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        try {
          await updateComicFilters(comicId, newFilters);
        } catch (err) {
          console.error("Error al guardar filtros en IndexedDB:", err);
        }
      }, 400);
    },
    [comicId]
  );

  return {
    filters,
    setFilters: handleFiltersChange,
  };
}