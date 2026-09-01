// components/ImmersiveComicViewer.tsx
"use client";

import React, { useEffect } from "react";
import { useImmersiveMode } from "../hooks/useInmersiveMode";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  pages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}

export default function ImmersiveComicViewer({
  pages,
  currentPage,
  onPageChange,
  onClose,
}: Props) {
  const { showUI, toggleUI, revealUI, isFullscreen, toggleFullscreen } =
    useImmersiveMode({ autoHideDelay: 4000 });

  const prevPage = () => onPageChange(Math.max(currentPage - 1, 0));
  const nextPage = () => onPageChange(Math.min(currentPage + 1, pages.length - 1));

  // Atajos de teclado para modo Zen y Pantalla Completa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "h" || e.key === "H" || e.key === "z") toggleUI();
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen, toggleUI, nextPage, prevPage]);

  return (
    <div
      className="relative h-screen w-screen bg-black text-neutral-100 overflow-hidden select-none"
      onMouseMove={revealUI}
    >
      {/* ================= BARRA SUPERIOR (HEADER) ================= */}
      <header
        className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/60 transition-transform duration-300 ease-in-out ${
          showUI ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition"
        >
          <ArrowLeft size={15} />
          <span>Biblioteca</span>
        </button>

        <span className="text-xs font-medium text-neutral-400">
          Página <strong className="text-white">{currentPage + 1}</strong> de {pages.length}
        </span>

        <div className="flex items-center gap-2">
          {/* Botón Zen Mode manual */}
          <button
            onClick={toggleUI}
            title="Ocultar interfaz (Z)"
            className="p-2 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
          >
            {showUI ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Botón Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            title="Pantalla completa (F)"
            className="p-2 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </header>

      {/* ================= LIENZO DE LECTURA ================= */}
      <main className="relative h-full w-full flex items-center justify-center p-0">
        <img
          src={pages[currentPage]}
          alt={`Página ${currentPage + 1}`}
          className="max-h-full max-w-full object-contain shadow-2xl transition-opacity duration-150"
        />

        {/* --- ZONAS TÁCTILES TRANSPARENTES --- */}
        {/* Zona Izquierda (Retroceso) */}
        <div
          onClick={prevPage}
          className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer"
        />

        {/* Zona Centro (Toggle Zen / UI) */}
        <div
          onClick={toggleUI}
          className="absolute left-1/4 right-1/4 top-0 bottom-0 z-10 cursor-pointer"
        />

        {/* Zona Derecha (Avance) */}
        <div
          onClick={nextPage}
          className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer"
        />
      </main>

      {/* ================= BARRA INFERIOR DE PROGRESO ================= */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-50 px-6 py-4 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800/60 transition-transform duration-300 ease-in-out ${
          showUI ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 transition"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Slider interactivo de páginas */}
          <input
            type="range"
            min={0}
            max={pages.length - 1}
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="flex-1 accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />

          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}