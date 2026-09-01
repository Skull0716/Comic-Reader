// components/SeriesDetailView.tsx
"use client";

import React from "react";
import { LibraryGridGroup } from "../types/collections";
import { ComicRecord } from "../db";
import { ArrowLeft, Play, Layers } from "lucide-react";

interface Props {
  seriesGroup: LibraryGridGroup;
  coverUrls: Record<string, string>;
  onBack: () => void;
  onSelectComic: (comic: ComicRecord) => void;
}

export default function SeriesDetailView({
  seriesGroup,
  coverUrls,
  onBack,
  onSelectComic,
}: Props) {
  // Encontrar el primer tomo no leído o en progreso para el botón rápido
  const nextToRead =
    seriesGroup.items.find((c) => c.currentPage < c.totalPages - 1) ||
    seriesGroup.items[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header con botón atrás */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition"
        >
          <ArrowLeft size={16} />
          <span>Volver a la Biblioteca</span>
        </button>

        {/* Banner de la Serie */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">
              <Layers size={14} />
              <span>Colección • {seriesGroup.totalVolumes} volúmenes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {seriesGroup.title}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {seriesGroup.unreadCount > 0
                ? `${seriesGroup.unreadCount} tomos pendientes por leer`
                : "Todos los tomos completados"}
            </p>
          </div>

          <button
            onClick={() => onSelectComic(nextToRead)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Play size={16} className="fill-white" />
            <span>Continuar: Vol. {nextToRead.metadata?.volume || nextToRead.title}</span>
          </button>
        </div>

        {/* Grid de Tomos dentro de la Serie */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {seriesGroup.items.map((comic) => (
            <div
              key={comic.id}
              onClick={() => onSelectComic(comic)}
              className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden cursor-pointer hover:border-neutral-600 transition shadow-lg hover:-translate-y-1 duration-200"
            >
              <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
                {coverUrls[comic.id] ? (
                  <img
                    src={coverUrls[comic.id]}
                    alt={comic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                    Sin Portada
                  </div>
                )}
                {comic.currentPage > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800/80">
                    <div
                      className="h-full bg-indigo-500"
                      style={{
                        width: `${Math.round(((comic.currentPage + 1) / comic.totalPages) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col justify-between flex-1">
                <h4 className="font-semibold text-xs text-neutral-200 line-clamp-2">
                  {comic.metadata?.number ? `Vol. ${comic.metadata.number}` : comic.title}
                </h4>
                <span className="text-[11px] text-neutral-500 mt-2">
                  {comic.currentPage === 0
                    ? `${comic.totalPages} págs`
                    : `${comic.currentPage + 1}/${comic.totalPages}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}