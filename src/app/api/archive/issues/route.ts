// src/app/api/archive/issues/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ArchiveFile {
  name: string;
  format?: string;
  size?: string;
}

interface ParsedIssue {
  fileName: string;
  cleanTitle: string;
  numericIssue: number;
  issueBadge: string;
  sizeMb?: string;
}

function parseIssueData(fileName: string): { numericIssue: number; issueBadge: string; cleanTitle: string } {
  const baseName = fileName.replace(/\.(cbz|cbr|zip|rar)$/i, "");

  // 1. Separar números pegados a letras (ej. "001jul" -> "001 jul", "Sonic14" -> "Sonic 14")
  const normalized = baseName
    .replace(/([0-9]+)([a-zA-Z]+)/g, "$1 $2")
    .replace(/([a-zA-Z]+)([0-9]+)/g, "$1 $2")
    .replace(/[-_.]+/g, " ")
    .trim();

  // 2. Limpiar meses (inglés y español) y años de 4 dígitos para que no interfieran
  // ej. "jul 1993", "c1993", "1993"
  const monthsRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|ene|abr|ago|dic)\b/gi;
  const yearsRegex = /\b(19\d{2}|20\d{2})\b/g;

  const textWithoutDates = normalized
    .replace(yearsRegex, " ")
    .replace(monthsRegex, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 3. Extracción del número de edición
  let detectedNumber: number | null = null;
  let digitsCount = 0;

  // Prioridad A: Buscar prefijos claros (#001, Issue 01, No. 1, etc.)
  const prefixMatch = textWithoutDates.match(/(?:#|issue|no\.?|num\.?|vol\.?|v)\s*(\d{1,4})/i);
  if (prefixMatch) {
    detectedNumber = parseInt(prefixMatch[1], 10);
    digitsCount = prefixMatch[1].length;
  } else {
    // Prioridad B: Buscar el primer bloque numérico que quedó en la cadena
    const numMatch = textWithoutDates.match(/\b(\d{1,4})\b/);
    if (numMatch) {
      detectedNumber = parseInt(numMatch[1], 10);
      digitsCount = numMatch[1].length;
    }
  }

  // 4. Casos especiales (promos, extras)
  const isSpecial = /\b(promo|promotional|preview|special|annual|extra|free)\b/i.test(textWithoutDates);

  if (detectedNumber !== null && !isNaN(detectedNumber)) {
    // Formatear el badge: si era "001", muestra "#001" (o "#1" si era 1 dígito)
    const formatted = detectedNumber.toString().padStart(digitsCount >= 3 ? 3 : 1, "0");
    return {
      numericIssue: detectedNumber,
      issueBadge: `#${formatted}`,
      cleanTitle: normalized,
    };
  }

  if (isSpecial) {
    return {
      numericIssue: -1, // Se coloca al principio absoluto de la lista
      issueBadge: "#Esp",
      cleanTitle: normalized,
    };
  }

  return {
    numericIssue: 99999,
    issueBadge: "Tomo",
    cleanTitle: normalized,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get("id");

  if (!identifier) {
    return NextResponse.json({ error: "Falta el parámetro 'id'" }, { status: 400 });
  }

  try {
    const metaRes = await fetch(`https://archive.org/metadata/${identifier}/files`, {
      headers: { "User-Agent": "ComicWebReader/2.0" },
      cache: "no-store",
    });

    if (!metaRes.ok) {
      return NextResponse.json({ error: "No se pudieron obtener los archivos del registro." }, { status: 404 });
    }

    const data = await metaRes.json();
    const files: ArchiveFile[] = data.result || [];

    // Filtrar archivos válidos descartando DAISY y metadatos
    const validFiles = files.filter((f) => {
      const name = (f.name || "").toLowerCase();
      const fmt = (f.format || "").toLowerCase();
      const size = parseInt(f.size || "0", 10);

      if (
        name.includes("daisy") ||
        name.includes("_meta") ||
        name.includes("_files.xml") ||
        name.includes("_reviews.xml") ||
        name.includes("_thumb") ||
        name.includes("_jp2") ||
        size < 500 * 1024
      ) {
        return false;
      }

      return (
        name.endsWith(".cbz") ||
        name.endsWith(".cbr") ||
        fmt === "comic book zip" ||
        fmt === "comic book rar" ||
        (name.endsWith(".zip") && !name.startsWith("."))
      );
    });

    // Mapear cada archivo con su número parseado
    const parsedList: ParsedIssue[] = validFiles.map((f) => {
      const { numericIssue, issueBadge, cleanTitle } = parseIssueData(f.name);
      const sizeMb = f.size ? (parseInt(f.size, 10) / (1024 * 1024)).toFixed(1) : undefined;
      return {
        fileName: f.name,
        cleanTitle,
        numericIssue,
        issueBadge,
        sizeMb,
      };
    });

    // ORDENAMIENTO NUMÉRICO REAL:
    // Compara directamente el número extraído (1 va antes que 2, 2 antes que 14, etc.)
    parsedList.sort((a, b) => {
      if (a.numericIssue !== b.numericIssue) {
        return a.numericIssue - b.numericIssue;
      }
      return a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: "base" });
    });

    // Construir la respuesta asegurando que conserve su issueBadge real
    const issues = parsedList.map((item, index) => ({
      fileName: item.fileName,
      title: item.cleanTitle,
      issueNumber: item.issueBadge === "Tomo" ? `#${index + 1}` : item.issueBadge,
      sizeMb: item.sizeMb,
    }));

    return NextResponse.json(
      {
        identifier,
        totalIssues: issues.length,
        fallbackCoverUrl: `https://archive.org/services/img/${identifier}`,
        issues,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener tomos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}