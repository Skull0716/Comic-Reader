// lib/parseOpds.ts
import { OPDSFeed, OPDSEntry, OPDSServerConfig } from "./types/opds";

export function parseOPDSXml(xmlString: string, baseUrl: string): OPDSFeed {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const feedTitle = xmlDoc.getElementsByTagName("title")[0]?.textContent || "Catálogo";
  const feedId = xmlDoc.getElementsByTagName("id")[0]?.textContent || "";

  const entryNodes = Array.from(xmlDoc.getElementsByTagName("entry"));

  const entries: OPDSEntry[] = entryNodes.map((entry) => {
    const id = entry.getElementsByTagName("id")[0]?.textContent || Math.random().toString();
    const title = entry.getElementsByTagName("title")[0]?.textContent || "Sin título";
    const summary = entry.getElementsByTagName("summary")[0]?.textContent || 
                    entry.getElementsByTagName("content")[0]?.textContent || undefined;
    const author = entry.getElementsByTagName("name")[0]?.textContent || undefined;

    const links = Array.from(entry.getElementsByTagName("link"));

    let coverUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    let downloadUrl: string | undefined;
    let navigationUrl: string | undefined;

    links.forEach((link) => {
      const rel = link.getAttribute("rel") || "";
      const type = link.getAttribute("type") || "";
      let href = link.getAttribute("href") || "";

      // Resolver URL relativa contra el servidor base
      if (href && !href.startsWith("http")) {
        href = new URL(href, baseUrl).toString();
      }

      if (rel.includes("image") || rel.includes("cover") || type.startsWith("image/")) {
        coverUrl = href;
      }
      if (rel.includes("thumbnail")) {
        thumbnailUrl = href;
      }
      // Archivo descargable (CBZ, CBR, EPUB, Octet-stream)
      if (
        rel === "http://opds-spec.org/acquisition" ||
        type.includes("zip") ||
        type.includes("comic") ||
        type.includes("rar") ||
        type.includes("octet-stream")
      ) {
        downloadUrl = href;
      }
      // Sub-catálogo (ej. Serie con tomos)
      if (
        type.includes("atom+xml") ||
        rel.includes("subsection") ||
        rel === "alternate"
      ) {
        navigationUrl = href;
      }
    });

    return {
      id,
      title,
      summary,
      author,
      coverUrl: coverUrl || thumbnailUrl,
      thumbnailUrl: thumbnailUrl || coverUrl,
      downloadUrl,
      navigationUrl,
      isNavigation: !!navigationUrl && !downloadUrl,
    };
  });

  return {
    title: feedTitle,
    id: feedId,
    entries,
  };
}