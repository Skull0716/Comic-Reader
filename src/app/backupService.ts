// lib/backupService.ts
import { getAllComics, saveComic, getDB, ComicRecord } from "./db";
import { LibraryBackupSchema, ComicBackupItem } from "./types/backup";

const BACKUP_VERSION = 1;

/**
 * Genera y descarga un archivo .json con todos los progresos y metadatos
 */
export async function exportLibraryBackup(): Promise<void> {
  const comics = await getAllComics();

  const backupData: LibraryBackupSchema = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    totalComics: comics.length,
    comics: comics.map((c) => ({
      id: c.id,
      title: c.title,
      totalPages: c.totalPages,
      currentPage: c.currentPage,
      isFavorite: (c as ComicRecord & { isFavorite?: boolean }).isFavorite ?? false,
      addedAt: c.addedAt,
      metadata: c.metadata,
      filterSettings: c.filterSettings,
    })),
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `comic_reader_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo .json y restaura progresos/metadatos fusionándolos con los cómics locales
 */
export async function restoreLibraryBackup(file: File): Promise<{
  restoredCount: number;
  unmatchedCount: number;
}> {
  const text = await file.text();
  const backup: LibraryBackupSchema = JSON.parse(text);

  if (!backup.version || !Array.isArray(backup.comics)) {
    throw new Error("Formato de archivo de respaldo no válido");
  }

  const db = await getDB();
  const existingComics = await getAllComics();
  const existingMap = new Map<string, ComicRecord>();

  // Mapear tanto por ID como por Título normalizado para emparejar
  existingComics.forEach((c) => {
    existingMap.set(c.id, c);
    existingMap.set(c.title.toLowerCase().trim(), c);
  });

  let restoredCount = 0;
  let unmatchedCount = 0;

  for (const backupItem of backup.comics) {
    const matched =
      existingMap.get(backupItem.id) ||
      existingMap.get(backupItem.title.toLowerCase().trim());

    if (matched) {
      matched.currentPage = backupItem.currentPage;
      (matched as ComicRecord & { isFavorite?: boolean }).isFavorite =
        backupItem.isFavorite;
      if (backupItem.filterSettings) {
        matched.filterSettings = backupItem.filterSettings;
      }
      if (backupItem.metadata) {
        matched.metadata = { ...matched.metadata, ...backupItem.metadata };
      }

      await saveComic(matched);
      restoredCount++;
    } else {
      unmatchedCount++;
    }
  }

  return { restoredCount, unmatchedCount };
}