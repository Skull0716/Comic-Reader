// hooks/useImmersiveMode.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Options {
  autoHideDelay?: number; // Tiempo en ms antes de ocultar automáticamente (0 para desactivar)
  initialVisible?: boolean;
}

export function useImmersiveMode({
  autoHideDelay = 3500,
  initialVisible = true,
}: Options = {}) {
  const [showUI, setShowUI] = useState(initialVisible);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar temporizador previo
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Iniciar cuenta regresiva para ocultar la UI
  const startTimer = useCallback(() => {
    clearTimer();
    if (autoHideDelay > 0) {
      timerRef.current = setTimeout(() => {
        setShowUI(false);
      }, autoHideDelay);
    }
  }, [autoHideDelay]);

  // Alternar manualmente visibilidad
  const toggleUI = useCallback(() => {
    setShowUI((prev) => {
      const next = !prev;
      if (next) startTimer();
      else clearTimer();
      return next;
    });
  }, [startTimer]);

  // Despertar la UI al mover el ratón o interactuar
  const revealUI = useCallback(() => {
    setShowUI(true);
    startTimer();
  }, [startTimer]);

  // Fullscreen toggle nativo
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen no permitido o fallido:", err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      clearTimer();
    };
  }, []);

  return {
    showUI,
    setShowUI,
    toggleUI,
    revealUI,
    isFullscreen,
    toggleFullscreen,
  };
}