// lib/filterUtils.ts
import { ImageFilterSettings } from "./types/filters";

export function getCssFilterString(settings: ImageFilterSettings): string {
  const filters: string[] = [];

  // Brillo y Contraste base
  if (settings.brightness !== 100) {
    filters.push(`brightness(${settings.brightness}%)`);
  }
  if (settings.contrast !== 100) {
    filters.push(`contrast(${settings.contrast}%)`);
  }

  // Presets visuales
  switch (settings.preset) {
    case "night":
      // Invierte blancos a negros y preserva el balance de color
      filters.push("invert(100%) hue-rotate(180deg)");
      break;
    case "sepia":
      filters.push("sepia(45%) saturate(85%)");
      break;
    case "grayscale":
      filters.push("grayscale(100%)");
      break;
    case "high-contrast":
      filters.push("contrast(135%) brightness(95%)");
      break;
    default:
      break;
  }

  if (settings.invert && settings.preset !== "night") {
    filters.push("invert(100%)");
  }

  return filters.join(" ") || "none";
}