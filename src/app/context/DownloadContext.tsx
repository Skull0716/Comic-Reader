// src/app/context/DownloadContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { saveComic, ComicRecord } from "../db";
import { extractMetadata } from "../extractCover";

export interface DownloadingTask {
  id: string;
  title: string;
  creator?: string;
  year?: string;
  description?: string;
  coverUrl?: string;
  fileName?: string;
  progress: number;
  status: "downloading" | "extracting" | "completed" | "error";
  error?: string;
}

export interface DownloadComicPayload {
  id: string;
  title: string;
  creator?: string;
  year?: string;
  description?: string;
  coverUrl?: string;
  fileName?: string;
  username?: string;
  password?: string;
}

interface DownloadContextType {
  tasks: DownloadingTask[];
  startDownload: (comic: DownloadComicPayload) => void;
  cancelDownload: (id: string) => void;
  clearCompleted: () => void;
  removeTask: (id: string) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children, onComicSaved }: { children: ReactNode; onComicSaved?: () => void }) {
  const [tasks, setTasks] = useState<DownloadingTask[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const updateTask = (id: string, updates: Partial<DownloadingTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const removeTask = (id: string) => {
    if (abortControllersRef.current.has(id)) {
      abortControllersRef.current.get(id)?.abort();
      abortControllersRef.current.delete(id);
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const cancelDownload = (id: string) => {
    removeTask(id);
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status === "downloading" || t.status === "extracting"));
  };

  const startDownload = useCallback(
    async (comic: DownloadComicPayload) => {
      const isOpds = comic.id.startsWith("opds-") || (comic.fileName && comic.fileName.includes("/opds/"));
      const taskId = isOpds ? comic.id : (comic.fileName ? `${comic.id}-${comic.fileName}` : comic.id);

      if (tasks.some((t) => t.id === taskId && (t.status === "downloading" || t.status === "extracting"))) {
        return;
      }

      const controller = new AbortController();
      abortControllersRef.current.set(taskId, controller);

      const newTask: DownloadingTask = {
        id: taskId,
        title: comic.title,
        creator: comic.creator,
        year: comic.year,
        description: comic.description,
        coverUrl: comic.coverUrl,
        fileName: comic.fileName,
        progress: 0,
        status: "downloading",
      };

      setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== taskId)]);

      try {
        let res: Response;

        if (isOpds) {
          // Se envían credenciales hacia el proxy
          res = await fetch("/api/opds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetUrl: comic.fileName,
              username: comic.username,
              password: comic.password,
              isDownload: true,
            }),
            signal: controller.signal,
          });
        } else {
          const downloadEndpoint = comic.fileName
            ? `/api/archive/download?id=${encodeURIComponent(comic.id)}&file=${encodeURIComponent(comic.fileName)}`
            : `/api/archive/download?id=${encodeURIComponent(comic.id)}`;

          res = await fetch(downloadEndpoint, {
            signal: controller.signal,
          });
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || "Error al conectar con el servidor.");
        }

        const headerFileName = res.headers.get("X-Comic-Filename");
        const realTitle = headerFileName
          ? decodeURIComponent(headerFileName).replace(/[-_]/g, " ")
          : comic.title;

        if (realTitle !== comic.title) {
          updateTask(taskId, { title: realTitle });
        }

        const contentLength = res.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        let blob: Blob;

        if (!res.body || total === 0) {
          blob = await res.blob();
        } else {
          const reader = res.body.getReader();
          let received = 0;
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              received += value.length;
              const currentPercent = Math.round((received / total) * 100);
              updateTask(taskId, { progress: currentPercent });
            }
          }

          const mergedArray = new Uint8Array(received);
          let offset = 0;
          for (const chunk of chunks) {
            mergedArray.set(chunk, offset);
            offset += chunk.length;
          }
          blob = new Blob([mergedArray.buffer]);
        }

        updateTask(taskId, { status: "extracting", progress: 100 });

        const cleanTitle = realTitle.replace(/[/\\?%*:|"<>]/g, "-");
        const file = new File([blob], `${cleanTitle}.cbz`, { type: "application/x-cbz" });

        const { coverBlob, totalPages } = await extractMetadata(file);

        if (totalPages === 0) {
          throw new Error("El archivo no contiene imágenes legibles.");
        }

        const timestamp = new Date().getTime();
        const uniqueId = isOpds
          ? `opds-${timestamp}-${comic.id.replace(/[^a-zA-Z0-9]/g, "_")}`
          : comic.fileName
          ? `archive-${comic.id}-${comic.fileName.replace(/[^a-zA-Z0-9]/g, "_")}`
          : `archive-${comic.id}`;

        const record: ComicRecord = {
          id: uniqueId,
          title: realTitle,
          fileBlob: blob,
          coverBlob,
          totalPages,
          currentPage: 0,
          addedAt: timestamp,
          metadata: {
            title: realTitle,
            writer: comic.creator,
            year: parseInt(comic.year || "", 10) || undefined,
            summary: comic.description,
          },
        };

        await saveComic(record);
        updateTask(taskId, { status: "completed" });
        abortControllersRef.current.delete(taskId);
        if (onComicSaved) onComicSaved();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const msg = err instanceof Error ? err.message : "Fallo en la descarga";
        updateTask(taskId, { status: "error", error: msg });
        abortControllersRef.current.delete(taskId);
      }
    },
    [tasks, onComicSaved]
  );

  return (
    <DownloadContext.Provider value={{ tasks, startDownload, cancelDownload, clearCompleted, removeTask }}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloads() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error("useDownloads debe usarse dentro de un DownloadProvider");
  }
  return context;
}