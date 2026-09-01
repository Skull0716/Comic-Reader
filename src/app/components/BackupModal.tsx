// components/BackupModal.tsx
"use client";

import React, { useState } from "react";
import { exportLibraryBackup, restoreLibraryBackup } from "../backupService";
import { Download, Upload, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBackupRestored: () => void;
}

export default function BackupModal({ isOpen, onClose, onBackupRestored }: Props) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      await exportLibraryBackup();
      setStatusMessage("Copia de seguridad descargada exitosamente.");
      setIsError(false);
    } catch (err: unknown) {
      setStatusMessage("Error al exportar: " + (err as Error).message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await restoreLibraryBackup(file);
      setStatusMessage(
        `Restauración completada: ${res.restoredCount} cómics actualizados.${
          res.unmatchedCount > 0
            ? ` (${res.unmatchedCount} títulos del respaldo no están en este dispositivo).`
            : ""
        }`
      );
      setIsError(false);
      onBackupRestored();
    } catch (err: unknown) {
      setStatusMessage("Error al restaurar: " + (err as Error).message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-neutral-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <ShieldCheck size={22} className="text-indigo-400" />
          <h2 className="text-lg font-bold">Copia de Seguridad</h2>
        </div>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          Exporta o restaura tus páginas leídas, favoritos y configuraciones visuales en formato JSON liviano.
        </p>

        <div className="space-y-3">
          {/* Botón Exportar */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white transition disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Download size={16} className="text-indigo-400" />
              <span>Exportar Respaldo (.json)</span>
            </div>
          </button>

          {/* Botón Importar */}
          <label className="w-full flex items-center justify-between px-4 py-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white transition cursor-pointer">
            <div className="flex items-center gap-3">
              <Upload size={16} className="text-emerald-400" />
              <span>Restaurar desde archivo</span>
            </div>
            <input
              type="file"
              accept=".json"
              className="hidden"
              disabled={loading}
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Mensajes de Estado */}
        {statusMessage && (
          <div
            className={`mt-4 flex items-start gap-2 p-3 rounded-xl text-xs leading-relaxed ${
              isError
                ? "bg-red-500/10 border border-red-500/20 text-red-300"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
            }`}
          >
            {isError ? (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}