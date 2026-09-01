// src/app/hooks/useStorageQuota.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllComics, deleteComic, getDB } from "../db";

export interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  usedFormatted: string;
  totalFormatted: string;
  percentageUsed: number;
  isPersistent: boolean;
  totalComicsCount: number;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function useStorageQuota() {
  const [stats, setStats] = useState<StorageStats>({
    usedBytes: 0,
    totalBytes: 0,
    usedFormatted: "0 MB",
    totalFormatted: "0 GB",
    percentageUsed: 0,
    isPersistent: false,
    totalComicsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Función asíncrona pura para obtener las estadísticas sin mutar loading síncronamente
  const calculateStats = useCallback(async (): Promise<StorageStats> => {
    let isPersistent = false;
    if (typeof navigator !== "undefined" && navigator.storage?.persisted) {
      isPersistent = await navigator.storage.persisted();
    }

    let used = 0;
    let total = 0;

    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      used = estimate.usage || 0;
      total = estimate.quota || 0;
    }

    const comics = await getAllComics();
    const percentageUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

    return {
      usedBytes: used,
      totalBytes: total,
      usedFormatted: formatBytes(used),
      totalFormatted: formatBytes(total),
      percentageUsed,
      isPersistent,
      totalComicsCount: comics.length,
    };
  }, []);

  // Función manual para refrescar (aquí sí es válido encender loading al dispararse por un evento de usuario)
  const refreshStorage = useCallback(async () => {
    setLoading(true);
    try {
      const newStats = await calculateStats();
      setStats(newStats);
    } catch (err) {
      console.warn("No se pudo calcular el almacenamiento:", err);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // Efecto inicial seguro con flag de limpieza para evitar llamadas setState huérfanas o en cascada
  useEffect(() => {
    let isSubscribed = true;

    calculateStats()
      .then((newStats) => {
        if (isSubscribed) {
          setStats(newStats);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Error al inicializar almacenamiento:", err);
        if (isSubscribed) {
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [calculateStats]);

  // Solicitar almacenamiento persistente
  const requestPersistence = async () => {
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      const granted = await navigator.storage.persist();
      await refreshStorage();
      return granted;
    }
    return false;
  };

  // Purgar cómics completados
  const purgeCompletedComics = async () => {
    const comics = await getAllComics();
    const completed = comics.filter((c) => c.currentPage >= c.totalPages - 1);
    for (const c of completed) {
      await deleteComic(c.id);
    }
    await refreshStorage();
    return completed.length;
  };

  // Limpiar toda la base de datos
  const clearEntireStorage = async () => {
    const db = await getDB();
    await db.clear("comics");
    if (db.objectStoreNames.contains("collections")) {
      await db.clear("collections");
    }
    if (db.objectStoreNames.contains("bookmarks")) {
      await db.clear("bookmarks");
    }
    if (db.objectStoreNames.contains("annotations")) {
      await db.clear("annotations");
    }
    await refreshStorage();
  };

  return {
    stats,
    loading,
    refreshStorage,
    requestPersistence,
    purgeCompletedComics,
    clearEntireStorage,
  };
}