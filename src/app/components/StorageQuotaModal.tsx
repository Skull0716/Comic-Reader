// components/StorageQuotaModal.tsx
"use client";

import React, { useState } from "react";
import { useStorageQuota } from "../hooks/useStorageQuota";
import {
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CheckCircle,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStorageChanged?: () => void;
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

  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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
    onStorageChanged?.();
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas borrar todos los cómics y datos locales? Esta acción es irreversible."
      )
    ) {
      await clearEntireStorage();
      setMessage("Se han eliminado todos los datos locales.");
      onStorageChanged?.();
    }
  };

  // Color de la barra según saturación de memoria
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
              onClick={() => refreshStorage()}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              title="Recalcular"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Medidor de Cuota */}
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-neutral-400">Espacio en uso</span>
            <div className="text-right">
              <span className="text-sm font-bold text-white">
                {stats.usedFormatted}
              </span>
              <span className="text-xs text-neutral-500"> / {stats.totalFormatted}</span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-neutral-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getBarColor(
                stats.percentageUsed
              )}`}
              style={{ width: `${Math.max(stats.percentageUsed, 1)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>{stats.totalComicsCount} cómics guardados</span>
            <span>{stats.percentageUsed}% ocupado</span>
          </div>
        </div>

        {/* Estado de Persistencia */}
        <div className="mt-5 p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-center justify-between gap-3">
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
                  ? "Tus cómics no serán purgados por el sistema operativo."
                  : "El navegador podría limpiar datos si se agota el disco."}
              </p>
            </div>
          </div>

          {!stats.isPersistent && (
            <button
              onClick={handleRequestPersistence}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-200 rounded-lg transition shrink-0"
            >
              Activar
            </button>
          )}
        </div>

        {/* Acciones de Limpieza */}
        <div className="mt-5 space-y-2 pt-2 border-t border-neutral-800">
          <button
            onClick={handlePurgeCompleted}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-medium text-neutral-300 hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-indigo-400" />
              <span>Purgar cómics leídos al 100%</span>
            </div>
            <span className="text-[10px] text-neutral-500">Liberar espacio</span>
          </button>

          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-950 border border-red-900/30 hover:border-red-600/50 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 transition"
          >
            <div className="flex items-center gap-2">
              <Trash2 size={15} />
              <span>Borrar toda la biblioteca</span>
            </div>
            <span className="text-[10px] text-red-500/70">Reset total</span>
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