// types/bookmarks.ts
export interface ComicAnnotation {
  id: string;
  comicId: string;
  pageIndex: number;
  // Coordenadas relativas en porcentaje (0% a 100%) para que no se desplace al redimensionar o hacer zoom
  xPercent: number; 
  yPercent: number;
  content: string;
  createdAt: number;
}

export interface ComicBookmark {
  id: string;
  comicId: string;
  pageIndex: number;
  note?: string;
  createdAt: number;
}