// app/api/archive/search/route.ts
import { NextRequest, NextResponse } from "next/server";

interface ArchiveDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  year?: string;
  description?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get("q") || "Spider-Man";
  const page = searchParams.get("page") || "1";
  const rows = searchParams.get("rows") || "40";

  // Limpiar caracteres extraños
  const cleanQuery = rawQuery.replace(/[/\\?%*:|"<>]/g, " ").trim();

  try {
    const searchUrl = new URL("https://archive.org/advancedsearch.php");

    // Búsqueda estricta: el título debe coincidir con la búsqueda y pertenecer a formato/colección de cómics
    searchUrl.searchParams.set(
      "q",
      `title:(${cleanQuery}) AND mediatype:(texts) AND (format:("Comic Book Zip") OR format:("CBZ") OR format:("CBR") OR format:("Comic Book RAR")) AND NOT title:(sample OR preview OR review)`
    );
    searchUrl.searchParams.set("fl[]", "identifier,title,creator,year,description,downloads");
    searchUrl.searchParams.set("sort[]", "downloads desc");
    searchUrl.searchParams.set("rows", rows);
    searchUrl.searchParams.set("page", page);
    searchUrl.searchParams.set("output", "json");

    const res = await fetch(searchUrl.toString(), {
      headers: { "User-Agent": "ComicWebReader/2.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Error en respuesta del servidor" }, { status: res.status });
    }

    const data = await res.json();
    const docs = (data.response?.docs as ArchiveDoc[]) || [];

    const results = docs.map((doc) => ({
      id: doc.identifier,
      title: doc.title || doc.identifier,
      creator: Array.isArray(doc.creator) ? doc.creator.join(", ") : doc.creator || "Desconocido",
      year: doc.year || "Clásico",
      description: doc.description || "Sin descripción disponible.",
      coverUrl: `https://archive.org/services/img/${doc.identifier}`,
    }));

    return NextResponse.json({
      total: data.response?.numFound || 0,
      results,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}