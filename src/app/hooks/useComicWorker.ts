// hooks/useComicWorker.ts
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { WorkerInputPayload, WorkerOutputPayload } from "../workers/comic.worker";

export function useComicWorker() {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const activeUrlsRef = useRef<string[]>([]);

  // Limpieza segura de URLs previas en memoria
  const clearPreviousUrls = useCallback(() => {
    if (activeUrlsRef.current.length > 0) {
      activeUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      activeUrlsRef.current = [];
    }
  }, []);

  // Inicializar Worker de manera estable
  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/comic.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerOutputPayload>) => {
      const data = e.data;

      if (!data.success) {
        setError(data.error || "Error en el procesamiento del cómic.");
        setLoading(false);
        return;
      }

      if (typeof data.progress === "number" && !data.pages) {
        setProgress(data.progress);
      }

      if (data.pages && Array.isArray(data.pages)) {
        // Crear nuevas URLs de una sola vez
        const newUrls = data.pages.map((blob) => URL.createObjectURL(blob));
        activeUrlsRef.current = newUrls;
        setPages(newUrls);
        setLoading(false);
        setProgress(100);
      }
    };

    worker.onerror = (err) => {
      console.error("[ComicWorker Error]:", err);
      setError("Error interno en el worker de descompresión.");
      setLoading(false);
    };

    return () => {
      worker.terminate();
      clearPreviousUrls();
    };
  }, [clearPreviousUrls]);

  const processFile = useCallback(
    async (file: File) => {
      if (!workerRef.current) return;

      const fileName = file.name.toLowerCase();
      const isValidExt =
        fileName.endsWith(".cbz") ||
        fileName.endsWith(".zip") ||
        fileName.endsWith(".cbr") ||
        fileName.endsWith(".rar");

      if (!isValidExt) {
        setError("Formato inválido. Solo se admiten archivos .cbz y .cbr.");
        return;
      }

      setLoading(true);
      setProgress(0);
      setError(null);

      // Limpiar URLs del cómic previo antes de procesar el nuevo
      clearPreviousUrls();
      setPages([]);

      try {
        const buffer = await file.arrayBuffer();

        const payload: WorkerInputPayload = {
          action: "EXTRACT_ALL_PAGES",
          buffer: buffer,
          fileName: file.name,
        };

        // Transferir el buffer como objeto transferible (cero copia de RAM)
        workerRef.current.postMessage(payload, [buffer]);
      } catch (err) {
        console.error("Error al leer el archivo en memoria:", err);
        setError("No se pudo leer el archivo seleccionado.");
        setLoading(false);
      }
    },
    [clearPreviousUrls]
  );

  return { pages, loading, progress, error, processFile, revokeActiveUrls: clearPreviousUrls };
}