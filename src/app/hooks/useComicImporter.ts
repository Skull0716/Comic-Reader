// hooks/useComicImporter.ts
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { saveComic, ComicRecord } from "../db";
import type { WorkerInputPayload, WorkerOutputPayload } from "../workers/comic.worker";

export function useComicImporter(onImportCompleted?: () => void) {
  const [importing, setImporting] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/comic.worker.ts", import.meta.url),
      { type: "module" }
    );
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const importBatch = useCallback(async (files: FileList | File[]) => {
    if (!workerRef.current || files.length === 0) return;

    setImporting(true);
    setTotalFiles(files.length);
    setCurrentFileIndex(0);

    const fileList = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setCurrentFileIndex(i + 1);

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["cbz", "zip", "cbr", "rar"].includes(ext || "")) continue;

      const buffer = await file.arrayBuffer();

      // Esperamos la respuesta del worker para este archivo
      await new Promise<void>((resolve) => {
        if (!workerRef.current) return resolve();

        workerRef.current.onmessage = async (e: MessageEvent<WorkerOutputPayload>) => {
          const res = e.data;
          if (res.action === "EXTRACT_METADATA" && res.success && res.coverBlob) {
            const meta = res.metadata;
            
            // Si el XML trae Serie y Número, armar un título formateado; sino usar el nombre del archivo
            const title = meta?.series
              ? `${meta.series} ${meta.number ? `#${meta.number}` : ""}`.trim()
              : meta?.title || file.name.replace(/\.[^/.]+$/, "");

            const record: ComicRecord = {
              id: `${file.name}-${file.size}-${Date.now()}`,
              title,
              fileBlob: file,
              coverBlob: res.coverBlob,
              totalPages: res.totalPages || 0,
              currentPage: 0,
              addedAt: Date.now(),
              metadata: meta,
            };

            await saveComic(record);
          }
          resolve();
        };

        const payload: WorkerInputPayload = {
action: "EXTRACT_METADATA",
          buffer: buffer,
          fileName: file.name,
               };

        // Transferimos el buffer para consumo de memoria 0 en el hilo principal
        workerRef.current.postMessage(payload, [buffer]);
      });
    }

    setImporting(false);
    if (onImportCompleted) onImportCompleted();
  }, [onImportCompleted]);

  return { importBatch, importing, currentFileIndex, totalFiles };
}