// src/app/components/LibraryView.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getAllComics, saveComic, ComicRecord } from "../db";
import { extractMetadata } from "../extractCover";
import { extractComicInfo } from "../parseComicInfo";
import {
  Plus,
  BookOpen,
  Loader2,
  ShieldCheck,
  HardDrive,
  Server,
  Sparkles,
} from "lucide-react";
import BackupModal from "./BackupModal";
import SearchFilterBar from "./searchFilterBar";
import { useFilteredLibrary } from "../hooks/useFilteredLibrary";
import { groupComicsIntoSeries } from "../groupComics";
import { INITIAL_FILTERS, FilterState } from "../types/search";
import { LibraryGridGroup } from "../types/collections";
import SeriesCard from "./SeriesCard";
import SeriesDetailView from "./SeriesDetailView";
import ComicDetailsModal from "../modal/ComicDetailsModal";
import StorageQuotaModal from "./StorageQuotaModal";
import OPDSExplorerModal from "./OPDSExplorerModal";
import OPDSServerSettingsModal from "./OPDSServerSettingsModal";
import ArchiveExplorerModal from "./ArchiveExplorerModal";
import { OPDSServerConfig } from "../types/opds";
import { useDownloads } from "../context/DownloadContext";

interface Props {
  onSelectComic: (comic: ComicRecord) => void;
}

