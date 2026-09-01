// components/ZoomableComicPage.tsx
"use client";

import React from "react";
import { usePinchZoom } from "../hooks/usePinchZoom";

interface Props {
  src: string;
  alt?: string;
  className?: string;
  onSingleTap?: () => void;
}

export default function ZoomableComicPage({
  src,
  alt = "Comic Page",
  className = "",
}: Props) {
  const { transform, onPointerDown, onPointerMove, onPointerUp, isZoomed } =
    usePinchZoom(1, 4);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none" }}
    >
      <div
        className="w-full h-full flex items-center justify-center will-change-transform transition-transform duration-75"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0px) scale(${transform.scale})`,
          transformOrigin: "center center",
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={`max-h-full max-w-full object-contain pointer-events-none shadow-2xl ${className}`}
        />
      </div>

      {/* Indicador visual flotante de nivel de zoom cuando está ampliado */}
      {isZoomed && (
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur border border-neutral-700 text-neutral-200 text-xs px-2.5 py-1 rounded-full pointer-events-none">
          {transform.scale.toFixed(1)}x
        </div>
      )}
    </div>
  );
}