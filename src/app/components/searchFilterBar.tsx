// components/SearchFilterBar.tsx
"use client";

import React from "react";
import { FilterState, ReadStatusFilter, SortOption } from "../types/search";
import { Search, X, SlidersHorizontal, BookOpen, Clock, CheckCircle2, ListFilter } from "lucide-react";

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableGenres?: string[];
  totalResults: number;
}

export default function SearchFilterBar({
  filters,
  onChange,
  availableGenres = [],
  totalResults,
}: Props) {
  const handleStatusClick = (status: ReadStatusFilter) => {
    onChange({
      ...filters,
      status: filters.status === status ? "all" : status,
    });
  };

  const clearSearch = () => {
    onChange({ ...filters, query: "" });
  };

  return (
    <div className="w-full space-y-3 select-none">
      {/* Fila Principal: Buscador + Selector de Orden */}
      <div className="flex items-center gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por título, autor, serie, editorial..."
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            className="w-full pl-10 pr-9 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          {filters.query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Selector de Orden */}
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl text-xs text-neutral-300">
          <ListFilter size={14} className="text-neutral-500" />
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onChange({ ...filters, sortBy: e.target.value as SortOption })
            }
            className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer"
          >
            <option value="recent" className="bg-neutral-900">Más recientes</option>
            <option value="title" className="bg-neutral-900">Título (A-Z)</option>
            <option value="progress" className="bg-neutral-900">Progreso</option>
            <option value="pages" className="bg-neutral-900">Nº Páginas</option>
          </select>
        </div>
      </div>

      {/* Fila Secundaria: Píldoras de Filtro Rápido */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Chip Todos */}
          <button
            onClick={() => onChange({ ...filters, status: "all" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filters.status === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Todos
          </button>

          {/* Chip Leyendo */}
          <button
            onClick={() => handleStatusClick("reading")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filters.status === "reading"
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Clock size={13} />
            <span>Leyendo</span>
          </button>

          {/* Chip No Leídos */}
          <button
            onClick={() => handleStatusClick("unread")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filters.status === "unread"
                ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <BookOpen size={13} />
            <span>No leídos</span>
          </button>

          {/* Chip Completados */}
          <button
            onClick={() => handleStatusClick("completed")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filters.status === "completed"
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Completados</span>
          </button>
        </div>

        {/* Contador de Resultados */}
        <span className="text-xs text-neutral-500 font-mono">
          {totalResults} {totalResults === 1 ? "resultado" : "resultados"}
        </span>
      </div>
    </div>
  );
}