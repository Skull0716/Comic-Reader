// components/ComicViewerWithPersistence.tsx
"use client";

import React, { useState } from "react";
import { ComicRecord } from "../db";
import { useComicFilters } from "../hooks/useComicFilters";
import { getCssFilterString } from "../filterUtils";
import FilterSettingsModal from "./FilterSettingsModal";
import { Sliders, ArrowLeft } from "lucide-react";

interface Props {
  comic: ComicRecord;
  pages: string[];
  currentPage: number;
  onClose: () => void;
}

export default function ComicViewerWithPersistence({
  comic,
  pages,
  currentPage,
  onClose,
}: Props) {
  // Hook que maneja y autoguarda los filtros en IndexedDB para este comic.id
  const { filters, setFilters } = useComicFilters(
    comic.id,
    comic.filterSettings
  );

  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterStyle = getCssFilterString(filters);

  return (
    <div className="relative h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 flex justify-between items-center z-30">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition"
        >
          <ArrowLeft size={14} />
          <span>Biblioteca</span>
        </button>

        <span className="text-xs text-neutral-300 font-medium truncate max-w-xs">
          {comic.title}
        </span>

        <button
          onClick={() => setShowFilterModal(!showFilterModal)}
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            filters.preset !== "normal" || filters.brightness !== 100 || filters.contrast !== 100
              ? "bg-indigo-600 text-white"
              : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          }`}
        >
          <Sliders size={15} />
          <span>Filtros</span>
        </button>
      </header>

      {/* Modal flotante de ajustes */}
      {showFilterModal && (
        <FilterSettingsModal
          settings={filters}
          onChange={setFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {/* Lienzo con filtros aplicados */}
      <main className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <img
          src={pages[currentPage]}
          alt={`Página ${currentPage + 1}`}
          style={{
            filter: filterStyle,
            transition: "filter 120ms ease-out",
          }}
          className="max-h-full max-w-full object-contain shadow-2xl will-change-transform select-none"
        />
      </main>
    </div>
  );
}