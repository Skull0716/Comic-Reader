// workers/comic.worker.ts
import JSZip from "jszip";
import { Archive } from "libarchive.js";

Archive.init({
  workerUrl: "/libarchive/worker-bundle.js",
});

export interface ComicMetadata {
  title?: string;
  series?: string;
  number?: string;
  volume?: number;
  summary?: string;
  writer?: string;
  penciller?: string;
  letterer?: string;
  coverArtist?: string;
  genre?: string;
  year?: number;
  month?: number;
  pageCount?: number;
  publisher?: string;
  manga?: boolean;
}

export type WorkerAction = "EXTRACT_METADATA" | "EXTRACT_ALL_PAGES";

export interface WorkerInputPayload {
  action: WorkerAction;
  buffer: ArrayBuffer;
  fileName: string;
  comicId?: string;
}

export interface WorkerOutputPayload {
  action: WorkerAction;
  comicId?: string;
  success: boolean;
  metadata?: ComicMetadata;
  coverBlob?: Blob;
  totalPages?: number;
  pages?: Blob[];
  error?: string;
  progress?: number;
}

const isImageFile = (name: string): boolean =>
  /\.(jpe?g|png|webp|avif|gif|bmp|jp2|j2k|tiff?)$/i.test(name);

const isCleanPath = (path: string): boolean =>
  !path.includes("__MACOSX") &&
  !path.split("/").some((part) => part.startsWith("."));

const naturalSort = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

