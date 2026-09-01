// src/lib/extractCover.ts (o src/app/extractCover.ts)
import JSZip from "jszip";
import { Archive } from "libarchive.js";

if (typeof window !== "undefined") {
  Archive.init({
    workerUrl: "/libarchive/worker-bundle.js",
  });
}

interface ArchiveEntryItem {
  file: {
    name: string;
    size?: number;
    extract: () => Promise<File>;
  };
}

// Regex amplio que incluye formatos de escaneos históricos y variantes
const isImageFileName = (n: string): boolean =>
  /\.(jpe?g|png|webp|avif|gif|bmp|jp2|j2k|tiff?)$/i.test(n);

const isCleanEntry = (path: string): boolean =>
  !path.includes("__MACOSX") &&
  !path.split("/").some((segment) => segment.startsWith("."));

const naturalSort = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

export async function extractMetadata(
  file: File
): Promise<{ coverBlob: Blob; totalPages: number }> {
  // -----------------------------------------------------------------
  // 1. INTENTO CON JSZip (CBZ / ZIP / Packs de cómics)
  // -----------------------------------------------------------------
  try {
    const zip = await JSZip.loadAsync(file);
    const allFiles = Object.keys(zip.files).filter(
      (name) => !zip.files[name].dir && isCleanEntry(name)
    );

    // Archivos de imagen directos
    let imageKeys = allFiles.filter(isImageFileName).sort(naturalSort);

    // Detección de Comic Packs (archivos .cbz, .cbr, .zip, .rar anidados dentro)
    const nestedArchives = allFiles
      .filter((n) => /\.(cbz|cbr|zip|rar)$/i.test(n))
      .sort(naturalSort);

    // CASO A: Es un pack de cómics con números anidados
    if (nestedArchives.length > 0 && imageKeys.length === 0) {
      const firstIssueBuffer = await zip.files[nestedArchives[0]].async("arraybuffer");
      let coverBlob: Blob | undefined;

      try {
        const nestedZip = await JSZip.loadAsync(firstIssueBuffer);
        const nestedImages = Object.keys(nestedZip.files)
          .filter((n) => !nestedZip.files[n].dir && isCleanEntry(n) && isImageFileName(n))
          .sort(naturalSort);

        if (nestedImages.length > 0) {
          coverBlob = await nestedZip.files[nestedImages[0]].async("blob");
        }
      } catch {
        // Si el tomo interno es RAR, libarchive en el worker se encargará durante la lectura
      }

      if (coverBlob) {
        // Estimación estándar: ~24 páginas por cada número del pack
        return { coverBlob, totalPages: nestedArchives.length * 24 };
      }
    }

    // CASO B: Cómic individual estándar
    if (imageKeys.length === 0) {
      imageKeys = allFiles
        .filter((n) => !/\.(xml|txt|json|nfo|sfv|acbf)$/i.test(n))
        .sort(naturalSort);
    }

    if (imageKeys.length > 0) {
      const coverBlob = await zip.files[imageKeys[0]].async("blob");
      return { coverBlob, totalPages: imageKeys.length };
    }
  } catch {
    // Si no es un ZIP válido, pasar a libarchive
  }

  // -----------------------------------------------------------------
  // 2. INTENTO CON libarchive.js (CBR / RAR / 7Z)
  // -----------------------------------------------------------------
  try {
    const archive = await Archive.open(file);
    const entries = (await archive.getFilesArray()) as unknown as ArchiveEntryItem[];

    const cleanEntries = entries.filter((item) => isCleanEntry(item.file.name));

    let validEntries = cleanEntries
      .filter((item) => isImageFileName(item.file.name))
      .sort((a, b) => naturalSort(a.file.name, b.file.name));

    if (validEntries.length === 0) {
      validEntries = cleanEntries
        .filter((item) => !/\.(xml|txt|json|nfo|sfv|acbf)$/i.test(item.file.name))
        .sort((a, b) => naturalSort(a.file.name, b.file.name));
    }

    if (validEntries.length > 0) {
      const firstEntry = validEntries[0].file;
      const extractedFile = await firstEntry.extract();
      const coverBlob = extractedFile.slice(
        0,
        extractedFile.size,
        extractedFile.type || "image/jpeg"
      );

      return { coverBlob, totalPages: validEntries.length };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al procesar archivo";
    console.warn("Fallo en libarchive:", msg);
  }

  throw new Error("No se encontraron imágenes compatibles dentro del archivo.");
}