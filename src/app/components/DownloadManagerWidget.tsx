// src/app/components/DownloadManagerWidget.tsx
"use client";

import React, { useState } from "react";
import { useDownloads } from "../context/DownloadContext";
import { Download, ChevronDown, ChevronUp, Check, AlertCircle, Loader2, X, Trash2, StopCircle } from "lucide-react";

export default function DownloadManagerWidget() {
  const { tasks, removeTask, cancelDownload, clearCompleted } = useDownloads();
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  const activeCount = tasks.filter((t) => t.status === "downloading" || t.status === "extracting").length;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end select-text">
      {/* Botón flotante / cabecera */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-white rounded-2xl shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
      >
        <div className="relative">
          <Download size={18} className={activeCount > 0 ? "text-indigo-400 animate-bounce" : "text-neutral-400"} />
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold">
          {activeCount > 0 ? `Descargando (${activeCount})` : "Descargas"}
        </span>
        {isOpen ? <ChevronDown size={15} className="text-neutral-400" /> : <ChevronUp size={15} className="text-neutral-400" />}
      </button>

      {/* Panel desplegable */}
      {isOpen && (
        <div className="mt-2 w-80 sm:w-96 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950/60">
            <span className="text-xs font-bold text-neutral-300">Cola de Descargas</span>
            <button
              onClick={clearCompleted}
              title="Limpiar completadas"
              className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Limpiar finalizadas</span>
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-3 space-y-2.5 divide-y divide-neutral-800/40">
            {tasks.map((task) => {
              const isActive = task.status === "downloading" || task.status === "extracting";

              return (
                <div key={task.id} className="pt-2 first:pt-0 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-neutral-200 font-medium line-clamp-1 flex-1">
                      {task.title}
                    </span>
                    <button
                      onClick={() => (isActive ? cancelDownload(task.id) : removeTask(task.id))}
                      title={isActive ? "Cancelar descarga" : "Eliminar de la lista"}
                      className="text-neutral-500 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                    >
                      {isActive ? <StopCircle size={14} className="text-red-400" /> : <X size={13} />}
                    </button>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        task.status === "completed"
                          ? "bg-emerald-500"
                          : task.status === "error"
                          ? "bg-red-500"
                          : "bg-indigo-500"
                      }`}
                      style={{
                        width: `${task.status === "completed" ? 100 : task.progress}%`,
                      }}
                    />
                  </div>

                  {/* Estado y porcentaje */}
                  <div className="flex items-center justify-between text-[11px]">
                    {task.status === "downloading" && (
                      <span className="text-indigo-400 flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" /> Descargando ({task.progress}%)
                      </span>
                    )}
                    {task.status === "extracting" && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" /> Procesando cómic...
                      </span>
                    )}
                    {task.status === "completed" && (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <Check size={12} /> Listo en Biblioteca
                      </span>
                    )}
                    {task.status === "error" && (
                      <span className="text-red-400 flex items-center gap-1 line-clamp-1" title={task.error}>
                        <AlertCircle size={12} className="shrink-0" /> {task.error || "Error"}
                      </span>
                    )}

                    {isActive && (
                      <button
                        onClick={() => cancelDownload(task.id)}
                        className="text-[10px] text-red-400 hover:underline cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}