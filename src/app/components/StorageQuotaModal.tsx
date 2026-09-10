"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useStorageQuota } from "../hooks/useStorageQuota";
import { getAllComics } from "../db";
import {
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CheckCircle,
  RefreshCw,
  X,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStorageChanged?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function StorageQuotaModal({
  isOpen,
  onClose,
  onStorageChanged,
}: Props) {
  const {
    stats,
    loading,
    refreshStorage,
    requestPersistence,
    purgeCompletedComics,
    clearEntireStorage,
  } = useStorageQuota();

  const [comicsBytes, setComicsBytes] = useState(0);
  const [totalUsageBytes, setTotalUsageBytes] = useState(0);
  const [calculatingComics, setCalculatingComics] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Consulta asíncrona segura del tamaño real de cómics y uso del navegador
  const calculateRealComicsSize = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        setTotalUsageBytes(estimate.usage || 0);
      }

      const comics = await getAllComics();
      const total = comics.reduce((acc, c) => {
        const file = c.fileBlob?.size || 0;
        const cover = c.coverBlob?.size || 0;
        return acc + file + cover;
      }, 0);
      setComicsBytes(total);
    } catch {
      setComicsBytes(0);
    } finally {
      setCalculatingComics(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadSize() {
      try {
        if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
          const estimate = await navigator.storage.estimate();
          if (isMounted) setTotalUsageBytes(estimate.usage || 0);
        }

        const comics = await getAllComics();
        if (isMounted) {
          const total = comics.reduce((acc, c) => {
            const file = c.fileBlob?.size || 0;
            const cover = c.coverBlob?.size || 0;
            return acc + file + cover;
          }, 0);
          setComicsBytes(total);
        }
      } catch {
        if (isMounted) {
          setTotalUsageBytes(0);
          setComicsBytes(0);
        }
      } finally {
        if (isMounted) setCalculatingComics(false);
      }
    }

    loadSize();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Diferencia exacta entre uso total del navegador y cómics guardados
  const cacheBytes = Math.max(0, totalUsageBytes - comicsBytes);

  const handleRequestPersistence = async () => {
    const granted = await requestPersistence();
    setMessage(
      granted
        ? "¡Almacenamiento persistente concedido por el navegador!"
        : "El navegador no otorgó persistencia (varía según permisos de la app)."
    );
  };

  const handlePurgeCompleted = async () => {
    const count = await purgeCompletedComics();
    setMessage(`Se liberó espacio eliminando ${count} cómics completados.`);
    await calculateRealComicsSize();
    onStorageChanged?.();
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      setMessage("Caché temporal purgada. Recargando para aplicar cambios...");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setMessage("No se pudo vaciar la caché automáticamente.");
      console.error(err);
      setClearingCache(false);
    }
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas borrar todos los cómics y datos locales? Esta acción es irreversible."
      )
    ) {
      await clearEntireStorage();
      await calculateRealComicsSize();
      setMessage("Se han eliminado todos los cómics locales.");
      onStorageChanged?.();
    }
  };

  const getBarColor = (percent: number) => {
    if (percent > 85) return "bg-red-500";
    if (percent > 60) return "bg-amber-500";
    return "bg-indigo-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-neutral-100 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <HardDrive size={20} className="text-indigo-400" />
            <h2 className="text-base font-bold text-white">Almacenamiento Local</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                refreshStorage();
                calculateRealComicsSize();
              }}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              title="Recalcular"
            >
              <RefreshCw
                size={15}
                className={loading || calculatingComics ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Medidor de Cuota General */}
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-neutral-400">Espacio total del sitio</span>
            <div className="text-right">
              <span className="text-sm font-bold text-white">
                {stats.usedFormatted}
              </span>
              <span className="text-xs text-neutral-500"> / {stats.totalFormatted}</span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-neutral-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getBarColor(
                stats.percentageUsed
              )}`}
              style={{ width: `${Math.max(stats.percentageUsed, 1)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>{stats.totalComicsCount} cómics guardados</span>
            <span>{stats.percentageUsed}% de cuota asignada</span>
          </div>
        </div>

        {/* Desglose: Cómics vs Motor/Caché */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-neutral-500 block text-[11px]">Cómics guardados</span>
            <span className="font-bold text-indigo-400 text-sm mt-0.5 block">
              {calculatingComics ? "..." : formatBytes(comicsBytes)}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-neutral-500 block text-[11px]">Caché & Motor Web</span>
            <span className="font-bold text-neutral-300 text-sm mt-0.5 block">
              {formatBytes(cacheBytes)}
            </span>
          </div>
        </div>

        {/* Estado de Persistencia */}
        <div className="mt-4 p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {stats.isPersistent ? (
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert size={18} className="text-amber-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-semibold text-neutral-200 leading-tight">
                {stats.isPersistent
                  ? "Persistencia Activada"
                  : "Persistencia Opcional"}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                {stats.isPersistent
                  ? "Tus cómics no serán borrados por el navegador al faltar espacio."
                  : "El sistema operativo podría limpiar datos si se agota el disco."}
              </p>
            </div>
          </div>

          {!stats.isPersistent && (
            <button
              onClick={handleRequestPersistence}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-200 rounded-lg transition shrink-0 cursor-pointer"
            >
              Activar
            </button>
          )}
        </div>

        {/* Acciones de Limpieza */}
        <div className="mt-4 space-y-2 pt-2 border-t border-neutral-800">
          {/* Vaciar caché huérfana de la app */}
          <button
            onClick={handleClearCache}
            disabled={clearingCache}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-medium text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RotateCcw
                size={14}
                className={`text-sky-400 ${clearingCache ? "animate-spin" : ""}`}
              />
              <span>Limpiar caché del lector (PWA / WASM)</span>
            </div>
            <span className="text-[10px] text-neutral-500">
              {clearingCache ? "Limpiando..." : "Purgar caché"}
            </span>
          </button>

          <button
            onClick={handlePurgeCompleted}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-medium text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Purgar cómics leídos al 100%</span>
            </div>
            <span className="text-[10px] text-neutral-500">Liberar tomos</span>
          </button>

          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-950 border border-red-900/30 hover:border-red-600/50 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Trash2 size={14} />
              <span>Borrar cómics de la biblioteca</span>
            </div>
            <span className="text-[10px] text-red-500/70">Reset biblioteca</span>
          </button>
        </div>

        {/* Mensaje Informativo */}
        {message && (
          <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-xl text-xs leading-relaxed flex items-center gap-2 animate-in fade-in">
            <CheckCircle size={15} className="text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}