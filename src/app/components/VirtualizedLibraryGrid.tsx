// components/VirtualizedLibraryGrid.tsx
"use client";

import React, { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LibraryGridGroup } from "../types/collections";
import SeriesCard from "./SeriesCard";

interface Props {
  groups: LibraryGridGroup[];
  coverUrls: Record<string, string>;
  onSelectGroup: (group: LibraryGridGroup) => void;
  columns?: number;
}

export default function VirtualizedLibraryGrid({
  groups,
  coverUrls,
  onSelectGroup,
  columns = 5,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Dividir los elementos en filas de N columnas
  const rows = useMemo(() => {
    const r: LibraryGridGroup[][] = [];
    for (let i = 0; i < groups.length; i += columns) {
      r.push(groups.slice(i, i + columns));
    }
    return r;
  }, [groups, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 340, // Altura estimada de cada fila (tarjeta + margen)
    overscan: 2,
  });

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-140px)] w-full overflow-y-auto overflow-x-hidden pr-1"
    >
      <div
        className="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                height: `${virtualRow.size}px`,
              }}
            >
              {rowItems.map((group) => (
                <SeriesCard
                  key={group.id}
                  group={group}
                  coverUrl={coverUrls[group.coverComic.id]}
                  onClick={() => onSelectGroup(group)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}