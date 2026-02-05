/**
 * Surface detection from painted surface map
 * Loads hole1surface.png and samples pixel color to determine surface type
 */

export type SurfaceType = 'Rough' | 'Fairway' | 'Green' | 'Sand' | 'OB';

// Must match the colors in SurfaceEditor.tsx
const SURFACE_COLORS: { type: SurfaceType; r: number; g: number; b: number }[] = [
  { type: 'Rough',   r: 0x2d, g: 0x5a, b: 0x27 }, // #2d5a27
  { type: 'Fairway', r: 0x4a, g: 0xde, b: 0x80 }, // #4ade80
  { type: 'Green',   r: 0x22, g: 0xc5, b: 0x5e }, // #22c55e
  { type: 'Sand',    r: 0xf5, g: 0x9e, b: 0x0b }, // #f59e0b
  { type: 'OB',      r: 0xef, g: 0x44, b: 0x44 }, // #ef4444
];

// Map dimensions — must match SurfaceEditor.tsx
const MAP_SIZE = 512;
const WORLD_WIDTH = 300;  // X: -150 to 150
const WORLD_DEPTH = 400;  // Z: -50 to 350

let imageData: ImageData | null = null;
let loaded = false;

/**
 * Load the surface map image into an offscreen canvas for pixel sampling.
 * Call once at startup. Safe to call multiple times.
 */
export function initSurfaceMap(url = './splats/hole1surface.png'): Promise<void> {
  if (loaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = MAP_SIZE;
      canvas.height = MAP_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, MAP_SIZE, MAP_SIZE);
      imageData = ctx.getImageData(0, 0, MAP_SIZE, MAP_SIZE);
      loaded = true;
      resolve();
    };
    img.onerror = () => {
      console.warn('Surface map not found, defaulting to Rough');
      resolve(); // Don't block the game if map is missing
    };
    img.src = url;
  });
}

/**
 * Get the surface type at a world position by sampling the surface map.
 * Returns 'Rough' if map isn't loaded or position is out of bounds.
 */
export function getSurfaceAtPosition(worldX: number, worldZ: number): SurfaceType {
  if (!imageData) return 'Rough';

  // World to pixel (must match SurfaceEditor paint mapping)
  const px = Math.floor(((worldX + WORLD_WIDTH / 2) / WORLD_WIDTH) * MAP_SIZE);
  const py = Math.floor(((worldZ + 50) / WORLD_DEPTH) * MAP_SIZE);

  // Out of bounds
  if (px < 0 || px >= MAP_SIZE || py < 0 || py >= MAP_SIZE) return 'OB';

  const idx = (py * MAP_SIZE + px) * 4;
  const r = imageData.data[idx];
  const g = imageData.data[idx + 1];
  const b = imageData.data[idx + 2];

  // Find closest matching surface color (euclidean distance in RGB)
  let bestType: SurfaceType = 'Rough';
  let bestDist = Infinity;

  for (const sc of SURFACE_COLORS) {
    const dr = r - sc.r;
    const dg = g - sc.g;
    const db = b - sc.b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestType = sc.type;
    }
  }

  return bestType;
}
