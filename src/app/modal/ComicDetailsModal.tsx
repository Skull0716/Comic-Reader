// src/app/modal/ComicDetailsModal.tsx
"use client";

import React, { useState } from "react";
import { ComicRecord, deleteComic } from "../db";
import { X, BookOpen, Trash2, Calendar, User, FileText, AlertTriangle } from "lucide-react";

interface Props {
  comic: ComicRecord;
  coverUrl: string;
  onClose: () => void;
  onRead: (comic: ComicRecord) => void;
  onDeleted?: () => void;
}

export default function ComicDetailsModal({
  comic,
  coverUrl,
  onClose,
  onRead,
  onDeleted,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        <div className="w-full md:w-52 bg-neutral-950 shrink-0 flex items-center justify-center p-5 border-b md:border-b-0 md:border-r border-neutral-800 self-stretch">
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

            {/* Recuadro de Sinopsis con scroll independiente */}
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
            {confirmDelete ? (
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/50 p-1.5 rounded-xl text-xs text-red-300 w-full sm:w-auto">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <span>¿Eliminar?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-[11px] cursor-pointer transition"
                >
                  {isDeleting ? "..." : "Sí"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 text-neutral-400 hover:text-white text-[11px] cursor-pointer transition"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            )}

            <button
              onClick={() => onRead(comic)}
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