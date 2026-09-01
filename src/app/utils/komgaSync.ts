// src/app/utils/komgaSync.ts
import { OPDSServerConfig } from "../types/opds";

interface SyncProgressParams {
  comicId: string; // ej. opds-12345 o id con bookId de Komga
  pageNumber: number; // 1-indexed para Komga
  completed: boolean;
  server?: OPDSServerConfig;
}

export async function syncProgressToKomga({
  comicId,
  pageNumber,
  completed,
  server,
}: SyncProgressParams): Promise<boolean> {
  if (!server || !comicId) return false;

  // Extraer el bookId real de Komga (normalmente viene en la URL o ID del feed)
  const match = comicId.match(/books\/([a-zA-Z0-9_-]+)/) || comicId.match(/opds-[0-9]+-([a-zA-Z0-9]+)/);
  const bookId = match ? match[1] : null;

  if (!bookId) return false;

  try {
    const baseKomgaUrl = server.url.replace(/\/opds\/.*$/, "");
    const endpoint = `${baseKomgaUrl}/api/v1/books/${bookId}/read-progress`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (server.username && server.password) {
      const basicAuth = btoa(`${server.username}:${server.password}`);
      headers["Authorization"] = `Basic ${basicAuth}`;
    }

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        page: pageNumber,
        completed,
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn("No se pudo sincronizar el progreso con el servidor Komga:", error);
    return false;
  }
}