// src/app/utils/opdsParser.ts
export interface OPDSEntry {
  id: string;
  title: string;
  summary?: string;
  updated?: string;
  coverUrl?: string;
  navLink?: string;       // Si es una carpeta o serie
  downloadLink?: string;  // Si es un cómic descargable
  fileType?: string;
}

export function parseOPDSXml(xmlText: string, baseUrl: string): { title: string; entries: OPDSEntry[] } {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");

  const feedTitle = xml.querySelector("feed > title")?.textContent || "Catálogo OPDS";
  const entryNodes = xml.querySelectorAll("entry");
  const entries: OPDSEntry[] = [];

  entryNodes.forEach((node) => {
    const id = node.querySelector("id")?.textContent || Math.random().toString();
    const title = node.querySelector("title")?.textContent || "Sin título";
    const summary = node.querySelector("summary, content")?.textContent || undefined;
    const updated = node.querySelector("updated")?.textContent || undefined;

    let coverUrl: string | undefined;
    let navLink: string | undefined;
    let downloadLink: string | undefined;
    let fileType: string | undefined;

    const links = node.querySelectorAll("link");
    links.forEach((link) => {
      const rel = link.getAttribute("rel") || "";
      const type = link.getAttribute("type") || "";
      const href = link.getAttribute("href") || "";

      const resolvedUrl = new URL(href, baseUrl).toString();

      if (rel.includes("image") || rel.includes("thumbnail") || type.startsWith("image/")) {
        coverUrl = resolvedUrl;
      } else if (rel.includes("acquisition")) {
        downloadLink = resolvedUrl;
        fileType = type;
      } else if (rel.includes("subsection") || type.includes("atom+xml")) {
        navLink = resolvedUrl;
      }
    });

    entries.push({
      id,
      title,
      summary,
      updated,
      coverUrl,
      navLink,
      downloadLink,
      fileType,
    });
  });

  return { title: feedTitle, entries };
}