// lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ComicMetadata } from "./types/comicInfo";
import { ImageFilterSettings } from "./types/filters";
import { CustomCollection } from "./types/collections";
import { ComicBookmark, ComicAnnotation } from "./types/bookmarks";

export type { ComicMetadata, ImageFilterSettings, CustomCollection, ComicBookmark, ComicAnnotation };

export interface ComicRecord {
  id: string;                           // Hash o ID único
  title: string;                        // Nombre del archivo o metadato
  fileBlob: Blob;                       // Archivo .cbz / .cbr completo
  coverBlob: Blob;                      // Primera página extraída como portada
  totalPages: number;                   // Total de páginas
  currentPage: number;                  // Progreso de lectura
  addedAt: number;                      // Timestamp de importación
  lastReadAt?: number;                  // Timestamp de última lectura
  isFavorite?: boolean;                 // Marcador de favorito
  metadata?: ComicMetadata;             // Metadatos enriquecidos de ComicInfo.xml
  filterSettings?: ImageFilterSettings; // Preferencias visuales guardadas
}

export interface ComicDBSchema extends DBSchema {
  comics: {
    key: string;
    value: ComicRecord;
    indexes: { "by-date": number };
  };
  collections: {
    key: string;
    value: CustomCollection;
    indexes: { "by-date": number };
  };
  bookmarks: {
    key: string;
    value: ComicBookmark;
    indexes: { "by-comic": string };
  };
  annotations: {
    key: string;
    value: ComicAnnotation;
    indexes: { "by-comic": string };
  };
}

const DB_NAME = "comic-reader-db";
const DB_VERSION = 3;

// Singleton para mantener una sola conexión abierta y no saturar IndexedDB
let dbPromise: Promise<IDBPDatabase<ComicDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<ComicDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ComicDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("comics")) {
          const comicStore = db.createObjectStore("comics", { keyPath: "id" });
          comicStore.createIndex("by-date", "addedAt");
        }

        if (!db.objectStoreNames.contains("collections")) {
          const collectionStore = db.createObjectStore("collections", { keyPath: "id" });
          collectionStore.createIndex("by-date", "createdAt");
        }

        if (!db.objectStoreNames.contains("bookmarks")) {
          const bookmarkStore = db.createObjectStore("bookmarks", { keyPath: "id" });
          bookmarkStore.createIndex("by-comic", "comicId");
        }

        if (!db.objectStoreNames.contains("annotations")) {
          const annotationStore = db.createObjectStore("annotations", { keyPath: "id" });
          annotationStore.createIndex("by-comic", "comicId");
        }
      },
      blocked() {
        console.warn("[IndexedDB] Conexión en espera: otra pestaña tiene abierta una versión anterior.");
      },
      blocking() {
        console.warn("[IndexedDB] Cerrando conexión obsoleta para permitir recarga limpia.");
        if (dbPromise) {
          dbPromise.then((db) => db.close()).catch(() => {});
          dbPromise = null;
        }
      },
      terminated() {
        console.warn("[IndexedDB] Conexión terminada inesperadamente por el navegador.");
        dbPromise = null;
      },
    }).catch((err: unknown) => {
      dbPromise = null;
      throw err;
    });
  }

  return dbPromise;

}

/* ==========================================================================
   CRUD Y OPERACIONES DE CÓMICS
   ========================================================================== */

export async function saveComic(comic: ComicRecord): Promise<void> {
  const db = await getDB();
  await db.put("comics", comic);
}

export async function getComicById(id: string): Promise<ComicRecord | undefined> {
  const db = await getDB();
  return db.get("comics", id);
}

export async function getAllComics(): Promise<ComicRecord[]> {
  try {
    const db = await getDB();
    const comics = await db.getAllFromIndex("comics", "by-date");
    return comics || [];
  } catch (error) {
    console.error("[IndexedDB] Error al obtener todos los cómics:", error);
    return [];
  }
}

export async function deleteComic(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("comics", id);
}

export async function updateProgress(id: string, currentPage: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("comics", "readwrite");
  const store = tx.objectStore("comics");
  const comic = await store.get(id);

  if (comic) {
    comic.currentPage = currentPage;
    comic.lastReadAt = Date.now();
    await store.put(comic);
  }
  await tx.done;
}

// Alias de compatibilidad
export const updateComicCurrentPage = updateProgress;

export async function updateComicFilters(
  id: string,
  filters: ImageFilterSettings
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("comics", "readwrite");
  const store = tx.objectStore("comics");
  const comic = await store.get(id);

  if (comic) {
    comic.filterSettings = filters;
    await store.put(comic);
  }
  await tx.done;
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const db = await getDB();
  const tx = db.transaction("comics", "readwrite");
  const store = tx.objectStore("comics");
  const comic = await store.get(id);

  if (comic) {
    comic.isFavorite = !comic.isFavorite;
    await store.put(comic);
    await tx.done;
    return comic.isFavorite;
  }
  return false;
}

/* ==========================================================================
   CRUD Y OPERACIONES DE COLECCIONES
   ========================================================================== */

export async function saveCollection(collection: CustomCollection): Promise<void> {
  const db = await getDB();
  await db.put("collections", collection);
}

export async function getAllCollections(): Promise<CustomCollection[]> {
  const db = await getDB();
  return db.getAllFromIndex("collections", "by-date");
}

export async function deleteCollection(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("collections", id);
}

export async function addComicToCollection(
  collectionId: string,
  comicId: string
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("collections", "readwrite");
  const store = tx.objectStore("collections");
  const collection = await store.get(collectionId);

  if (collection && !collection.comicIds.includes(comicId)) {
    collection.comicIds.push(comicId);
    await store.put(collection);
  }
  await tx.done;
}

export async function removeComicFromCollection(
  collectionId: string,
  comicId: string
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("collections", "readwrite");
  const store = tx.objectStore("collections");
  const collection = await store.get(collectionId);

  if (collection) {
    collection.comicIds = collection.comicIds.filter((id) => id !== comicId);
    await store.put(collection);
  }
  await tx.done;
}

/* ==========================================================================
   CRUD Y OPERACIONES DE MARCADORES Y ANOTACIONES
   ========================================================================== */

export async function saveBookmark(bookmark: ComicBookmark): Promise<void> {
  const db = await getDB();
  await db.put("bookmarks", bookmark);
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("bookmarks", id);
}

export async function getBookmarksByComic(comicId: string): Promise<ComicBookmark[]> {
  const db = await getDB();
  const list = await db.getAllFromIndex("bookmarks", "by-comic", comicId);
  return list.sort((a, b) => a.pageIndex - b.pageIndex);
}

export async function saveAnnotation(annotation: ComicAnnotation): Promise<void> {
  const db = await getDB();
  await db.put("annotations", annotation);
}

export async function deleteAnnotation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("annotations", id);
}

export async function getAnnotationsByComic(comicId: string): Promise<ComicAnnotation[]> {
  const db = await getDB();
  return db.getAllFromIndex("annotations", "by-comic", comicId);
}