// app/api/opds/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido (JSON esperado)" }, { status: 400 });
    }

    const { targetUrl, username, password, isDownload, isImage } = body || {};

    if (!targetUrl || typeof targetUrl !== "string" || !targetUrl.trim()) {
      return NextResponse.json({ error: "Debes ingresar una URL válida para el servidor OPDS." }, { status: 400 });
    }

    // Validar formato de URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl.trim());
    } catch {
      return NextResponse.json({ error: `La URL '${targetUrl}' no tiene un formato válido (ej. http://192.168.1.50:25600/opds/v1.2/catalog)` }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "User-Agent": "ComicWebReader/2.0 (OPDS Client)",
      Accept: isDownload
        ? "*/*"
        : isImage
        ? "image/*,*/*"
        : "application/atom+xml,application/xml,text/xml,*/*",
    };

    if (username && password) {
      const auth = Buffer.from(`${username}:${password}`).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    }

    // Timeout de 15 segundos para evitar peticiones colgadas
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (networkErr: unknown) {
      clearTimeout(timeout);
      const isAbort = networkErr instanceof Error && networkErr.name === "AbortError";
      const detail = networkErr instanceof Error ? networkErr.message : "Error de red";
      return NextResponse.json(
        {
          error: isAbort
            ? "Tiempo de espera agotado al intentar conectar con el servidor OPDS (Timeout 15s)."
            : `No se pudo alcanzar el servidor (${parsedUrl.origin}): ${detail}. Verifica que el servidor esté encendido y la IP/puerto sean correctos.`,
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorMsg =
        response.status === 401
          ? "Credenciales incorrectas (Usuario o Contraseña no válidos en el servidor OPDS)."
          : response.status === 404
          ? `Ruta no encontrada en el servidor (${response.status}). Verifica el path del catálogo OPDS.`
          : `El servidor OPDS respondió con error: ${response.status} ${response.statusText}`;

      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    // 1. Descargas de cómic (.cbz/.cbr) por stream
    if (isDownload) {
      const responseHeaders: Record<string, string> = {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": response.headers.get("Content-Disposition") || "attachment",
      };

      const contentLength = response.headers.get("Content-Length");
      if (contentLength) {
        responseHeaders["Content-Length"] = contentLength;
      }

      return new NextResponse(response.body, {
        headers: responseHeaders,
      });
    }

    // 2. Portadas e imágenes
    if (isImage || response.headers.get("Content-Type")?.startsWith("image/")) {
      const imgBuffer = await response.arrayBuffer();
      return new NextResponse(imgBuffer, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 3. Catálogo XML / Atom Feed
    const xmlText = await response.text();
    return new NextResponse(xmlText, {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno procesando OPDS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}