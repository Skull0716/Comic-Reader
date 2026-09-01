// components/SeriesCard.tsx
"use client";

import React from "react";
import { LibraryGridGroup } from "../types/collections";
import { Folder, Layers, BookOpen } from "lucide-react";

interface Props {
  group: LibraryGridGroup;
  coverUrl?: string;
  onClick: () => void;
}

export default function SeriesCard({ group, coverUrl, onClick }: Props) {
  const isGroup = group.type === "series" || group.type === "custom-collection";

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer transition-transform duration-200 hover:-translate-y-1 select-none"
    >
      {/* Efecto de pila de libros detrás si es una serie */}
      {isGroup && (
        <>
          <div className="absolute -top-1.5 left-2 right-2 h-full bg-neutral-800/60 border border-neutral-700/40 rounded-xl -z-10 transition-all group-hover:-top-2.5" />
          <div className="absolute -top-0.5 left-1 right-1 h-full bg-neutral-800/80 border border-neutral-700/60 rounded-xl -z-5 transition-all group-hover:-top-1.5" />
        </>
      )}

      {/* Tarjeta Principal */}
      <div className="relative aspect-[2/3] w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg group-hover:border-neutral-600 transition">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={group.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600">
            <BookOpen size={28} />
          </div>
        )}

        {/* Badge de cantidad de tomos si es serie */}
        {isGroup && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur border border-neutral-700 text-[11px] font-bold text-indigo-300 shadow">
            <Layers size={12} />
            <span>{group.totalVolumes} tomos</span>
          </div>
        )}

        {/* Barra de progreso de lectura (si es individual) */}
        {!isGroup && group.coverComic.currentPage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800/80">
            <div
              className="h-full bg-indigo-500"
              style={{
                width: `${Math.round(
                  ((group.coverComic.currentPage + 1) / group.coverComic.totalPages) * 100
                )}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Información */}
      <div className="pt-2 px-1">
        <h3 className="font-semibold text-xs text-neutral-200 line-clamp-2 leading-tight">
          {group.title}
        </h3>
        <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
          {isGroup ? (
            <>
              <Folder size={12} className="text-neutral-500" />
              <span>Colección</span>
            </>
          ) : (
            <span>{group.coverComic.totalPages} páginas</span>
          )}
        </p>
      </div>
    </div>
  );
}