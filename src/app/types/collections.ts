// types/collections.ts
import { ComicRecord } from "../db";

export interface CustomCollection {
  id: string;
  name: string;
  description?: string;
  comicIds: string[];
  createdAt: number;
}

// Representa un elemento renderizable en el grid principal (un cómic suelto o una serie/carpeta)
export interface LibraryGridGroup {
  type: "single" | "series" | "custom-collection";
  id: string;
  title: string;
  coverComic: ComicRecord;
  items: ComicRecord[];
  totalVolumes: number;
  unreadCount: number;
}