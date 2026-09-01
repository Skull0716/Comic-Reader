// app/api/archive/download/route.ts
import { NextRequest, NextResponse } from "next/server";

interface ArchiveMetadataFile {
  name?: string;
  format?: string;
  size?: string;
}

interface ArchiveMetadataResponse {
  result?: ArchiveMetadataFile[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get("id");
  const specificFile = searchParams.get("file"); // Permite pedir un tomo específico si viene en la query

  if (!identifier) {
    return NextResponse.json({ error: "Parámetro 'id' es requerido" }, { status: 400 });
  }

  try {
    const metaRes = await fetch(`https://archive.org/metadata/${identifier}/files`, {
      headers: { "User-Agent": "ComicWebReader/2.0" },
    });

    if (!metaRes.ok) {
      return NextResponse.json({ error: "No se pudieron obtener los archivos del cómic" }, { status: 404 });
    }

    const metaData: ArchiveMetadataResponse = await metaRes.json();
    const files = metaData.result || [];

    // Filtrar todos los archivos de cómic válidos en el registro
    const validComicFiles = files.filter((f) => {
      const name = f.name?.toLowerCase() || "";
      const fmt = f.format?.toLowerCase() || "";
      return (
        name.endsWith(".cbz") ||
        name.endsWith(".cbr") ||
        fmt === "comic book zip" ||
        fmt === "comic book rar" ||
        (name.endsWith(".zip") && !name.includes("_jp2") && !name.includes("meta") && !name.includes("thumb"))
      );
    });

    if (validComicFiles.length === 0) {
      return NextResponse.json(
        { error: "Este título no cuenta con archivos .cbz o .cbr descargables." },
        { status: 404 }
      );
    }

    let selectedFile: ArchiveMetadataFile | undefined;

    if (specificFile) {
      selectedFile = validComicFiles.find((f) => f.name === specificFile);
    }

    // 1. Si hay un archivo que explícitamente es el pack completo (contiene "complete", "all", "1-50", etc.)
    if (!selectedFile) {
      selectedFile = validComicFiles.find((f) => {
        const n = f.name?.toLowerCase() || "";
        return n.includes("complete") || n.includes("pack") || n.includes("collection");
      });
    }

    // 2. Si no hay pack unificado, tomar el primer tomo disponible
    if (!selectedFile) {
      selectedFile = validComicFiles[0];
    }

    const downloadUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(selectedFile.name!)}`;
    const fileRes = await fetch(downloadUrl, {
      headers: { "User-Agent": "ComicWebReader/2.0" },
    });

    if (!fileRes.ok || !fileRes.body) {
      return NextResponse.json({ error: "Error al transferir el archivo desde el servidor" }, { status: 502 });
    }

    // Limpiar el nombre para el registro local
    const cleanFileName = selectedFile.name!.replace(/\.(cbz|cbr|zip|rar)$/i, "");

    return new NextResponse(fileRes.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(selectedFile.name!)}"`,
        "X-Comic-Filename": encodeURIComponent(cleanFileName),
        "X-Total-Volumes": validComicFiles.length.toString(),
        ...(fileRes.headers.get("content-length") && {
          "Content-Length": fileRes.headers.get("content-length")!,
        }),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar descarga";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}