// lib/groupComics.ts
import { ComicRecord } from "./db";
import { LibraryGridGroup } from "./types/collections";

export function groupComicsIntoSeries(comics: ComicRecord[]): LibraryGridGroup[] {
  const seriesMap = new Map<string, ComicRecord[]>();
  const singles: ComicRecord[] = [];

  // 1. Separar los que pertenecen a una Serie conocida
  comics.forEach((comic) => {
    const seriesName = comic.metadata?.series?.trim();
    if (seriesName) {
      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, []);
      }
      seriesMap.get(seriesName)!.push(comic);
    } else {
      singles.push(comic);
    }
  });

  const result: LibraryGridGroup[] = [];

  // 2. Procesar Series
  seriesMap.forEach((items, seriesName) => {
    // Ordenar tomos/issues por número de volumen o número de entrega
    items.sort((a, b) => {
      const volA = a.metadata?.volume ?? parseFloat(a.metadata?.number || "0") ?? 0;
      const volB = b.metadata?.volume ?? parseFloat(b.metadata?.number || "0") ?? 0;
      return volA - volB;
    });

    const unreadCount = items.filter((c) => c.currentPage === 0).length;

    if (items.length > 1) {
      result.push({
        type: "series",
        id: `series-${seriesName.toLowerCase().replace(/\s+/g, "-")}`,
        title: seriesName,
        coverComic: items[0], // Portada del tomo 1
        items,
        totalVolumes: items.length,
        unreadCount,
      });
    } else {
      // Si la serie solo tiene 1 tomo, mostrarla como elemento individual
      singles.push(items[0]);
    }
  });

  // 3. Procesar Cómics individuales
  singles.forEach((comic) => {
    result.push({
      type: "single",
      id: comic.id,
      title: comic.title,
      coverComic: comic,
      items: [comic],
      totalVolumes: 1,
      unreadCount: comic.currentPage === 0 ? 1 : 0,
    });
  });

  return result;
}