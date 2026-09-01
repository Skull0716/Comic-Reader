// src/app/extractPages.ts
import JSZip from "jszip";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|bmp)$/i;

/**
 * Extrae y ordena naturalmente todas las páginas de un archivo Blob (.cbz / .zip)
 */
export async function extractPagesFromBlob(blob: Blob): Promise<string[]> {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(blob);

    // Filtrar archivos de imagen válidos e ignorar basura de sistemas (macOS / miniaturas ocultas)
    const imageFiles = Object.keys(contents.files).filter((filename) => {
      const file = contents.files[filename];
      return (
        !file.dir &&
        !filename.startsWith("__MACOSX/") &&
        !filename.includes("/.") &&
        !filename.startsWith(".") &&
        IMAGE_EXTENSIONS.test(filename)
      );
    });

    if (imageFiles.length === 0) {
      throw new Error("No se encontraron imágenes válidas dentro del archivo comprimido.");
    }

    // Ordenamiento natural (ej. page1, page2, page10 en lugar de page1, page10, page2)
    imageFiles.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    // Generar ObjectURLs en memoria para el visor
    const pageUrls: string[] = [];
    for (const filename of imageFiles) {
      const fileData = await contents.files[filename].async("blob");
      const url = URL.createObjectURL(fileData);
      pageUrls.push(url);
    }

    return pageUrls;
  } catch (err) {
    console.error("Error al extraer páginas del cómic:", err);
    throw err;
  }
}