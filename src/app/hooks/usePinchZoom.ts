// hooks/usePinchZoom.ts
"use client";

import { useState, useRef, useCallback } from "react";

interface TransformState {
  scale: number;
  x: number;
  y: number;
}

export function usePinchZoom(minScale = 1, maxScale = 4) {
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const lastPanPosition = useRef<{ x: number; y: number } | null>(null);
  const lastTapTime = useRef<number>(0);

  // Calcula la distancia euclidiana entre 2 dedos
  const getDistance = (
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Doble tap rápido para alternar zoom x2 / reset
      const now = Date.now();
      if (activePointers.current.size === 1 && now - lastTapTime.current < 300) {
        setTransform((prev) => {
          if (prev.scale > 1) {
            return { scale: 1, x: 0, y: 0 };
          }
          return { scale: 2.5, x: 0, y: 0 };
        });
        lastTapTime.current = 0;
        return;
      }
      lastTapTime.current = now;

      if (activePointers.current.size === 2) {
        // Iniciar gesto de pellizco
        const [p1, p2] = Array.from(activePointers.current.values());
        initialDistance.current = getDistance(p1, p2);
        initialScale.current = transform.scale;
      } else if (activePointers.current.size === 1) {
        // Iniciar paneo
        lastPanPosition.current = { x: e.clientX, y: e.clientY };
      }
    },
    [transform.scale]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activePointers.current.has(e.pointerId)) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // 1. PINCH ZOOM (2 dedos)
      if (activePointers.current.size === 2 && initialDistance.current !== null) {
        const [p1, p2] = Array.from(activePointers.current.values());
        const currentDistance = getDistance(p1, p2);
        const factor = currentDistance / initialDistance.current;
        const targetScale = Math.min(
          Math.max(initialScale.current * factor, minScale),
          maxScale
        );

        setTransform((prev) => ({
          ...prev,
          scale: targetScale,
          // Si regresa a escala 1, re-centramos
          x: targetScale === 1 ? 0 : prev.x,
          y: targetScale === 1 ? 0 : prev.y,
        }));
      }

      // 2. PAN / ARRASTRE (1 dedo cuando hay zoom activo)
      else if (activePointers.current.size === 1 && transform.scale > 1) {
        if (lastPanPosition.current) {
          const deltaX = e.clientX - lastPanPosition.current.x;
          const deltaY = e.clientY - lastPanPosition.current.y;

          setTransform((prev) => ({
            ...prev,
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
        }
        lastPanPosition.current = { x: e.clientX, y: e.clientY };
      }
    },
    [minScale, maxScale, transform.scale]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size < 2) {
      initialDistance.current = null;
    }
    if (activePointers.current.size === 0) {
      lastPanPosition.current = null;
    }
  }, []);

  const resetZoom = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  return {
    transform,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    resetZoom,
    isZoomed: transform.scale > 1,
  };
}