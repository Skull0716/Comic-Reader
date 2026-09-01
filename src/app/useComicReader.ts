"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";
import { unrar, UnrarFileEntry } from "unrar-promise";

export function useComicReader() {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImageFile = (name: string) => /\.(jpe?g|png|webp|avif)$/i.test(name);

  const naturalSort = (a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    pages.forEach((url) => URL.revokeObjectURL(url)); // Limpieza de memoria previa

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let extractedUrls: string[] = [];

      if (ext === "cbz" || ext === "zip") {
        const zip = await JSZip.loadAsync(file);
        const entries = Object.keys(zip.files)
          .filter((name) => !zip.files[name].dir && isImageFile(name))
          .sort(naturalSort);

        extractedUrls = await Promise.all(
          entries.map(async (name) => {
            const blob = await zip.files[name].async("blob");
            return URL.createObjectURL(blob);
          })
        );
      } else if (ext === "cbr" || ext === "rar") {
        const buffer = await file.arrayBuffer();
        const extracted = await unrar(buffer) as UnrarFileEntry[];
        
        const validEntries = extracted
          .filter((item: UnrarFileEntry) => isImageFile(item.name))
          .sort((a, b) => naturalSort(a.name, b.name));

        extractedUrls = validEntries.map((item: UnrarFileEntry) => {
            const arrayBuffer = item.fileData.buffer.slice(item.fileData.byteOffset, item.fileData.byteOffset + item.fileData.byteLength
        )as ArrayBuffer;
            const blob = new Blob([arrayBuffer]);
            return URL.createObjectURL(blob);
        });
      } else {
        throw new Error("Formato no compatible. Sube un archivo .cbz o .cbr.");
      }

      if (extractedUrls.length === 0) {
        throw new Error("No se encontraron imágenes válidas dentro del archivo.");
      }

      setPages(extractedUrls);
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        }else {
            setError("Error desconocido al procesar el archivo.");
        }
    } finally {
      setLoading(false);
    }
  }, [pages]);

  return { pages, loading, error, loadFile };
}
