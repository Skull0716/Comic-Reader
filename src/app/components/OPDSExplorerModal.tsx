// src/app/components/OPDSExplorerModal.tsx
"use client";

import React, { useEffect } from "react";
import { OPDSServerConfig, OPDSEntry } from "../types/opds";
import { useOPDSClient } from "../hooks/useOPDSClient";
import { useDownloads } from "../context/DownloadContext";
import OPDSCoverImage from "./OPDSCoverImage";
import {
  Server,
  Folder,
  Download,
  ArrowLeft,
  X,
  Loader2,
  Check,
  BookOpen,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  server: OPDSServerConfig;
  onClose: () => void;
  onDownloaded?: () => void;
}

export default function OPDSExplorerModal({
  isOpen,
  server,
  onClose,
  onDownloaded,
}: Props) {
  const {
    currentFeed,
    loading,
    error,
    canGoBack,
    fetchFeed,
    goBack,
  } = useOPDSClient(server);

  const { tasks, startDownload } = useDownloads();

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && !currentFeed) {
      fetchFeed(server.url);
    }
  }, [isOpen, server.url, currentFeed, fetchFeed]);

  const handleDownloadEntry = (entry: OPDSEntry) => {
    if (!entry.downloadUrl) return;

// Asegúrate de enviar username y password de server:
startDownload({
  id: `opds-${entry.id}`,
  title: entry.title,
  creator: entry.author || server.name,
  description: entry.summary,
  fileName: entry.downloadUrl,
  username: server.username,
  password: server.password,
});

    onDownloaded?.();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-text"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-neutral-100"
      >
        {/* Barra Superior */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={goBack}
                aria-label="Volver atrás"
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-700/40 text-indigo-400">
                <Server size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {currentFeed?.title || server.name}
                </h3>
                <span className="text-[11px] text-neutral-500 font-mono line-clamp-1">
                  {server.url}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </header>

        {/* Contenedor del Catálogo */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-neutral-400">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
              <span className="text-xs">Consultando catálogo de {server.name}...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          {!loading && currentFeed && currentFeed.entries.length === 0 && !error && (
            <div className="text-center py-24 text-neutral-500 text-xs">
              Esta sección o biblioteca está vacía.
            </div>
          )}

          {!loading && currentFeed && currentFeed.entries.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {currentFeed.entries.map((entry) => {
                const taskId = `opds-${entry.id}`;
                const currentTask = tasks.find((t) => t.id === taskId);
                const isDownloading =
                  currentTask?.status === "downloading" || currentTask?.status === "extracting";
                const isDone = currentTask?.status === "completed";

                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      if (entry.isNavigation && entry.navigationUrl) {
                        fetchFeed(entry.navigationUrl);
                      }
                    }}
                    className={`group relative flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden transition shadow-lg ${
                      entry.isNavigation
                        ? "cursor-pointer hover:border-indigo-500 hover:-translate-y-0.5"
                        : ""
                    }`}
                  >
                    {/* Portada o Icono de Carpeta */}
                    <div className="relative aspect-[2/3] w-full bg-neutral-900 overflow-hidden flex items-center justify-center">
                      {entry.coverUrl ? (
                        <OPDSCoverImage
                          coverUrl={entry.coverUrl}
                          server={server}
                          alt={entry.title}
                        />
                      ) : entry.isNavigation ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-neutral-600">
                          <Folder size={40} className="text-indigo-400/60" />
                          <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                            Carpeta
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-neutral-600">
                          <BookOpen size={40} />
                          <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                            Tomo
                          </span>
                        </div>
                      )}

                      {/* Botón de Descarga si es un tomo descargable */}
                      {!entry.isNavigation && entry.downloadUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadEntry(entry);
                          }}
                          disabled={isDownloading || isDone}
                          className={`absolute bottom-2.5 right-2.5 p-2 rounded-xl text-white shadow-xl backdrop-blur transition cursor-pointer ${
                            isDone
                              ? "bg-emerald-600"
                              : "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-75"
                          }`}
                          title="Descargar a biblioteca local"
                        >
                          {isDownloading ? (
                            <div className="flex items-center gap-1 text-[10px] font-mono px-1">
                              <Loader2 size={13} className="animate-spin" />
                              <span>{currentTask?.progress ?? 0}%</span>
                            </div>
                          ) : isDone ? (
                            <Check size={16} />
                          ) : (
                            <Download size={16} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Metadatos */}
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <h4 className="font-semibold text-xs text-neutral-200 line-clamp-2 leading-tight">
                        {entry.title}
                      </h4>
                      {entry.author && (
                        <span className="text-[11px] text-neutral-500 truncate mt-1.5">
                          {entry.author}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}