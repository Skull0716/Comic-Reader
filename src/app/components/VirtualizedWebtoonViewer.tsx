// components/VirtualizedWebtoonViewer.tsx
"use client";

import React, { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface Props {
  pages: string[];
  initialPage?: number;
  onPageChange?: (pageIndex: number) => void;
  maxWidth?: number;
}

export default function VirtualizedWebtoonViewer({
  pages,
  initialPage = 0,
  onPageChange,
  maxWidth = 800,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: pages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 1200, // Altura estimada inicial en px
    overscan: 2, // Precarga 2 viñetas antes y después del viewport
  });

  // Salto a la página inicial si existe progreso guardado
  useEffect(() => {
    if (initialPage > 0) {
      virtualizer.scrollToIndex(initialPage, { align: "start" });
    }
  }, [initialPage, virtualizer]);

  // Detección de la página visible en el centro
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    if (virtualItems.length > 0) {
      const midItem = virtualItems[Math.floor(virtualItems.length / 2)];
      if (midItem) {
        onPageChange?.(midItem.index);
      }
    }
  }, [virtualItems, onPageChange]);

  const activeIndex = virtualItems[0]?.index ?? 0;

  return (
    <div
      ref={parentRef}
      className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-neutral-950 select-none"
      style={{ contain: "strict" }}
    >
      {/* Contenedor con la altura virtual total calculada */}
      <div
        className="relative mx-auto"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          maxWidth: `${maxWidth}px`,
          width: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className="w-full bg-neutral-900 leading-[0]">
              <img
                src={pages[virtualRow.index]}
                alt={`Página ${virtualRow.index + 1}`}
                className="w-full h-auto block object-contain"
                onLoad={() => {
                  // Remide la altura exacta de la imagen una vez descargada
                  virtualizer.measure();
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Indicador de progreso */}
      <div className="fixed bottom-4 right-4 z-40 bg-neutral-900/80 backdrop-blur border border-neutral-700/60 px-3 py-1.5 rounded-full text-xs text-neutral-300 font-mono shadow-xl">
        Pág. <strong className="text-white">{activeIndex + 1}</strong> / {pages.length}
      </div>
    </div>
  );
}