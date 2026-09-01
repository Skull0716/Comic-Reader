// types/backup.ts
import { ComicMetadata } from "./comicInfo";
import { ImageFilterSettings } from "./filters";

export interface ComicBackupItem {
  id: string;
  title: string;
  totalPages: number;
  currentPage: number;
  isFavorite?: boolean;
  addedAt: number;
  lastReadAt?: number;
  metadata?: ComicMetadata;
  filterSettings?: ImageFilterSettings;
}

export interface LibraryBackupSchema {
  version: number;
  exportedAt: string;
  totalComics: number;
  comics: ComicBackupItem[];
}