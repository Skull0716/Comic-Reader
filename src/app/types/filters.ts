// types/filters.ts
export type VisualPreset = "normal" | "night" | "sepia" | "grayscale" | "high-contrast";

export interface ImageFilterSettings {
  preset: VisualPreset;
  brightness: number; // 50% - 150% (base 100)
  contrast: number;   // 50% - 200% (base 100)
  invert: boolean;    // true / false
}

export const DEFAULT_FILTERS: ImageFilterSettings = {
  preset: "normal",
  brightness: 100,
  contrast: 100,
  invert: false,
};