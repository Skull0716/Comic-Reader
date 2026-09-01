// components/ComicDoubleBuffer.tsx
"use client";

import React, { useState } from "react";

interface ComicDoubleBufferProps {
  visibleIndices: number[];
  pages: string[];
  filterStyle: string;
}

interface BufferState {
  activeSlot: "A" | "B";
  slotA: number[];
  slotB: number[];
  prevIndices: number[];
  loadedImages: number;
}

export default function ComicDoubleBuffer({
  visibleIndices,
  pages,
  filterStyle,
}: ComicDoubleBufferProps) {
  const [bufferState, setBufferState] = useState<BufferState>(() => ({
    activeSlot: "A",
    slotA: visibleIndices,
    slotB: [],
    prevIndices: visibleIndices,
    loadedImages: 0,
  }));

  // Detección de cambio de pliego durante el render
  const hasIndicesChanged =
    visibleIndices.length !== bufferState.prevIndices.length ||
    visibleIndices.some((val, i) => val !== bufferState.prevIndices[i]);

  if (hasIndicesChanged) {
    // Asignar el nuevo pliego al slot inactivo (back buffer) y reiniciar el contador
    setBufferState((prev) => ({
      ...prev,
      prevIndices: visibleIndices,
      loadedImages: 0,
      slotA: prev.activeSlot === "A" ? prev.slotA : visibleIndices,
      slotB: prev.activeSlot === "A" ? visibleIndices : prev.slotB,
    }));
  }

  // Notificación cuando cada imagen termina de cargarse
  const handleImageLoad = (slotName: "A" | "B", targetIndices: number[]) => {
    setBufferState((prev) => {
      // Ignorar si ya se está mostrando ese slot o si el pliego quedó obsoleto
      if (prev.activeSlot === slotName) return prev;
      
      const isCurrentRequest =
        targetIndices.length === prev.prevIndices.length &&
        targetIndices.every((val, i) => val === prev.prevIndices[i]);

      if (!isCurrentRequest) return prev;

      const nextLoaded = prev.loadedImages + 1;

      // Si todas las páginas del pliego cargaron, hacer swap instantáneo
      if (nextLoaded >= targetIndices.length) {
        return {
          ...prev,
          activeSlot: slotName,
          loadedImages: nextLoaded,
        };
      }

      return {
        ...prev,
        loadedImages: nextLoaded,
      };
    });
  };

  const renderSpread = (indices: number[], slotName: "A" | "B") => {
    if (!indices || indices.length === 0) return null;

    const isActive = bufferState.activeSlot === slotName;

    return (
      <div
        className={`absolute inset-0 flex items-center justify-center gap-1 w-full h-full pointer-events-none transition-opacity duration-75 ${
          isActive ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
        style={{
          filter: filterStyle,
          contain: "strict",
        }}
      >
        {indices.map((idx) => {
          const src = pages[idx];
          if (!src) return null;

          return (
            <div
              key={`slot-${slotName}-page-${idx}`}
              className="flex items-center justify-center h-full max-w-full"
            >
              <img
                src={src}
                alt={`Página ${idx + 1}`}
                decoding="async"
                loading="eager"
                onLoad={() => handleImageLoad(slotName, indices)}
                className="max-h-full max-w-full object-contain shadow-2xl select-none"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "translate3d(0, 0, 0)",
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {renderSpread(bufferState.slotA, "A")}
      {renderSpread(bufferState.slotB, "B")}
    </div>
  );
}