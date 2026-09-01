// lib/detectBorders.ts

export interface CropInsets {
  topPercent: number;
  bottomPercent: number;
  leftPercent: number;
  rightPercent: number;
}

/**
 * Determina si un píxel RGB se considera "blanco" o margen de escaneo.
 * @param threshold Umbral de luminosidad (0-255). 240 detecta blancos y grises muy claros.
 */
function isMarginPixel(r: number, g: number, b: number, threshold = 240): boolean {
  return r >= threshold && g >= threshold && b >= threshold;
}

/**
 * Escanea los píxeles de una imagen usando un Canvas en memoria para hallar los márgenes.
 */
export async function detectWhiteMargins(
  imageUrl: string,
  luminanceThreshold = 240
): Promise<CropInsets> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Escalar hacia abajo a un tamaño máx. de 400px de ancho para análisis ultrarrápido (< 5ms)
      const scale = Math.min(1, 400 / img.naturalWidth);
      const width = Math.max(1, Math.floor(img.naturalWidth * scale));
      const height = Math.max(1, Math.floor(img.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        return resolve({ topPercent: 0, bottomPercent: 0, leftPercent: 0, rightPercent: 0 });
      }

      ctx.drawImage(img, 0, 0, width, height);
      const { data } = ctx.getImageData(0, 0, width, height);

      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;

      // Analizar filas y columnas
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Si el píxel tiene opacidad y no es blanco de margen
          if (a > 30 && !isMarginPixel(r, g, b, luminanceThreshold)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Si toda la página es blanca o no se detectó contenido relevante, no recortar
      if (minX > maxX || minY > maxY) {
        return resolve({ topPercent: 0, bottomPercent: 0, leftPercent: 0, rightPercent: 0 });
      }

      // Margen de seguridad (padding de 2px para no cortar viñetas al límite)
      minX = Math.max(0, minX - 2);
      minY = Math.max(0, minY - 2);
      maxX = Math.min(width, maxX + 2);
      maxY = Math.min(height, maxY + 2);

      // Calcular porcentajes exactos de recorte
      const topPercent = (minY / height) * 100;
      const bottomPercent = ((height - maxY) / height) * 100;
      const leftPercent = (minX / width) * 100;
      const rightPercent = ((width - maxX) / width) * 100;

      resolve({
        topPercent,
        bottomPercent,
        leftPercent,
        rightPercent,
      });
    };

    img.onerror = () => {
      resolve({ topPercent: 0, bottomPercent: 0, leftPercent: 0, rightPercent: 0 });
    };

    img.src = imageUrl;
  });
}