export default function LibraryView({ onSelectComic }: Props) {
  const { tasks } = useDownloads();

  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Estados para OPDS
  const [showOPDSSettingsModal, setShowOPDSSettingsModal] = useState(false);
  const [selectedOPDSServer, setSelectedOPDSServer] = useState<OPDSServerConfig | null>(null);

  // Estados de datos y carga
  const [comics, setComics] = useState<ComicRecord[]>([]);
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [importing, setImporting] = useState(false);

  // Filtros y búsqueda
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Estados de navegación interna
  const [selectedSeries, setSelectedSeries] = useState<LibraryGridGroup | null>(null);
  const [selectedComicDetails, setSelectedComicDetails] = useState<ComicRecord | null>(null);

  // Progreso de importación
  const [currentImportIndex, setCurrentImportIndex] = useState(0);
  const [totalImportFiles, setTotalImportFiles] = useState(0);

  const coverUrlsRef = useRef<Record<string, string>>({});

  // Helper para liberar memoria
  const revokePreviousUrls = useCallback(() => {
    Object.values(coverUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    coverUrlsRef.current = {};
  }, []);

// Consulta de la BD y generación segura de ObjectURLs
  const loadComicsData = useCallback(async () => {
    try {
      const data = await getAllComics();
      const urls: Record<string, string> = {};

      data.forEach((c) => {
        if (c.coverBlob && c.coverBlob instanceof Blob && c.coverBlob.size > 0) {
          try {
            urls[c.id] = URL.createObjectURL(c.coverBlob);
          } catch (e) {
            console.warn(`No se pudo crear URL para la portada del cómic ${c.id}:`, e);
          }
        }
      });

      return { comics: data.reverse(), urls };
    } catch (err) {
      console.error("Error al obtener cómics de IndexedDB:", err);
      return { comics: [], urls: {} };
    }
  }, []);

  // Función para recargar la biblioteca tras importar, descargar o borrar
  const refreshLibrary = useCallback(async () => {
    try {
      const { comics: newComics, urls: newUrls } = await loadComicsData();
      revokePreviousUrls();
      coverUrlsRef.current = newUrls;
      setCoverUrls(newUrls);
      setComics(newComics);
    } catch (err) {
      console.error("Error actualizando la biblioteca:", err);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, [loadComicsData, revokePreviousUrls]);

// 1. Carga inicial: Solo se ejecuta UNA vez al montar el componente ([] de dependencias)
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const { comics: initialComics, urls: initialUrls } = await loadComicsData();
        if (isMounted) {
          coverUrlsRef.current = initialUrls;
          setCoverUrls(initialUrls);
          setComics(initialComics);
        } else {
          Object.values(initialUrls).forEach((url) => URL.revokeObjectURL(url));
        }
      } catch (err) {
        console.error("Error al inicializar la biblioteca:", err);
      } finally {
        if (isMounted) {
          setIsLoadingLibrary(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      revokePreviousUrls();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Listener de descargas blindado contra re-renders infinitos
  const processedCompletedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    // Solo reaccionar si hay IDs completados que NO hayamos procesado antes
    const newlyCompleted = tasks.filter(
      (t) => t.status === "completed" && !processedCompletedIdsRef.current.has(t.id)
    );

    if (newlyCompleted.length === 0) return;

    newlyCompleted.forEach((t) => processedCompletedIdsRef.current.add(t.id));
    refreshLibrary();
  }, [tasks, refreshLibrary]);

  // 1. Agrupar por series
  const groups = useMemo(() => groupComicsIntoSeries(comics), [comics]);

  // 2. Filtrar y ordenar
  const filteredGroups = useFilteredLibrary(groups, filters);

  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setImporting(true);
    setTotalImportFiles(fileList.length);
    setCurrentImportIndex(0);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setCurrentImportIndex(i + 1);

        const { coverBlob, totalPages } = await extractMetadata(file);
        const comicInfo = await extractComicInfo(file);

        const timestamp = new Date().getTime();
        const uniqueId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? `${file.name}-${crypto.randomUUID()}`
            : `${file.name}-${file.size}-${timestamp}`;

        const newComic: ComicRecord = {
          id: uniqueId,
          title: comicInfo?.series
            ? `${comicInfo.series} ${comicInfo.number ? `#${comicInfo.number}` : ""}`.trim()
            : comicInfo?.title || file.name.replace(/\.[^/.]+$/, ""),
          fileBlob: file,
          coverBlob,
          totalPages,
          currentPage: 0,
          addedAt: timestamp,
          metadata: comicInfo || undefined,
        };
        await saveComic(newComic);
      }
      await refreshLibrary();
    } catch (err: unknown) {
      console.error("Error importando cómics:", err);
    } finally {
      setImporting(false);
      setCurrentImportIndex(0);
      setTotalImportFiles(0);
      e.target.value = "";
    }
  };

  const handleGroupClick = (group: LibraryGridGroup) => {
    if (group.type === "series" || group.type === "custom-collection") {
      setSelectedSeries(group);
    } else {
      setSelectedComicDetails(group.coverComic);
    }
  };

  if (selectedSeries) {
    return (
      <SeriesDetailView
        seriesGroup={selectedSeries}
        coverUrls={coverUrls}
        onBack={() => setSelectedSeries(null)}
        onSelectComic={(comic) => {
          setSelectedSeries(null);
          onSelectComic(comic);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-8 select-text">
      {/* Barra superior */}
      <div className="max-w-7xl mx-auto flex items-center justify-between pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Biblioteca</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {isLoadingLibrary
              ? "Cargando biblioteca..."
              : `${comics.length} ${comics.length === 1 ? "título disponible" : "títulos disponibles"}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
{/* Botón Descubrir (Destacado) */}
<button
  onClick={() => setShowArchiveModal(true)}
  title="Explorar y descargar cómics gratuitos desde Internet Archive"
  className="group relative flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-600/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 hover:border-amber-400/80 text-amber-200 hover:text-amber-100 px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95"
>
  <Sparkles size={16} className="text-amber-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
  <span className="font-semibold tracking-wide">Descubrir</span>
</button>

          {/* Botón Explorar OPDS */}
          <button
            onClick={() => setShowOPDSSettingsModal(true)}
            title="Configurar y explorar servidores OPDS (Komga/Kavita)"
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3.5 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
          >
            <Server size={18} className="text-indigo-400" />
            <span className="hidden sm:inline">OPDS</span>
          </button>

          {/* Botón Memoria */}
          <button
            onClick={() => setShowStorageModal(true)}
            title="Uso de almacenamiento y memoria"
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3.5 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
          >
            <HardDrive size={18} className="text-indigo-400" />
            <span className="hidden sm:inline">Memoria</span>
          </button>

          {/* Botón Respaldo */}
          <button
            onClick={() => setShowBackupModal(true)}
            title="Copia de seguridad y restauración"
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3.5 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
          >
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="hidden sm:inline">Respaldos</span>
          </button>

          {/* Botón Añadir Cómics */}
          <label className="flex items-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-md">
            <Plus size={18} />
            <span>{importing ? "Importando..." : "Añadir cómics"}</span>
            <input
              type="file"
              multiple
              accept=".cbz,.cbr,.zip,.rar"
              className="hidden"
              disabled={importing}
              onChange={handleImportFiles}
            />
          </label>
        </div>
      </div>

      {/* Buscador y Filtros */}
      {!isLoadingLibrary && comics.length > 0 && (
        <div className="max-w-7xl mx-auto mt-6">
          <SearchFilterBar
            filters={filters}
            onChange={setFilters}
            totalResults={filteredGroups.length}
          />
        </div>
      )}

{/* Grid de Cómics / Estados de Carga */}
      <div className="max-w-7xl mx-auto mt-8">
        {isLoadingLibrary ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-500 gap-3">
            <Loader2 size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs">Cargando tu colección de cómics...</p>
          </div>
        ) : comics.length === 0 && !importing ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-400 text-center bg-neutral-900/20">
            <BookOpen size={48} className="stroke-[1.5] mb-3 text-neutral-600" />
            <h3 className="text-sm font-semibold text-neutral-200">Tu biblioteca está vacía</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Comienza añadiendo archivos locales <code className="text-neutral-400">.cbz/.cbr</code>, conecta tu servidor Komga o descarga cómics del dominio público.
            </p>
            
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setShowArchiveModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
              >
                <Sparkles size={15} className="text-neutral-950 fill-neutral-950" />
                <span>Explorar Catálogo Gratis</span>
              </button>
            </div>
          </div>
        ) : comics.length > 0 && filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-sm">
            No se encontraron cómics que coincidan con la búsqueda o filtro seleccionado.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredGroups.map((group) => (
              <SeriesCard
                key={group.id}
                group={group}
                coverUrl={coverUrls[group.coverComic.id]}
                onClick={() => handleGroupClick(group)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {selectedComicDetails && (
        <ComicDetailsModal
          comic={selectedComicDetails}
          coverUrl={coverUrls[selectedComicDetails.id]}
          onClose={() => setSelectedComicDetails(null)}
          onRead={(comic) => {
            setSelectedComicDetails(null);
            onSelectComic(comic);
          }}
          onDeleted={refreshLibrary}
        />
      )}

      {/* Modal Descubrir Cómics Libres */}
      <ArchiveExplorerModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
      />

      {/* Modal Ajustes y Selección de Servidores OPDS */}
      <OPDSServerSettingsModal
        isOpen={showOPDSSettingsModal}
        onClose={() => setShowOPDSSettingsModal(false)}
        onSelectServer={(server) => {
          setSelectedOPDSServer(server);
          setShowOPDSSettingsModal(false);
        }}
      />

      {/* Modal Explorador del Catálogo del Servidor Seleccionado */}
      {selectedOPDSServer && (
        <OPDSExplorerModal
          isOpen={Boolean(selectedOPDSServer)}
          server={selectedOPDSServer}
          onClose={() => setSelectedOPDSServer(null)}
          onDownloaded={refreshLibrary}
        />
      )}

      {/* Indicador de importación */}
      {importing && (
        <aside
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
          <div className="flex flex-col">
            <span className="text-xs text-neutral-200 font-medium">
              Importando cómics...
            </span>
            <span className="text-[11px] text-neutral-400">
              Procesando <strong>{currentImportIndex}</strong> de <strong>{totalImportFiles}</strong>
            </span>
          </div>
        </aside>
      )}

      {/* Modal de Almacenamiento */}
      <StorageQuotaModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        onStorageChanged={refreshLibrary}
      />

      {/* Modal de Respaldo */}
      <BackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onBackupRestored={refreshLibrary}
      />
    </div>
  );
}