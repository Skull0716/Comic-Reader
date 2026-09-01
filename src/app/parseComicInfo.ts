// lib/parseComicInfo.ts
import JSZip from "jszip";
import { ComicMetadata } from "./types/comicInfo";

/**
 * Busca y parsea el archivo ComicInfo.xml dentro de un archivo CBZ/ZIP
 */
export async function extractComicInfo(file: File | Blob): Promise<ComicMetadata | null> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Buscar ComicInfo.xml sin importar si está en raíz o con mayúsculas/minúsculas
    const comicInfoKey = Object.keys(zip.files).find((name) =>
      name.toLowerCase().endsWith("comicinfo.xml")
    );

    if (!comicInfoKey) {
      return null; // El CBZ no incluye metadatos ComicInfo.xml
    }

    const xmlText = await zip.files[comicInfoKey].async("text");
    return parseComicInfoXml(xmlText);
  } catch (error) {
    console.warn("No se pudo leer ComicInfo.xml:", error);
    return null;
  }
}

/**
 * Parsea el string XML a un objeto estructurado usando el DOMParser del navegador
 */
export function parseComicInfoXml(xmlString: string): ComicMetadata {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  // Helper para obtener texto limpio de una etiqueta
  const getText = (tagName: string): string | undefined => {
    const el = xmlDoc.getElementsByTagName(tagName)[0];
    const text = el?.textContent?.trim();
    return text && text.length > 0 ? text : undefined;
  };

  const getNumber = (tagName: string): number | undefined => {
    const text = getText(tagName);
    if (!text) return undefined;
    const num = Number(text);
    return isNaN(num) ? undefined : num;
  };

  const mangaTag = getText("Manga");
  const isManga = mangaTag === "Yes" || mangaTag === "YesAndRightToLeft";

  return {
    title: getText("Title"),
    series: getText("Series"),
    number: getText("Number"),
    volume: getNumber("Volume"),
    summary: getText("Summary") || getText("Notes"),
    writer: getText("Writer"),
    penciller: getText("Penciller"),
    letterer: getText("Letterer"),
    coverArtist: getText("CoverArtist"),
    genre: getText("Genre"),
    year: getNumber("Year"),
    month: getNumber("Month"),
    pageCount: getNumber("PageCount"),
    publisher: getText("Publisher"),
    manga: isManga,
  };
}