function parseComicInfoXmlWorkerSafe(xmlString: string): ComicMetadata {
  const getTagValue = (tagName: string): string | undefined => {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = xmlString.match(regex);
    const val = match?.[1]?.trim();
    return val && val.length > 0 ? val : undefined;
  };

  const getNumber = (tagName: string): number | undefined => {
    const val = getTagValue(tagName);
    if (!val) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const mangaTag = getTagValue("Manga");
  const isManga = mangaTag === "Yes" || mangaTag === "YesAndRightToLeft";

  return {
    title: getTagValue("Title"),
    series: getTagValue("Series"),
    number: getTagValue("Number"),
    volume: getNumber("Volume"),
    summary: getTagValue("Summary") || getTagValue("Notes"),
    writer: getTagValue("Writer"),
    penciller: getTagValue("Penciller"),
    letterer: getTagValue("Letterer"),
    coverArtist: getTagValue("CoverArtist"),
    genre: getTagValue("Genre"),
    year: getNumber("Year"),
    month: getNumber("Month"),
    pageCount: getNumber("PageCount"),
    publisher: getTagValue("Publisher"),
    manga: isManga,
  };
}

// -------------------------------------------------------------
// 1. EXTRACCIÓN CON JSZIP (CBZ / ZIP)
// -------------------------------------------------------------
async function extractWithZip(
  buffer: ArrayBuffer,
  action: WorkerAction,
  comicId?: string
): Promise<boolean> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const allFiles = Object.keys(zip.files).filter(
      (name) => !zip.files[name].dir && isCleanPath(name)
    );

    let imageKeys = allFiles.filter(isImageFile).sort(naturalSort);

    const nestedArchives = allFiles
      .filter((n) => /\.(cbz|cbr|zip|rar)$/i.test(n))
      .sort(naturalSort);

    // CASO A: Pack con cómics anidados
    if (nestedArchives.length > 0 && imageKeys.length === 0) {
      if (action === "EXTRACT_METADATA") {
        const firstBuffer = await zip.files[nestedArchives[0]].async("arraybuffer");
        let coverBlob: Blob | undefined;
        const estimatedPages = nestedArchives.length * 24;

        try {
          const subZip = await JSZip.loadAsync(firstBuffer);
          const subImages = Object.keys(subZip.files)
            .filter((n) => !subZip.files[n].dir && isCleanPath(n) && isImageFile(n))
            .sort(naturalSort);

          if (subImages.length > 0) {
            const rawBlob = await subZip.files[subImages[0]].async("blob");
            coverBlob = new Blob([rawBlob], { type: getMimeType(subImages[0]) });
          }
        } catch {
          // CBR anidado
        }

        self.postMessage({
          action,
          comicId,
          success: true,
          coverBlob,
          totalPages: estimatedPages,
        } as WorkerOutputPayload);
        return true;
      }

      if (action === "EXTRACT_ALL_PAGES") {
        const allPages: Blob[] = [];

        for (let i = 0; i < nestedArchives.length; i++) {
          const subBuffer = await zip.files[nestedArchives[i]].async("arraybuffer");
          try {
            const subZip = await JSZip.loadAsync(subBuffer);
            const subImages = Object.keys(subZip.files)
              .filter((n) => !subZip.files[n].dir && isCleanPath(n) && isImageFile(n))
              .sort(naturalSort);

            for (const imgName of subImages) {
              const rawBlob = await subZip.files[imgName].async("blob");
              allPages.push(new Blob([rawBlob], { type: getMimeType(imgName) }));
            }
          } catch {
            // Ignorar archivo corrupto en pack
          }

          self.postMessage({
            action,
            comicId,
            success: true,
            progress: Math.round(((i + 1) / nestedArchives.length) * 100),
          } as WorkerOutputPayload);
        }

        if (allPages.length === 0) {
          throw new Error("No se pudieron extraer imágenes legibles.");
        }

        self.postMessage({
          action,
          comicId,
          success: true,
          pages: allPages,
        } as WorkerOutputPayload);
        return true;
      }
    }

    // CASO B: Cómic individual
    if (imageKeys.length === 0) {
      imageKeys = allFiles
        .filter((n) => !/\.(xml|txt|json|nfo|sfv|acbf)$/i.test(n))
        .sort(naturalSort);
    }

    if (imageKeys.length === 0) return false;

    // Metadatos
    let metadata: ComicMetadata | undefined = undefined;
    const xmlKey = Object.keys(zip.files).find((name) =>
      name.toLowerCase().endsWith("comicinfo.xml")
    );

    if (xmlKey) {
      const xmlText = await zip.files[xmlKey].async("text");
      metadata = parseComicInfoXmlWorkerSafe(xmlText);
    }

    // Acción: Metadatos
    if (action === "EXTRACT_METADATA") {
      const rawCover = await zip.files[imageKeys[0]].async("blob");
      const coverBlob = new Blob([rawCover], { type: getMimeType(imageKeys[0]) });

      self.postMessage({
        action,
        comicId,
        success: true,
        coverBlob,
        totalPages: imageKeys.length,
        metadata,
      } as WorkerOutputPayload);
      return true;
    }

    // Acción: Todas las páginas
    if (action === "EXTRACT_ALL_PAGES") {
      const pagesBlobs: Blob[] = [];

      for (let i = 0; i < imageKeys.length; i++) {
        const rawBlob = await zip.files[imageKeys[i]].async("blob");
        const typedBlob = new Blob([rawBlob], { type: getMimeType(imageKeys[i]) });
        pagesBlobs.push(typedBlob);

        if ((i + 1) % 5 === 0 || i === imageKeys.length - 1) {
          self.postMessage({
            action,
            comicId,
            success: true,
            progress: Math.round(((i + 1) / imageKeys.length) * 100),
          } as WorkerOutputPayload);
        }
      }

      self.postMessage({
        action,
        comicId,
        success: true,
        pages: pagesBlobs,
      } as WorkerOutputPayload);
      return true;
    }

    return true;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// 2. EXTRACCIÓN CON LIBARCHIVE (CBR / RAR / 7Z)
// -------------------------------------------------------------
async function extractWithLibarchive(
  file: File,
  action: WorkerAction,
  comicId?: string
) {
  const archive = await Archive.open(file);
  const entries = await archive.getFilesArray();

  let metadata: ComicMetadata | undefined = undefined;
  const xmlEntry = entries.find((entry) =>
    entry.file.name.toLowerCase().endsWith("comicinfo.xml")
  );

  if (xmlEntry) {
    const xmlFile = await xmlEntry.file.extract();
    const xmlText = await xmlFile.text();
    metadata = parseComicInfoXmlWorkerSafe(xmlText);
  }

  const cleanEntries = entries.filter((e) => isCleanPath(e.file.name));

  let imageEntries = cleanEntries
    .filter((entry) => isImageFile(entry.file.name))
    .sort((a, b) => naturalSort(a.file.name, b.file.name));

  if (imageEntries.length === 0) {
    imageEntries = cleanEntries
      .filter((entry) => !/\.(xml|txt|json|nfo|sfv|acbf)$/i.test(entry.file.name))
      .sort((a, b) => naturalSort(a.file.name, b.file.name));
  }

  if (imageEntries.length === 0) {
    throw new Error("No se encontraron páginas legibles en el archivo comprimido.");
  }

  if (action === "EXTRACT_METADATA") {
    const coverExtracted = await imageEntries[0].file.extract();
    const coverBlob = new Blob([await coverExtracted.arrayBuffer()], {
      type: getMimeType(imageEntries[0].file.name),
    });

    self.postMessage({
      action,
      comicId,
      success: true,
      coverBlob,
      totalPages: imageEntries.length,
      metadata,
    } as WorkerOutputPayload);
    return;
  }

  if (action === "EXTRACT_ALL_PAGES") {
    const pagesBlobs: Blob[] = [];

    for (let i = 0; i < imageEntries.length; i++) {
      const extracted = await imageEntries[i].file.extract();
      const blob = new Blob([await extracted.arrayBuffer()], {
        type: getMimeType(imageEntries[i].file.name),
      });
      pagesBlobs.push(blob);

      if ((i + 1) % 5 === 0 || i === imageEntries.length - 1) {
        self.postMessage({
          action,
          comicId,
          success: true,
          progress: Math.round(((i + 1) / imageEntries.length) * 100),
        } as WorkerOutputPayload);
      }
    }

    self.postMessage({
      action,
      comicId,
      success: true,
      pages: pagesBlobs,
    } as WorkerOutputPayload);
  }
}

// -------------------------------------------------------------
// LISTENER PRINCIPAL
// -------------------------------------------------------------
self.onmessage = async (e: MessageEvent<WorkerInputPayload>) => {
  const { action, buffer, fileName, comicId } = e.data;

  try {
    if (!buffer || buffer.byteLength === 0) {
      throw new Error("El archivo recibido está vacío o corrupto.");
    }

    const zipSuccess = await extractWithZip(buffer, action, comicId);
    if (zipSuccess) return;

    const file = new File([buffer], fileName || "comic.cbr");
    await extractWithLibarchive(file, action, comicId);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Error al procesar el cómic en el worker";

    self.postMessage({
      action,
      comicId,
      success: false,
      error: errorMsg,
    } as WorkerOutputPayload);
  }
};