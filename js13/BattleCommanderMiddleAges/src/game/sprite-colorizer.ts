import { EntityType, Team } from "./EntityType";

// Module-level source data
let sourceData: ImageData | null = null;
let imgWidth = 0;
let imgHeight = 0;
let halfW = 0;

// Detected crop bounds (relative to each half)
let cropX = 0;
let cropY = 0;
let cropW = 0;
let cropH = 0;

const SKIN_TONES: [number, number, number][] = [
  [255, 224, 196], [245, 210, 178], [224, 187, 148], [198, 159, 122],
  [174, 132, 98],  [148, 108, 76],  [116, 80, 56],   [86, 58, 40]
];

const HAIR_COLORS: [number, number, number][] = [
  [60, 40, 20], [140, 100, 40], [30, 20, 10], [200, 170, 100],
  [100, 60, 30], [160, 80, 40], [80, 50, 25], [180, 50, 20]
];

// Unit type palettes indexed by EntityType
const UNIT_PALETTES: Record<number, {
  pants: [number, number, number],
  alphaShirt: [number, number, number],
  bravoShirt: [number, number, number]
}> = {
  [EntityType.Troop]: {
    pants: [101, 67, 33],
    alphaShirt: [139, 32, 32],
    bravoShirt: [32, 80, 139]
  },
  [EntityType.Testudo]: {
    pants: [68, 51, 34],
    alphaShirt: [107, 48, 48],
    bravoShirt: [48, 80, 107]
  },
  [EntityType.Archer]: {
    pants: [59, 47, 47],
    alphaShirt: [91, 64, 32],
    bravoShirt: [32, 75, 91]
  },
  [EntityType.Artillery]: {
    pants: [59, 47, 47],
    alphaShirt: [91, 64, 32],
    bravoShirt: [32, 75, 91]
  }
};

/**
 * Preload humanv2.jpg: extract full ImageData and auto-detect character bounds from mask (right half).
 */
export function setHumanV2Source(img: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  sourceData = ctx.getImageData(0, 0, img.width, img.height);
  imgWidth = img.width;
  imgHeight = img.height;
  halfW = Math.floor(imgWidth / 2);

  // Auto-detect character bounds by scanning right half mask for non-black pixels
  let minX = halfW, maxX = 0, minY = imgHeight, maxY = 0;
  const threshold = 30;
  const data = sourceData.data;

  for (let y = 0; y < imgHeight; y++) {
    for (let x = halfW; x < imgWidth; x++) {
      const i = (y * imgWidth + x) * 4;
      if (data[i] > threshold || data[i + 1] > threshold || data[i + 2] > threshold) {
        const relX = x - halfW;
        if (relX < minX) minX = relX;
        if (relX > maxX) maxX = relX;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  cropX = minX;
  cropY = minY;
  cropW = maxX - minX + 1;
  cropH = maxY - minY + 1;
}

export function isHumanV2Ready(): boolean {
  return sourceData !== null;
}

/**
 * Colorize a 32x32 sprite from humanv2.jpg for a given unit type and team.
 * Returns an HTMLCanvasElement (valid CanvasImageSource).
 */
export function colorizeHumanSprite(type: number, team: number): HTMLCanvasElement {
  const OUTPUT_SIZE = 32;
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d')!;

  if (!sourceData) {
    return canvas;
  }

  const outData = ctx.createImageData(OUTPUT_SIZE, OUTPUT_SIZE);
  const out = outData.data;
  const src = sourceData.data;

  // Get palette for this unit type
  const palette = UNIT_PALETTES[type] || UNIT_PALETTES[EntityType.Troop];
  const shirtColor = team === Team.Bravo ? palette.bravoShirt : palette.alphaShirt;
  const pantsColor = palette.pants;

  // Random skin and hair per unit
  const skinColor = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  const hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];

  const MASK_THRESHOLD = 30 / 255;

  for (let oy = 0; oy < OUTPUT_SIZE; oy++) {
    for (let ox = 0; ox < OUTPUT_SIZE; ox++) {
      // Map output pixel to source coords within crop bounds
      const srcX = Math.floor(cropX + ox * (cropW / OUTPUT_SIZE));
      const srcY = Math.floor(cropY + oy * (cropH / OUTPUT_SIZE));

      // Read left half (color reference) for luminance
      const leftI = (srcY * imgWidth + srcX) * 4;
      const lr = src[leftI];
      const lg = src[leftI + 1];
      const lb = src[leftI + 2];
      const luminance = (lr * 0.299 + lg * 0.587 + lb * 0.114) / 255;

      const outI = (oy * OUTPUT_SIZE + ox) * 4;

      // If left side is white/near-white, this is background — skip (transparent)
      if (Math.min(lr, lg, lb) > 240) {
        out[outI + 3] = 0;
        continue;
      }

      // Read right half (mask)
      const rightI = (srcY * imgWidth + (srcX + halfW)) * 4;
      const mr = src[rightI] / 255;
      const mg = src[rightI + 1] / 255;
      const mb = src[rightI + 2] / 255;

      // Decompose mask
      const skinMask = Math.min(mr, mg, mb);
      const shirtMask = Math.max(0, mr - skinMask);
      const pantsMask = Math.max(0, mg - skinMask);
      const hairMask = Math.max(0, mb - skinMask);
      const totalMask = skinMask + shirtMask + pantsMask + hairMask;

      if (totalMask < MASK_THRESHOLD) {
        // No mask data — outline (dark) or background, determined by left-side luminance
        if (luminance < 0.3) {
          // Outline - black
          out[outI] = 0;
          out[outI + 1] = 0;
          out[outI + 2] = 0;
          out[outI + 3] = 255;
        } else {
          // Transparent background
          out[outI + 3] = 0;
        }
      } else {
        // Colorize: weighted blend * luminance
        const r = (shirtMask * shirtColor[0] + pantsMask * pantsColor[0] + hairMask * hairColor[0] + skinMask * skinColor[0]) * luminance;
        const g = (shirtMask * shirtColor[1] + pantsMask * pantsColor[1] + hairMask * hairColor[1] + skinMask * skinColor[1]) * luminance;
        const b = (shirtMask * shirtColor[2] + pantsMask * pantsColor[2] + hairMask * hairColor[2] + skinMask * skinColor[2]) * luminance;

        out[outI] = Math.min(255, Math.round(r));
        out[outI + 1] = Math.min(255, Math.round(g));
        out[outI + 2] = Math.min(255, Math.round(b));
        out[outI + 3] = 255;
      }
    }
  }

  ctx.putImageData(outData, 0, 0);
  return canvas;
}
