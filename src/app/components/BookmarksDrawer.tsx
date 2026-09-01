// components/BookmarksDrawer.tsx
"use client";

import React from "react";
import { ComicBookmark, ComicAnnotation } from "../types/bookmarks";
import { Bookmark, MessageSquare, Trash2, X, ChevronRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pages: string[];
  bookmarks: ComicBookmark[];
  annotations: ComicAnnotation[];
  onJumpToPage: (pageIndex: number) => void;
  onDeleteBookmark: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export default function BookmarksDrawer({
  isOpen,
  onClose,
  pages,
  bookmarks,
  annotations,
  onJumpToPage,
  onDeleteBookmark,
  onDeleteAnnotation,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-neutral-900/95 backdrop-blur-md border-l border-neutral-800 shadow-2xl flex flex-col text-neutral-100 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Bookmark size={16} className="text-indigo-400" />
          <span>Marcadores y Notas</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Lista scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Sección Marcadores */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
            Páginas Guardadas ({bookmarks.length})
          </h4>
          {bookmarks.length === 0 ? (
            <p className="text-xs text-neutral-600">No hay páginas marcadas.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => {
                    onJumpToPage(bm.pageIndex);
                    onClose();
                  }}
                  className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 hover:border-indigo-500 cursor-pointer transition shadow"
                >
                  <img
                    src={pages[bm.pageIndex]}
                    alt={`Página ${bm.pageIndex + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 flex justify-between items-end">
                    <span className="text-[10px] font-bold text-white">
                      Pág. {bm.pageIndex + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBookmark(bm.id);
                      }}
                      className="text-neutral-400 hover:text-red-400 p-0.5 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección Notas en Viñetas */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
            Anotaciones ({annotations.length})
          </h4>
          {annotations.length === 0 ? (
            <p className="text-xs text-neutral-600">No hay notas en viñetas.</p>
          ) : (
            <div className="space-y-2">
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => {
                    onJumpToPage(ann.pageIndex);
                    onClose();
                  }}
                  className="p-3 bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 rounded-xl cursor-pointer transition group flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <MessageSquare
                      size={14}
                      className="text-indigo-400 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="text-[10px] font-semibold text-neutral-400 block">
                        Página {ann.pageIndex + 1}
                      </span>
                      <p className="text-xs text-neutral-200 line-clamp-2 mt-0.5 leading-snug">
                        {ann.content}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAnnotation(ann.id);
                    }}
                    className="text-neutral-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}