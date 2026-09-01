// src/app/components/ArchiveExplorerModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Loader2,
  Check,
  X,
  Sparkles,
  AlertCircle,
  PlusCircle,
  Layers,
} from "lucide-react";
import { useDownloads } from "../context/DownloadContext";
import IssueSelectorModal from "./IssueSelectorModal";

interface ComicItem {
  id: string;
  title: string;
  creator: string;
  year: string;
  description: string;
  coverUrl: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchiveExplorerModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ComicItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<ComicItem | null>(null);

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

  const handlePerformSearch = async (searchQuery: string, pageNum = 1) => {
    const term = searchQuery.trim() || "comic";
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/archive/search?q=${encodeURIComponent(term)}&page=${pageNum}&rows=30`
      );
      if (!res.ok) throw new Error("Fallo al buscar títulos");
      const data = await res.json();
      const docs: ComicItem[] = data.results || [];

      if (pageNum === 1) {
        setResults(docs);
      } else {
        setResults((prev) => [...prev, ...docs]);
      }
      setHasMore(docs.length >= 30);
      setPage(pageNum);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al realizar la búsqueda");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Carga inicial solo si aún no hay resultados explorados
  useEffect(() => {
    if (!isOpen || results.length > 0) return;

    let isMounted = true;
    const controller = new AbortController();

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/archive/search?q=comic&page=1&rows=30`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Fallo al conectar con el catálogo");
        const data = await res.json();
        if (isMounted) {
          setResults(data.results || []);
          setHasMore((data.results || []).length >= 30);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isMounted) setError(err instanceof Error ? err.message : "Error al cargar catálogo");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen, results.length]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-text"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden text-neutral-100 shadow-2xl"
        >
          {/* Cabecera */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Explorador de Cómics</h3>
                <p className="text-xs text-neutral-400">
                  Descarga en segundo plano mientras continúas navegando
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </header>

          {/* Buscador */}
          <div className="p-6 pb-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePerformSearch(query, 1);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título, autor o personaje (ej. Batman, Daredevil, Manga, Tintin)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                <span>Buscar</span>
              </button>
            </form>
          </div>

          {error && (
            <div className="mx-6 my-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Grid de Cómics */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-neutral-400">
                <Loader2 size={28} className="animate-spin text-indigo-500" />
                <span className="text-xs">Buscando títulos disponibles...</span>
              </div>
            )}

            {!loading && results.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-500 text-xs">
                No se encontraron cómics para esta búsqueda.
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {results.map((item) => {
                    const isPack = /\(\d+-\d+\)|\b\d+-\d+\b|vol|collection|pack/i.test(item.title);
                    const currentTask = tasks.find((t) => t.id === item.id);
                    const isDownloading =
                      currentTask?.status === "downloading" || currentTask?.status === "extracting";
                    const isDone = currentTask?.status === "completed";

                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 shadow-lg"
                      >
                        <div className="relative aspect-[2/3] w-full bg-neutral-900 overflow-hidden">
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />

                          {/* Badge de colección si es paquete de varios tomos */}
                          {isPack && (
                            <div className="absolute top-2 left-2 bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur flex items-center gap-1">
                              <Layers size={11} />
                              <span>Colección</span>
                            </div>
                          )}

                          {/* Botón de acción */}
                          <button
                            onClick={() => {
                              if (isPack) {
                                setSelectedPack(item);
                              } else {
                                startDownload(item);
                              }
                            }}
                            disabled={!isPack && (isDownloading || isDone)}
                            className={`absolute bottom-2.5 right-2.5 p-2 rounded-xl text-white shadow-xl backdrop-blur transition cursor-pointer ${
                              isPack
                                ? "bg-indigo-600 hover:bg-indigo-500"
                                : isDone
                                ? "bg-emerald-600"
                                : "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-75"
                            }`}
                            title={isPack ? "Ver lista de tomos disponibles" : "Descargar cómic"}
                          >
                            {isPack ? (
                              <div className="flex items-center gap-1 text-[11px] font-medium px-1">
                                <Layers size={14} />
                                <span>Ver tomos</span>
                              </div>
                            ) : isDownloading ? (
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
                        </div>

                        <div className="p-3 flex flex-col justify-between flex-1">
                          <h4 className="font-semibold text-xs text-neutral-200 line-clamp-2 leading-tight">
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-neutral-500 mt-2">{item.year}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-8 pb-4">
                    <button
                      onClick={() => handlePerformSearch(query, page + 1)}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      {loadingMore ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <PlusCircle size={15} />
                      )}
                      <span>Cargar más resultados</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal selector de tomos para colecciones */}
      {selectedPack && (
        <IssueSelectorModal
          comic={selectedPack}
          onClose={() => setSelectedPack(null)}
        />
      )}
    </>
  );
}