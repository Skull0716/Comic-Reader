import {
  getDB,
  enqueueSync,
  getPendingSyncItems,
  clearSyncQueue,
  ComicRecord,
  PendingSyncItem,
} from "./db";
import { createClient } from "@supabase/supabase-js";

// Instancia del cliente de Supabase usando las variables de entorno de Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RemoteReadingData {
  user_id: string;
  comic_id: string;
  current_page: number;
  is_favorite: boolean;
  updated_at: string;
}
/**
 * Obtiene el usuario actual o crea una sesión anónima automática si no existe.
 */
async function getOrCreateUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  // Si no hay usuario, iniciamos sesión anónima de inmediato
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("[Sync] Error al iniciar sesión anónima:", error.message);
    return null;
  }
  return data.user;
}
/**
 * Guarda el progreso o favorito de forma local e intenta sincronizarlo con Supabase.
 * Si no hay conexión o falla la red, se almacena en `sync_queue` sin bloquear la UI.
 */
export async function syncProgressAndFavorite(
  comicId: string,
  currentPage?: number,
  isFavorite?: boolean
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("comics", "readwrite");
  const store = tx.objectStore("comics");
  const comic = await store.get(comicId);

  if (!comic) {
    await tx.done;
    return;
  }

  const now = Date.now();
  if (typeof currentPage === "number") {
    comic.currentPage = currentPage;
    comic.lastReadAt = now;
  }
  if (typeof isFavorite === "boolean") {
    comic.isFavorite = isFavorite;
  }
  comic.updatedAt = now;

  // 1. Persistencia local inmediata en IndexedDB
  await store.put(comic);
  await tx.done;

  const mutation: Omit<PendingSyncItem, "id"> = {
    comicId,
    currentPage: comic.currentPage,
    isFavorite: Boolean(comic.isFavorite),
    updatedAt: now,
  };

  // 2. Si estamos sin conexión a internet, encolar directo
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueueSync(mutation);
    return;
  }

  // 3. Intento de subida a Supabase
  try {
    const user = await getOrCreateUser();
    if (!user) {
      // ⚠️ Ajuste clave: si no hay sesión o falló la conexión, encolar en local
      await enqueueSync(mutation);
      return;
    }

    const { error } = await supabase.from("reading_sync").upsert(
      {
        user_id: user.id,
        comic_id: comicId,
        current_page: comic.currentPage,
        is_favorite: Boolean(comic.isFavorite),
        updated_at: new Date(now).toISOString(),
      },
      { onConflict: "user_id,comic_id" }
    );

    if (error) {
      console.warn("[Sync] Error al enviar a Supabase, encolando:", error.message);
      await enqueueSync(mutation);
    }
  } catch (err) {
    console.warn("[Sync] Fallo de red inesperado, encolando mutación:", err);
    await enqueueSync(mutation);
  }
}

/**
 * Vacía la cola de sincronización pendiente (outbox queue).
 * Agrupa por `comic_id` conservando la mutación con el timestamp más reciente.
 */
export async function flushSyncQueue(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const pendingItems = await getPendingSyncItems();
  if (!pendingItems || pendingItems.length === 0) return;

  try {
const user = await getOrCreateUser();
if (!user) return;

    // Deduplicar: quedarnos con la última acción de cada cómic
    const latestByComic = new Map<string, PendingSyncItem>();
    for (const item of pendingItems) {
      const existing = latestByComic.get(item.comicId);
      if (!existing || item.updatedAt > existing.updatedAt) {
        latestByComic.set(item.comicId, item);
      }
    }

    const payload: RemoteReadingData[] = Array.from(latestByComic.values()).map(
      (item) => ({
        user_id: user.id,
        comic_id: item.comicId,
        current_page: item.currentPage,
        is_favorite: item.isFavorite,
        updated_at: new Date(item.updatedAt).toISOString(),
      })
    );

    const { error } = await supabase.from("reading_sync").upsert(payload, {
      onConflict: "user_id,comic_id",
    });

    if (!error) {
      await clearSyncQueue();
    } else {
      console.error("[Sync] Error procesando flushSyncQueue:", error.message);
    }
  } catch (err) {
    console.error("[Sync] Fallo al vaciar la cola de sincronización:", err);
  }
}

/**
 * Descarga el progreso remoto desde Supabase y actualiza IndexedDB localmente.
 * Aplica Last-Write-Wins: solo sobrescribe el registro local si el dato remoto es más reciente.
 * 
 * @returns boolean indicando si hubo algún cambio aplicado localmente.
 */
export async function pullRemoteProgress(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;

  try {
const user = await getOrCreateUser();
if (!user) return false;

    const { data: remoteRows, error } = await supabase
      .from("reading_sync")
      .select("user_id, comic_id, current_page, is_favorite, updated_at")
      .eq("user_id", user.id);

    if (error || !remoteRows || remoteRows.length === 0) return false;

    const db = await getDB();
    const tx = db.transaction("comics", "readwrite");
    const store = tx.objectStore("comics");

    let hasLocalUpdates = false;

    for (const row of remoteRows as RemoteReadingData[]) {
      const localComic = await store.get(row.comic_id);
      if (!localComic) {
        // El usuario leyó este cómic en otro dispositivo, pero el archivo no está en este equipo
        continue;
      }

      const remoteTime = new Date(row.updated_at).getTime();
      const localTime = localComic.updatedAt || localComic.lastReadAt || 0;

      // Resolución de conflictos: Last-Write-Wins
      if (remoteTime > localTime) {
        localComic.currentPage = row.current_page;
        localComic.isFavorite = row.is_favorite;
        localComic.updatedAt = remoteTime;
        localComic.lastReadAt = remoteTime;
        await store.put(localComic);
        hasLocalUpdates = true;
      }
    }

    await tx.done;
    return hasLocalUpdates;
  } catch (err) {
    console.error("[Sync] Error ejecutando pullRemoteProgress:", err);
    return false;
  }
}