// types/opds.ts
export interface OPDSLink {
  rel: string;
  href: string;
  type: string;
  title?: string;
}

export interface OPDSEntry {
  id: string;
  title: string;
  summary?: string;
  author?: string;
  updated?: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  downloadUrl?: string; // Enlace al archivo .cbz / .cbr
  navigationUrl?: string; // Enlace a un sub-feed (ej. tomos de una serie)
  isNavigation: boolean;
}

export interface OPDSFeed {
  title: string;
  id: string;
  updated?: string;
  entries: OPDSEntry[];
  nextPageUrl?: string;
}

export interface OPDSServerConfig {
  id: string;
  name: string; // ej. "Mi Komga Local"
  url: string;  // ej. "http://192.168.1.100:8080/opds/v1.2/catalog"
  username?: string;
  password?: string;
}