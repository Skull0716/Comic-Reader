// components/AdvancedComicViewer.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ComicPageImage from "./ComicPageImage";
import { usePageSpreads } from "../hooks/usePageSpreads";
import { useImmersiveMode } from "../hooks/useInmersiveMode";
import { ReadingMode, ReadingDirection } from "../types/viewer";
import { ImageFilterSettings, DEFAULT_FILTERS } from "../types/filters";
import { getCssFilterString } from "../filterUtils";
import FilterSettingsModal from "./FilterSettingsModal";
import BookmarksDrawer from "./BookmarksDrawer";
import ComicDoubleBuffer from "./ComicDoubleBuffer";
import {
  ComicRecord,
  saveBookmark,
  deleteBookmark,
  getBookmarksByComic,
  deleteAnnotation,
  getAnnotationsByComic,
  updateComicFilters,
  ComicBookmark,
  ComicAnnotation,
} from "../db";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Scroll,
  ArrowLeftRight,
  Sliders,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Bookmark,
  List,
} from "lucide-react";

interface Props {
  comic: ComicRecord;
  pages: string[];
  initialPage?: number;
  onPageChange?: (pageIndex: number) => void;
  onClose: () => void;
}

export default function AdvancedComicViewer({
  comic,
  pages,
  initialPage = 0,
  onPageChange,
  onClose,
}: Props) {
  const [mode, setMode] = useState<ReadingMode>("double");
  const [direction, setDirection] = useState<ReadingDirection>(
    comic.metadata?.manga ? "rtl" : "ltr"
  );
  const [filters, setFilters] = useState<ImageFilterSettings>(
    comic.filterSettings || DEFAULT_FILTERS
  );
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Marcadores y Notas
  const [bookmarks, setBookmarks] = useState<ComicBookmark[]>([]);
  const [annotations, setAnnotations] = useState<ComicAnnotation[]>([]);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);

  // Control de Throttle para cambios rápidos de página
  const lastNavTimeRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchMarkers() {
      try {
        const [bms, anns] = await Promise.all([
          getBookmarksByComic(comic.id),
          getAnnotationsByComic(comic.id),
        ]);

        if (isMounted) {
          setBookmarks(bms);
          setAnnotations(anns);
        }
      } catch (error) {
        console.error("Error al cargar marcadores:", error);
      }
    }

    fetchMarkers();

    return () => {
      isMounted = false;
    };
  }, [comic.id]);

  const refreshMarkers = async () => {
    const [bms, anns] = await Promise.all([
      getBookmarksByComic(comic.id),
      getAnnotationsByComic(comic.id),
    ]);
    setBookmarks(bms);
    setAnnotations(anns);
  };

  const { showUI, toggleUI, revealUI, isFullscreen, toggleFullscreen } =
    useImmersiveMode({ autoHideDelay: 4000 });

  const {
    currentSpread,
    spreadIndex,
    totalSpreads,
    handleNextAction,
    handlePrevAction,
  } = usePageSpreads(
    pages.length,
    mode === "webtoon" ? "single" : mode,
    direction,
    initialPage
  );

  // Throttle seguro: limita los saltos a 1 acción cada 100ms para proteger la GPU
  const safeNextAction = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current > 100) {
      lastNavTimeRef.current = now;
      handleNextAction();
    }
  }, [handleNextAction]);

  const safePrevAction = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current > 100) {
      lastNavTimeRef.current = now;
      handlePrevAction();
    }
  }, [handlePrevAction]);

  // Precarga ligera (máximo 2 páginas hacia adelante y 1 atrás, sin saturar VRAM)
  useEffect(() => {
    if (pages.length === 0 || mode === "webtoon") return;

    const currentIndices = currentSpread?.indices || [];
    const maxCurrent = Math.max(...currentIndices, 0);
    const minCurrent = Math.min(...currentIndices, 0);

    const urlsToPreload: string[] = [];
    if (maxCurrent + 1 < pages.length) urlsToPreload.push(pages[maxCurrent + 1]);
    if (maxCurrent + 2 < pages.length) urlsToPreload.push(pages[maxCurrent + 2]);
    if (minCurrent - 1 >= 0) urlsToPreload.push(pages[minCurrent - 1]);

    const images: HTMLImageElement[] = urlsToPreload.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });

    return () => {
      images.forEach((img) => {
        img.src = ""; // Aborta la decodificación si el usuario cambia de página antes
      });
    };
  }, [currentSpread, pages, mode]);

  const webtoonContainerRef = useRef<HTMLDivElement>(null);
  const webtoonPageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeWebtoonPage, setActiveWebtoonPage] = useState(initialPage);

  useEffect(() => {
    if (mode === "webtoon" && initialPage > 0) {
      const timer = setTimeout(() => {
        webtoonPageRefs.current[initialPage]?.scrollIntoView({ behavior: "instant" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mode, initialPage]);

  useEffect(() => {
    if (mode !== "webtoon" && currentSpread?.indices?.length > 0) {
      onPageChange?.(currentSpread.indices[0]);
    }
  }, [mode, currentSpread, onPageChange]);

  useEffect(() => {
    if (mode !== "webtoon") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-page-index"));
            if (!isNaN(index)) {
              setActiveWebtoonPage(index);
              onPageChange?.(index);
            }
          }
        });
      },
      {
        root: webtoonContainerRef.current,
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    webtoonPageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [mode, pages.length, onPageChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "z" || e.key === "Z") toggleUI();

      if (mode !== "webtoon") {
        if (e.key === "ArrowRight" || e.key === "d") safeNextAction();
        if (e.key === "ArrowLeft" || e.key === "a") safePrevAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, safeNextAction, safePrevAction, toggleFullscreen, toggleUI]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (mode === "webtoon") return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (mode === "webtoon" || touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        safeNextAction();
      } else {
        safePrevAction();
      }
    }
    setTouchStartX(null);
  };

  const visibleIndices = currentSpread?.indices ? [...currentSpread.indices] : [0];
  if (direction === "rtl" && visibleIndices.length === 2) {
    visibleIndices.reverse();
  }

  const toggleMode = () => {
    setMode((curr) => {
      if (curr === "double") return "single";
      if (curr === "single") return "webtoon";
      return "double";
    });
  };

  const handleFiltersChange = async (newFilters: ImageFilterSettings) => {
    setFilters(newFilters);
    await updateComicFilters(comic.id, newFilters);
  };

  const currentPageNumber =
    mode === "webtoon" ? activeWebtoonPage : currentSpread?.indices?.[0] || 0;

  const isCurrentPageBookmarked = bookmarks.some(
    (b) => b.pageIndex === currentPageNumber
  );

  const handleToggleBookmark = async () => {
    if (isCurrentPageBookmarked) {
      const target = bookmarks.find((b) => b.pageIndex === currentPageNumber);
      if (target) await deleteBookmark(target.id);
    } else {
      await saveBookmark({
        id: `bm-${comic.id}-${currentPageNumber}-${Date.now()}`,
        comicId: comic.id,
        pageIndex: currentPageNumber,
        createdAt: Date.now(),
      });
    }
    await refreshMarkers();
  };

  const filterStyle = getCssFilterString(filters);

  return (
    <div
      className="relative flex flex-col h-screen w-full bg-neutral-950 text-neutral-100 select-none overflow-hidden"
      onMouseMove={revealUI}
    >
{/* Header Responsivo Blindado */}
      <header
        className={`absolute top-0 left-0 right-0 z-50 px-3 sm:px-6 py-2 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 transition-transform duration-300 ease-in-out select-none ${
          showUI ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full">
          {/* Lado Izquierdo: Salir y Modo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              title="Volver a la Biblioteca"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-neutral-900 active:bg-neutral-800 border border-neutral-800 text-neutral-300 transition flex items-center gap-1.5"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline text-xs font-medium">Biblioteca</span>
            </button>

            <button
              onClick={toggleMode}
              title="Cambiar modo de vista"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-neutral-900 active:bg-neutral-800 border border-neutral-800 text-neutral-300 transition flex items-center gap-1.5"
            >
              {mode === "double" && <BookOpen size={16} />}
              {mode === "single" && <FileText size={16} />}
              {mode === "webtoon" && <Scroll size={16} />}
              <span className="hidden md:inline text-xs font-medium">
                {mode === "double" ? "Doble" : mode === "single" ? "1 Pág" : "Cascada"}
              </span>
            </button>

            {/* Dirección RTL/LTR (Visible directo en desktop, en móvil se compacta a pastilla) */}
            {mode !== "webtoon" && (
              <button
                onClick={() => setDirection((d) => (d === "ltr" ? "rtl" : "ltr"))}
                title="Cambiar dirección de lectura"
                className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 ${
                  direction === "rtl"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : "bg-neutral-900 text-neutral-400 border-neutral-800"
                }`}
              >
                <ArrowLeftRight size={14} />
                <span className="text-[11px] uppercase font-mono">{direction}</span>
              </button>
            )}
          </div>

          {/* Centro: Indicador de Páginas */}
          <div className="text-[11px] sm:text-xs font-mono text-neutral-400 text-center truncate px-1 shrink min-w-0">
            {mode === "webtoon" ? (
              <span>
                <strong className="text-neutral-100">{activeWebtoonPage + 1}</strong>/{pages.length}
              </span>
            ) : (
              <span>
                <strong className="text-neutral-100">
                  {(currentSpread?.indices || [0]).map((i) => i + 1).join("-")}
                </strong>
                /{pages.length}
              </span>
            )}
          </div>

          {/* Lado Derecho: Herramientas esenciales */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Guardar marcador */}
            <button
              onClick={handleToggleBookmark}
              title="Marcar página"
              className={`p-2 rounded-lg border transition ${
                isCurrentPageBookmarked
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-neutral-900 active:bg-neutral-800 border-neutral-800 text-neutral-300"
              }`}
            >
              <Bookmark size={16} className={isCurrentPageBookmarked ? "fill-white" : ""} />
            </button>

            {/* Ver lista de marcadores */}
            <button
              onClick={() => setShowBookmarksDrawer(true)}
              title="Ver marcadores"
              className="p-2 rounded-lg bg-neutral-900 active:bg-neutral-800 border border-neutral-800 text-neutral-300 transition"
            >
              <List size={16} />
            </button>

            {/* Filtros de imagen */}
            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              title="Filtros"
              className={`p-2 rounded-lg border transition flex items-center gap-1 ${
                filters.preset !== "normal" || filters.brightness !== 100 || filters.contrast !== 100
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-neutral-900 active:bg-neutral-800 border-neutral-800 text-neutral-300"
              }`}
            >
              <Sliders size={16} />
            </button>

            {/* Pantalla completa (oculta en móviles para no saturar) */}
            <button
              onClick={toggleFullscreen}
              title="Pantalla Completa"
              className="hidden sm:inline-flex p-2 rounded-lg bg-neutral-900 active:bg-neutral-800 border border-neutral-800 text-neutral-300 transition"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Filtros */}
      {showFilterModal && (
        <FilterSettingsModal
          settings={filters}
          onChange={handleFiltersChange}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {/* Drawer de Marcadores */}
      <BookmarksDrawer
        isOpen={showBookmarksDrawer}
        onClose={() => setShowBookmarksDrawer(false)}
        pages={pages}
        bookmarks={bookmarks}
        annotations={annotations}
        onJumpToPage={(p) => {
          if (mode === "webtoon") {
            webtoonPageRefs.current[p]?.scrollIntoView({ behavior: "smooth" });
          }
          onPageChange?.(p);
        }}
        onDeleteBookmark={async (id) => {
          await deleteBookmark(id);
          await refreshMarkers();
        }}
        onDeleteAnnotation={async (id) => {
          await deleteAnnotation(id);
          await refreshMarkers();
        }}
      />


      {/* Área del Lienzo */}
      {mode === "webtoon" ? (
        <main
          ref={webtoonContainerRef}
          onClick={toggleUI}
          className="relative flex-1 w-full overflow-y-auto overflow-x-hidden bg-neutral-950 scroll-smooth pt-14 pb-8"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="mx-auto flex flex-col items-center max-w-[800px]">
            {pages.map((url, idx) => (
              <div
                key={idx}
                data-page-index={idx}
                ref={(el) => {
                  webtoonPageRefs.current[idx] = el;
                }}
                className="w-full relative bg-neutral-900 leading-[0]"
              >
                <img
                  src={url}
                  alt={`Página ${idx + 1}`}
                  loading={idx > 3 ? "lazy" : "eager"}
                  decoding="async"
                  style={{ filter: filterStyle }}
                  className="w-full h-auto block object-contain"
                />
              </div>
            ))}
          </div>
        </main>
      ) : (
        /* Vista Paginada Tradicional Directa y Fluida */
        <main
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative flex-1 flex items-center justify-center overflow-hidden p-4 select-none"
        >
          <div
            className="flex items-center justify-center h-full w-full gap-2"
            style={{
              filter: filterStyle,
              contain: "layout size paint",
            }}
          >
            {visibleIndices.map((pageIdx) => {
              const src = pages[pageIdx];
              if (!src) return null;

              return (
                <div
                  key={`spread-page-${pageIdx}`}
                  className="flex items-center justify-center h-full max-w-full"
                >
                  <img
                    src={src}
                    alt={`Página ${pageIdx + 1}`}
                    decoding="async"
                    loading="eager"
                    className="max-h-full max-w-full object-contain shadow-2xl pointer-events-none"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "translate3d(0, 0, 0)",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Botones de navegación lateral */}
          <button
            onClick={safePrevAction}
            aria-label="Página anterior"
            className="absolute left-0 top-0 bottom-0 w-24 flex items-center justify-start pl-4 bg-gradient-to-r from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-20"
          >
            <ChevronLeft size={36} />
          </button>

          <button
            onClick={safeNextAction}
            aria-label="Página siguiente"
            className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-end pr-4 bg-gradient-to-l from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-20"
          >
            <ChevronRight size={36} />
          </button>
        </main>
      )}
      {/* Footer Paginado */}
      {mode !== "webtoon" && (
        <footer
          className={`absolute bottom-0 left-0 right-0 z-50 px-6 py-3 bg-neutral-950/85 backdrop-blur-md border-t border-neutral-800 transition-transform duration-300 ease-in-out ${
            showUI ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="max-w-xl mx-auto flex items-center justify-center gap-4">
            <button
              onClick={safePrevAction}
              disabled={spreadIndex === 0}
              className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-25 transition cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-xs text-neutral-400 font-mono">
              Pliego {spreadIndex + 1} / {totalSpreads}
            </span>

            <button
              onClick={safeNextAction}
              disabled={spreadIndex === totalSpreads - 1}
              className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-25 transition cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}