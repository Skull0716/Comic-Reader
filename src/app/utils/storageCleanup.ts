// src/app/utils/storageCleanup.ts
import { getAllComics, saveComic, deleteComic, ComicRecord } from "../db";

/**
 * Solicita al navegador que no borre los datos de IndexedDB automáticamente
 * por falta de espacio en disco (almacenamiento persistente).
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== "undefined" && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persistencia de almacenamiento concedida: ${isPersisted}`);
      return isPersisted;
    } catch (err) {
      console.warn("No se pudo solicitar almacenamiento persistente:", err);
      return false;
    }
  }
  return false;
}

/**
 * Libera el archivo pesado (Blob) de los cómics terminados pero mantiene
 * el registro y portada para que no se pierda el historial de lectura.
 */
export async function clearReadComicsBlobs(): Promise<number> {
  const comics = await getAllComics();
  let cleanedCount = 0;

  for (const comic of comics) {
    const isCompleted = comic.currentPage >= comic.totalPages - 1 && comic.totalPages > 0;
    
    // Si está leído y aún conserva el archivo binario completo
    if (isCompleted && comic.fileBlob && comic.fileBlob.size > 0) {
      const updatedRecord: ComicRecord = {
        ...comic,
        fileBlob: new Blob([], { type: "application/x-cbz" }),
      };
      await saveComic(updatedRecord);
      cleanedCount++;
    }
  }

  return cleanedCount;
}

/**
 * Elimina por completo los cómics finalizados de la base de datos local
 */
export async function deleteCompletedComics(): Promise<number> {
  const comics = await getAllComics();
  let deletedCount = 0;

  for (const comic of comics) {
    const isCompleted = comic.currentPage >= comic.totalPages - 1 && comic.totalPages > 0;
    if (isCompleted) {
      await deleteComic(comic.id);
      deletedCount++;
    }
  }

  return deletedCount;
}