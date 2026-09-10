// src/app/modal/ComicDetailsModal.tsx
"use client";

import React, { useState } from "react";
import { ComicRecord, deleteComic } from "../db";
import { syncProgressAndFavorite } from "../syncService";
import {
  X,
  BookOpen,
  Trash2,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  Heart,
} from "lucide-react";

interface Props {
  comic: ComicRecord;
  coverUrl: string;
  onClose: () => void;
  onRead: (comic: ComicRecord) => void;
  onDeleted?: () => void;
  onUpdate?: () => void;
}

export default function ComicDetailsModal({
  comic,
  coverUrl,
  onClose,
  onRead,
  onDeleted,
  onUpdate,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado local para respuesta visual instantánea (0 ms)
  const [optimisticFav, setOptimisticFav] = useState(Boolean(comic.isFavorite));
  const [prevComicId, setPrevComicId] = useState(comic.id);

  // Sincroniza si el usuario abre otro cómic sin desmontar el modal
  if (comic.id !== prevComicId) {
    setPrevComicId(comic.id);
    setOptimisticFav(Boolean(comic.isFavorite));
  }

  const handleToggleFavorite = async () => {
    const nextStatus = !optimisticFav;

    // 1. Respuesta visual instantánea
    setOptimisticFav(nextStatus);

    try {
      // 2. Persistencia en segundo plano
      await syncProgressAndFavorite(comic.id, undefined, nextStatus);
      onUpdate?.();
    } catch (err) {
      console.error("Error al actualizar favorito:", err);
      // Reversión si falla
      setOptimisticFav(!nextStatus);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteComic(comic.id);
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      console.error("Error al borrar el cómic:", err);
      alert("No se pudo eliminar el cómic.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-text animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-neutral-100"
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 z-20 cursor-pointer transition"
        >
          <X size={18} />
        </button>

        {/* Portada */}
        <div className="w-full md:w-52 bg-neutral-950 shrink-0 flex items-center justify-center p-5 border-b md:border-b-0 md:border-r border-neutral-800 self-stretch relative">
          <img
            src={coverUrl}
            alt={comic.title}
            className="w-full max-w-[160px] h-auto aspect-[2/3] object-cover rounded-xl shadow-lg border border-neutral-800"
          />
        </div>

        {/* Columna de Detalles */}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          <div className="space-y-3">
            {/* Título y metadatos */}
            <div>
              <h2 className="text-base font-bold text-white leading-tight pr-6 line-clamp-2">
                {comic.title}
              </h2>

              <div className="mt-2.5 space-y-1 text-xs text-neutral-400">
                {comic.metadata?.writer && (
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-neutral-500 shrink-0" />
                    <span className="truncate">
                      Guion: <strong className="text-neutral-200">{comic.metadata.writer}</strong>
                    </span>
                  </div>
                )}
                {comic.metadata?.year && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-neutral-500 shrink-0" />
                    <span>
                      Año: <strong className="text-neutral-200">{comic.metadata.year}</strong>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className="text-neutral-500 shrink-0" />
                  <span>
                    Páginas: <strong className="text-neutral-200">{comic.totalPages}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Recuadro de Sinopsis */}
            {comic.metadata?.summary && (
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                  Sinopsis
                </span>
                <div className="max-h-28 overflow-y-auto pr-1 text-xs text-neutral-300 leading-relaxed whitespace-pre-line select-text scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                  {comic.metadata.summary}
                </div>
              </div>
            )}
          </div>

          {/* Botonera inferior */}
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1">
              {/* Botón Favorito reactivo e instantáneo */}
              <button
                onClick={handleToggleFavorite}
                title={optimisticFav ? "Quitar de favoritos" : "Marcar como favorito"}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer active:scale-95 ${
                  optimisticFav
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25"
                    : "bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <Heart
                  size={14}
                  className={optimisticFav ? "fill-rose-400 text-rose-400" : "text-neutral-400"}
                />
                <span>Favorito</span>
              </button>

              {/* Botón Eliminar */}
              {confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/50 p-1 rounded-xl text-xs text-red-300">
                  <AlertTriangle size={13} className="text-red-400 shrink-0" />
                  <span className="text-[11px]">¿Borrar?</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-[10px] cursor-pointer transition"
                  >
                    {isDeleting ? "..." : "Sí"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 text-neutral-400 hover:text-white text-[10px] cursor-pointer transition"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}
            </div>

            {/* Botón Leer */}
            <button
              onClick={() => onRead({ ...comic, isFavorite: optimisticFav })}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition ml-auto cursor-pointer"
            >
              <BookOpen size={15} />
              <span>
                {comic.currentPage && comic.currentPage > 0
                  ? `Continuar (Pág. ${comic.currentPage + 1})`
                  : "Comenzar a leer"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}