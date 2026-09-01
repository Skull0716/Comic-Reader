// src/app/components/IssueSelectorModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { X, Download, Loader2, Layers, Check, BookOpen } from "lucide-react";
import { useDownloads } from "../context/DownloadContext";

interface IssueItem {
  fileName: string;
  title: string;
  issueNumber: string;
  orderIndex: number;
  sizeMb?: string;
}

interface Props {
  comic: { id: string; title: string; creator?: string; year?: string; description?: string; coverUrl?: string };
  onClose: () => void;
}

export default function IssueSelectorModal({ comic, onClose }: Props) {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { tasks, startDownload } = useDownloads();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchIssues() {
      try {
        const res = await fetch(
          `/api/archive/issues?id=${encodeURIComponent(comic.id)}&_t=${Date.now()}`,
          { 
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error("No se pudieron cargar los números disponibles");
        const data = await res.json();

        if (isMounted) {
          setIssues(data.issues || []);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error al consultar tomos");
          setLoading(false);
        }
      }
    }

    fetchIssues();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [comic.id]);
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-text"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh]"
      >
        {/* Cabecera */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-700/40 text-indigo-400">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{comic.title}</h3>
              <p className="text-xs text-neutral-400">
                {issues.length > 0
                  ? `${issues.length} números ordenados disponibles para descargar`
                  : "Explorando tomos de la colección..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </header>

        {/* Contenido con Grid de Tomos */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-neutral-400 text-xs">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
              <span>Cargando y ordenando lista de tomos...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              {error}
            </div>
          )}

          {!loading && issues.length === 0 && !error && (
            <div className="text-center py-20 text-neutral-500 text-xs">
              No se encontraron tomos compatibles dentro de esta colección.
            </div>
          )}

          {!loading && issues.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {issues.map((issue) => {
                const taskId = `${comic.id}-${issue.fileName}`;
                const currentTask = tasks.find((t) => t.id === taskId);
                const isDownloading =
                  currentTask?.status === "downloading" || currentTask?.status === "extracting";
                const isDone = currentTask?.status === "completed";

                return (
                  <div
                    key={issue.fileName}
                    className="group flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition shadow-lg relative"
                  >
                    <div className="relative aspect-[2/3] w-full bg-neutral-900 overflow-hidden flex flex-col justify-between p-3">
                      {/* Fondo sutil con la portada de la colección */}
                      {comic.coverUrl && (
                        <img
                          src={comic.coverUrl}
                          alt={issue.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[2px] group-hover:scale-105 group-hover:opacity-30 transition duration-300 pointer-events-none"
                        />
                      )}

                      {/* Badge con el número de tomo ordenado */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="bg-indigo-600 text-white font-black text-xs px-2 py-0.5 rounded-md shadow-md">
                          {issue.issueNumber}
                        </span>
                        {issue.sizeMb && (
                          <span className="text-[10px] font-mono text-neutral-300 bg-black/70 px-1.5 py-0.5 rounded backdrop-blur">
                            {issue.sizeMb} MB
                          </span>
                        )}
                      </div>

                      {/* Título central */}
                      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center gap-1">
                        <BookOpen size={24} className="text-neutral-400 group-hover:text-indigo-400 transition" />
                        <span className="text-[11px] font-semibold text-neutral-200 line-clamp-3 px-1 leading-snug">
                          {issue.title}
                        </span>
                      </div>

                      {/* Botón de descarga */}
                      <div className="relative z-10 pt-2 border-t border-white/10">
                        <button
                          onClick={() =>
                            startDownload({
                              ...comic,
                              title: `${comic.title} ${issue.issueNumber}`,
                              fileName: issue.fileName,
                            })
                          }
                          disabled={isDownloading || isDone}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg ${
                            isDone
                              ? "bg-emerald-600 text-white"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-75"
                          }`}
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span className="font-mono text-[11px]">{currentTask?.progress ?? 0}%</span>
                            </>
                          ) : isDone ? (
                            <>
                              <Check size={14} />
                              <span>En Biblioteca</span>
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>Descargar</span>
                            </>
                          )}
                        </button>
                      </div>
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