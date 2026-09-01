// hooks/useOPDSClient.ts
"use client";

import { useState, useCallback } from "react";
import { OPDSFeed, OPDSServerConfig, OPDSEntry } from "../types/opds";
import { parseOPDSXml } from "../parseOpds";
import { extractMetadata } from "../extractCover";
import { saveComic, ComicRecord } from "../db";

export function useOPDSClient(server: OPDSServerConfig) {
  const [currentFeed, setCurrentFeed] = useState<OPDSFeed | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar un feed OPDS
  const fetchFeed = useCallback(
    async (url: string, pushToHistory = true) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/opds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUrl: url,
            username: server.username,
            password: server.password,
          }),
        });

        if (!res.ok) throw new Error("No se pudo conectar con el feed OPDS");
        const xml = await res.text();
        const parsed = parseOPDSXml(xml, url);

        setCurrentFeed(parsed);
        if (pushToHistory) {
          setHistory((prev) => [...prev, url]);
        }
      } catch (err: unknown) {
        setError((err as Error).message || "Error al explorar OPDS");
      } finally {
        setLoading(false);
      }
    },
    [server]
  );

  // Retroceder en la jerarquía de carpetas
  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Quita el actual
      const prevUrl = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      fetchFeed(prevUrl, false);
    }
  }, [history, fetchFeed]);

  // Descargar cómic directo a la biblioteca IndexedDB
  const downloadToLocalLibrary = useCallback(
    async (entry: OPDSEntry) => {
      if (!entry.downloadUrl) return;
      setDownloadingId(entry.id);

      try {
        const res = await fetch("/api/opds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUrl: entry.downloadUrl,
            username: server.username,
            password: server.password,
            isDownload: true,
          }),
        });

        if (!res.ok) throw new Error("Fallo en la descarga");
        const blob = await res.blob();
        const file = new File([blob], `${entry.title}.cbz`, { type: blob.type });

        // Extraer portada y guardar en IndexedDB
        const { coverBlob, totalPages } = await extractMetadata(file);

        const newRecord: ComicRecord = {
          id: `opds-${entry.id}-${Date.now()}`,
          title: entry.title,
          fileBlob: blob,
          coverBlob,
          totalPages,
          currentPage: 0,
          addedAt: Date.now(),
        };

        await saveComic(newRecord);
      } catch (err: unknown) {
        console.error("Error al descargar a local:", err);
      } finally {
        setDownloadingId(null);
      }
    },
    [server]
  );

  return {
    currentFeed,
    loading,
    error,
    downloadingId,
    canGoBack: history.length > 1,
    fetchFeed,
    goBack,
    downloadToLocalLibrary,
  };
}