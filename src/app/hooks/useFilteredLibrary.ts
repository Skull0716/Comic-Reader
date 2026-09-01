// hooks/useFilteredLibrary.ts
"use client";

import { useMemo } from "react";
import { LibraryGridGroup } from "../types/collections";
import { FilterState } from "../types/search";

export function useFilteredLibrary(
  groups: LibraryGridGroup[],
  filters: FilterState
) {
  return useMemo(() => {
    let result = [...groups];

    // 1. Filtrado por Búsqueda de Texto (Query)
    if (filters.query.trim().length > 0) {
      const q = filters.query.toLowerCase().trim();

      result = result.filter((group) => {
        // Coincidencia con el título del grupo/serie
        if (group.title.toLowerCase().includes(q)) return true;

        // Coincidencia en alguno de los cómics internos (autor, serie, género, sinopsis)
        return group.items.some((c) => {
          const meta = c.metadata;
          return (
            c.title.toLowerCase().includes(q) ||
            meta?.writer?.toLowerCase().includes(q) ||
            meta?.penciller?.toLowerCase().includes(q) ||
            meta?.publisher?.toLowerCase().includes(q) ||
            meta?.genre?.toLowerCase().includes(q) ||
            meta?.summary?.toLowerCase().includes(q)
          );
        });
      });
    }

    // 2. Filtrado por Estado de Lectura
    if (filters.status !== "all") {
      result = result.filter((group) => {
        return group.items.some((c) => {
          const isCompleted = c.currentPage >= c.totalPages - 1;
          const isReading = c.currentPage > 0 && !isCompleted;
          const isUnread = c.currentPage === 0;

          if (filters.status === "reading") return isReading;
          if (filters.status === "unread") return isUnread;
          if (filters.status === "completed") return isCompleted;
          return true;
        });
      });
    }

    // 3. Filtrado por Género
    if (filters.genre) {
      result = result.filter((group) =>
        group.items.some((c) =>
          c.metadata?.genre?.toLowerCase().includes(filters.genre!.toLowerCase())
        )
      );
    }

    // 4. Ordenación (Sort)
    result.sort((a, b) => {
      if (filters.sortBy === "title") {
        return a.title.localeCompare(b.title, undefined, { numeric: true });
      }

      if (filters.sortBy === "progress") {
        const getProgress = (g: LibraryGridGroup) =>
          g.items.reduce((acc, c) => acc + (c.currentPage / (c.totalPages || 1)), 0) /
          g.items.length;
        return getProgress(b) - getProgress(a);
      }

      if (filters.sortBy === "pages") {
        const getPages = (g: LibraryGridGroup) =>
          g.items.reduce((acc, c) => acc + c.totalPages, 0);
        return getPages(b) - getPages(a);
      }

      // Por defecto: Más recientes añadidos
      return (b.coverComic.addedAt || 0) - (a.coverComic.addedAt || 0);
    });

    return result;
  }, [groups, filters]);
}