// types/comicInfo.ts
export interface ComicMetadata {
  title?: string;
  series?: string;
  number?: string;        // Número de entrega / issue
  volume?: number;        // Número de volumen
  summary?: string;       // Sinopsis corta o completa
  writer?: string;        // Guionista
  penciller?: string;     // Dibujante / Ilustrador
  letterer?: string;      // Rotulista
  coverArtist?: string;   // Artista de portada
  genre?: string;
  year?: number;
  month?: number;
  pageCount?: number;
  publisher?: string;
  manga?: boolean;        // Indicador si es manga (BlackAndWhite o Manga)
}