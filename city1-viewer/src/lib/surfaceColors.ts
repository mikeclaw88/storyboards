export enum SurfaceType {
  Building = 'building',
  Road = 'road',
  Park = 'park',
  Water = 'water',
  Unknown = 'unknown',
}

interface SurfaceColor {
  type: SurfaceType;
  r: number;
  g: number;
  b: number;
}

const SURFACE_COLORS: SurfaceColor[] = [
  { type: SurfaceType.Building, r: 0, g: 0, b: 255 },
  { type: SurfaceType.Road, r: 128, g: 128, b: 128 },
  { type: SurfaceType.Park, r: 0, g: 255, b: 0 },
  { type: SurfaceType.Water, r: 0, g: 0, b: 0 },
];

const THRESHOLD = 120;

export function classifyPixel(r: number, g: number, b: number): SurfaceType {
  let bestType = SurfaceType.Unknown;
  let bestDist = THRESHOLD * THRESHOLD;

  for (const c of SURFACE_COLORS) {
    const dr = r - c.r;
    const dg = g - c.g;
    const db = b - c.b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestType = c.type;
    }
  }

  return bestType;
}
