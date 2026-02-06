/**
 * Surface detection from painted surface map
 * Loads hole1surface.png and samples pixel color to determine surface type
 */

export type SurfaceType = 'Rough' | 'Fairway' | 'Green' | 'Sand' | 'OB';

// Must match the colors in SurfaceEditor.tsx
const SURFACE_COLORS: { type: SurfaceType; r: number; g: number; b: number }[] = [
  { type: 'Rough',   r: 0x80, g: 0x80, b: 0x7f }, // #80807f — grey
  { type: 'Fairway', r: 0xfe, g: 0xfa, b: 0x05 }, // #fefa05 — yellow
  { type: 'Green',   r: 0x00, g: 0xff, b: 0xff }, // #00ffff — cyan (putting green)
  { type: 'Sand',    r: 0x06, g: 0x07, b: 0xf5 }, // #0607f5 — blue
  { type: 'OB',      r: 0x07, g: 0x79, b: 0x07 }, // #077907 — dark green
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
export function initSurfaceMap(url = './terrains/textures/hole1_surface.png'): Promise<void> {
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
  const a = imageData.data[idx + 3];
  if (a < 128) return 'OB';

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

/**
 * Scan the loaded surface map for cyan (Green) pixels, find the centroid,
 * add a small random offset, and return world coordinates.
 * Returns null if surface map isn't loaded or no green pixels found.
 */
export function findRandomGreenPosition(): [number, number] | null {
  if (!imageData) return null;

  const green = SURFACE_COLORS.find((c) => c.type === 'Green')!;
  const threshold = 80 * 80; // squared distance threshold

  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let py = 0; py < MAP_SIZE; py++) {
    for (let px = 0; px < MAP_SIZE; px++) {
      const idx = (py * MAP_SIZE + px) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const a = imageData.data[idx + 3];
      if (a < 128) continue;

      const dr = r - green.r;
      const dg = g - green.g;
      const db = b - green.b;
      if (dr * dr + dg * dg + db * db < threshold) {
        sumX += px;
        sumY += py;
        count++;
      }
    }
  }

  if (count === 0) return null;

  const centroidPx = sumX / count;
  const centroidPy = sumY / count;

  // Pixel to world
  const worldX = (centroidPx / MAP_SIZE) * WORLD_WIDTH - WORLD_WIDTH / 2;
  const worldZ = (centroidPy / MAP_SIZE) * WORLD_DEPTH - 50;

  // Small random offset (+/- 5m) to avoid always being dead center
  const offsetX = (Math.random() - 0.5) * 10;
  const offsetZ = (Math.random() - 0.5) * 10;

  return [worldX + offsetX, worldZ + offsetZ];
}
