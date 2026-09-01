// app/page.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import LibraryView from "./components/libraryView";
import AdvancedComicViewer from "./components/advancedComicViewer";
import { useComicWorker } from "./hooks/useComicWorker";
import { getComicById, updateProgress, ComicRecord } from "./db";
import { DownloadProvider } from "./context/DownloadContext";
import DownloadManagerWidget from "./components/DownloadManagerWidget";
import { AlertCircle, ArrowLeft } from "lucide-react";

const ACTIVE_COMIC_KEY = "last_active_comic_id";

export default function App() {
  const [activeComic, setActiveComic] = useState<ComicRecord | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const { pages, loading, progress, processFile } = useComicWorker();
  const isRestoringRef = useRef(false);

  // Función principal para abrir y procesar un cómic
  const openComic = useCallback(
    async (comic: ComicRecord) => {
      setExtractError(null);
      setActiveComic(comic);
      localStorage.setItem(ACTIVE_COMIC_KEY, comic.id);

      try {
        const fileName =
          comic.title.toLowerCase().endsWith(".cbz") ||
          comic.title.toLowerCase().endsWith(".cbr")
            ? comic.title
            : `${comic.title}.cbz`;

        const file = new File([comic.fileBlob], fileName, {
          type: comic.fileBlob.type || "application/x-cbz",
        });

        await processFile(file);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al descomprimir el cómic";
        setExtractError(msg);
      }
    },
    [processFile]
  );

  // 1. Restaurar sesión automáticamente al recargar con F5
  useEffect(() => {
    if (isRestoringRef.current) return;
    const savedComicId = localStorage.getItem(ACTIVE_COMIC_KEY);
    
    // Si no hay ID guardado, salimos temprano
    if (!savedComicId) return;

    isRestoringRef.current = true;

    async function restoreSession(id: string) {
      try {
        const comic = await getComicById(id);
        if (comic && comic.fileBlob && comic.fileBlob.size > 0) {
          await openComic(comic);
        } else {
          localStorage.removeItem(ACTIVE_COMIC_KEY);
        }
      } catch (err) {
        console.error("Error al restaurar sesión previa:", err);
        localStorage.removeItem(ACTIVE_COMIC_KEY);
      }
    }

    restoreSession(savedComicId);
  }, [openComic]);

  const handleSelectComic = useCallback(
    (comic: ComicRecord) => {
      openComic(comic);
    },
    [openComic]
  );

  const handleCloseViewer = useCallback(() => {
    localStorage.removeItem(ACTIVE_COMIC_KEY);
    setActiveComic(null);
    setExtractError(null);
  }, []);

const handlePageChange = useCallback(
    async (newPage: number) => {
      if (!activeComic) return;
      try {
        // Guardar el progreso silenciosamente en IndexedDB sin disparar re-render en page.tsx
        await updateProgress(activeComic.id, newPage);
      } catch (err) {
        console.error("Error al actualizar progreso:", err);
      }
    },
    [activeComic]
  );

  return (
    <DownloadProvider>
      {!activeComic ? (
        <LibraryView onSelectComic={handleSelectComic} />
      ) : (
        <div className="relative h-screen w-screen bg-black overflow-hidden select-none">
          {loading ? (
            <div className="flex flex-col h-full items-center justify-center text-neutral-400 text-sm gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
              <p className="font-medium text-neutral-300">
                Extrayendo tomo...{" "}
                {progress > 0 && (
                  <span className="font-mono text-indigo-400">({progress}%)</span>
                )}
              </p>
            </div>
          ) : extractError || pages.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-center p-6 gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-2 text-xs max-w-md">
                <AlertCircle size={18} className="shrink-0" />
                <span>
                  {extractError ||
                    "No se encontraron imágenes válidas dentro del archivo."}
                </span>
              </div>
              <button
                onClick={handleCloseViewer}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Volver a la Biblioteca</span>
              </button>
            </div>
          ) : (
            <AdvancedComicViewer
              key={activeComic.id}
              comic={activeComic}
              pages={pages}
              initialPage={activeComic.currentPage || 0}
              onPageChange={handlePageChange}
              onClose={handleCloseViewer}
            />
          )}
        </div>
      )}

      {/* Widget flotante independiente */}
      <DownloadManagerWidget />
    </DownloadProvider>
  );
}