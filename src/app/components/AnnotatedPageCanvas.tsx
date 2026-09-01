// components/AnnotatedPageCanvas.tsx
"use client";

import React, { useState } from "react";
import { ComicAnnotation } from "../types/bookmarks";
import { MessageSquare, Trash2, X, Plus } from "lucide-react";

interface Props {
  pageUrl: string;
  pageIndex: number;
  comicId: string;
  annotations: ComicAnnotation[];
  isAnnotating: boolean;
  onAddAnnotation: (annotation: Omit<ComicAnnotation, "id" | "createdAt">) => void;
  onDeleteAnnotation: (id: string) => void;
}

export default function AnnotatedPageCanvas({
  pageUrl,
  pageIndex,
  comicId,
  annotations,
  isAnnotating,
  onAddAnnotation,
  onDeleteAnnotation,
}: Props) {
  const [activePin, setActivePin] = useState<ComicAnnotation | null>(null);
  const [draftCoords, setDraftCoords] = useState<{ x: number; y: number } | null>(null);
  const [draftText, setDraftText] = useState("");

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDraftCoords({ x, y });
    setDraftText("");
  };

  const handleSaveDraft = () => {
    if (!draftCoords || !draftText.trim()) return;

    onAddAnnotation({
      comicId,
      pageIndex,
      xPercent: draftCoords.x,
      yPercent: draftCoords.y,
      content: draftText.trim(),
    });

    setDraftCoords(null);
    setDraftText("");
  };

  return (
    <div className="relative flex items-center justify-center max-h-full max-w-full select-none">
      {/* Contenedor relativo que coincide exactamente con las dimensiones de la imagen */}
      <div
        onClick={handleImageClick}
        className={`relative inline-block ${isAnnotating ? "cursor-crosshair" : ""}`}
      >
        <img
          src={pageUrl}
          alt={`Página ${pageIndex + 1}`}
          className="max-h-[85vh] w-auto object-contain shadow-2xl block"
        />

        {/* Pines existentes en esta página */}
        {pageAnnotations.map((pin) => (
          <div
            key={pin.id}
            style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePin(activePin?.id === pin.id ? null : pin);
              }}
              className="group relative flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600/90 text-white shadow-lg border-2 border-white/80 hover:scale-110 transition-transform"
            >
              <MessageSquare size={13} className="fill-white" />
            </button>

            {/* Popover con el texto de la nota */}
            {activePin?.id === pin.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 rounded-xl bg-neutral-900/95 border border-neutral-700 backdrop-blur-md shadow-2xl text-neutral-200 z-30 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-start justify-between gap-2 mb-1 pb-1 border-b border-neutral-800">
                  <span className="text-[10px] font-bold uppercase text-indigo-400">
                    Nota en viñeta
                  </span>
                  <button
                    onClick={() => onDeleteAnnotation(pin.id)}
                    className="text-neutral-400 hover:text-red-400 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-xs text-neutral-100 leading-relaxed break-words">
                  {pin.content}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Popover para crear nueva nota tras hacer clic */}
        {draftCoords && (
          <div
            style={{ left: `${draftCoords.x}%`, top: `${draftCoords.y}%` }}
            onClick={(e) => e.stopPropagation()}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 w-64 p-3 rounded-xl bg-neutral-900 border border-indigo-500 shadow-2xl backdrop-blur-md text-neutral-100"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-semibold text-indigo-400">Nueva Nota</span>
              <button
                onClick={() => setDraftCoords(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <textarea
              autoFocus
              rows={2}
              placeholder="Escribe tu observación o comentario..."
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setDraftCoords(null)}
                className="px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-md shadow transition"
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}