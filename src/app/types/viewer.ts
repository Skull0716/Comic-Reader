export type ReadingMode = "single" | "double" | "webtoon"; // single = 1 página, double = 2 páginas, webtoon = scroll vertical
export type ReadingDirection = "ltr" | "rtl"; // ltr = Cómic Occidental, rtl = Manga

export interface PageSpread {
  indices: number[]; // Índices de las páginas reales (ej. [0] para portada, [1, 2] para pliego doble)
}