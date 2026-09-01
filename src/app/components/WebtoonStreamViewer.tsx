// components/WebtoonStreamViewer.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  pages: string[];
  initialPage?: number;
  onPageChange?: (pageIndex: number) => void;
  maxWidth?: number; // Ancho máximo del lienzo (ej. 800px para evitar que se estire demasiado en pantallas 4K)
}

export default function WebtoonStreamViewer({
  pages,
  initialPage = 0,
  onPageChange,
  maxWidth = 800,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // 1. Scroll inicial a la página guardada
  useEffect(() => {
    if (initialPage > 0 && pageRefs.current[initialPage]) {
      pageRefs.current[initialPage]?.scrollIntoView({ behavior: "instant" });
    }
  }, [initialPage]);

  // 2. Observer para rastrear la página visible en el centro del viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-page-index"));
            if (!isNaN(index)) {
              setCurrentPage(index);
              onPageChange?.(index);
            }
          }
        });
      },
      {
        root: containerRef.current,
        // Detecta la imagen que ocupa la franja central (entre el 40% y el 60% de la altura de la pantalla)
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pages, onPageChange]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-neutral-950 scroll-smooth"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Contenedor centrado con ancho restringido estilo Webtoon */}
      <div
        className="mx-auto flex flex-col items-center select-none"
        style={{ maxWidth: `${maxWidth}px` }}
      >
        {pages.map((url, idx) => (
          <div
            key={idx}
            data-page-index={idx}
            ref={(el) => {
              pageRefs.current[idx] = el;
            }}
            className="w-full relative bg-neutral-900 leading-[0]"
          >
            <img
              src={url}
              alt={`Página ${idx + 1}`}
              loading={idx > 3 ? "lazy" : "eager"}
              decoding="async"
              className="w-full h-auto block object-contain"
            />
          </div>
        ))}
      </div>

      {/* Indicador flotante minimalista de progreso en la esquina inferior derecha */}
      <div className="fixed bottom-4 right-4 z-40 bg-neutral-900/80 backdrop-blur border border-neutral-700/60 px-3 py-1.5 rounded-full text-xs text-neutral-300 font-mono shadow-xl">
        Pág. <strong className="text-white">{currentPage + 1}</strong> / {pages.length}
      </div>
    </div>
  );
}