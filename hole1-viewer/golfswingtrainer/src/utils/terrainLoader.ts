/**
 * Terrain file loader utilities
 */

import type { TerrainFileData, TerrainData, TerrainDimensions } from '../types/terrain';

export type SurfaceType = 'fairway' | 'rough' | 'green' | 'sand';
import { DEFAULT_TEXTURE_LAYERS } from '../types/terrain';

/**
 * Decode Base64 to Float32Array (for heightmap)
 */
export function base64ToHeightData(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Float32Array(bytes.buffer);
}

/**
 * Decode Base64 to Uint8Array (for splatmap)
 */
export function base64ToSplatData(base64: string): Uint8Array {
  const binary = atob(base64);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i);
  }
  return data;
}

/**
 * Load a heightmap from a PNG image.
 * Reads the R channel, normalizes 0-255 → 0.0-1.0,
 * and bilinear-resamples from the PNG resolution to the terrain grid size.
 */
export async function loadHeightmapFromPng(
  url: string,
  dimensions: TerrainDimensions
): Promise<Float32Array> {
  const { cols, rows } = getHeightmapSize(dimensions);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load heightmap image: ${url}`));
    image.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const pixels = imageData.data;
  const srcW = img.width;
  const srcH = img.height;

  const heightData = new Float32Array(rows * cols);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Map terrain grid coordinate to source image coordinate
      const srcX = (col / (cols - 1)) * (srcW - 1);
      const srcY = (row / (rows - 1)) * (srcH - 1);

      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y1 = Math.min(y0 + 1, srcH - 1);
      const fx = srcX - x0;
      const fy = srcY - y0;

      // Sample R channel at 4 corners
      const r00 = pixels[(y0 * srcW + x0) * 4];
      const r10 = pixels[(y0 * srcW + x1) * 4];
      const r01 = pixels[(y1 * srcW + x0) * 4];
      const r11 = pixels[(y1 * srcW + x1) * 4];

      // Bilinear interpolation
      const r0 = r00 * (1 - fx) + r10 * fx;
      const r1 = r01 * (1 - fx) + r11 * fx;
      const value = r0 * (1 - fy) + r1 * fy;

      heightData[row * cols + col] = value / 255;
    }
  }

  return heightData;
}

/**
 * Parse terrain file JSON
 */
export function parseTerrainFile(json: string): TerrainFileData {
  const data = JSON.parse(json) as TerrainFileData;

  if (!data.version) {
    throw new Error('Invalid terrain file: missing version');
  }
  if (!data.dimensions) {
    throw new Error('Invalid terrain file: missing dimensions');
  }
  if ((!data.data?.heightmap && !data.data?.heightmapImage) || !data.data?.splatmap) {
    throw new Error('Invalid terrain file: missing terrain data');
  }

  return data;
}

/**
 * Get the base directory URL from a file URL
 * e.g., "./terrains/terrain.terrain" -> "./terrains/"
 */
export function getBaseUrl(fileUrl: string): string {
  const lastSlash = fileUrl.lastIndexOf('/');
  if (lastSlash === -1) {
    return './';
  }
  return fileUrl.substring(0, lastSlash + 1);
}

/**
 * Resolve a relative texture path against a base URL
 * e.g., "./textures/grass/fairway.png" with base "./terrains/"
 *       -> "./terrains/textures/grass/fairway.png"
 */
export function resolveTexturePath(relativePath: string, baseUrl: string): string {
  // Remove leading "./" if present
  let normalized = relativePath;
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }
  return baseUrl + normalized;
}

/**
 * Extract terrain data from file structure
 * @param file - The terrain file data
 * @param baseUrl - Optional base URL for resolving texture paths
 */
export function extractTerrainData(file: TerrainFileData, baseUrl?: string): TerrainData {
  let textureLayers = file.textures?.layers || DEFAULT_TEXTURE_LAYERS;
  let macroNoise = file.textures?.macroNoise;

  // Resolve texture paths if baseUrl is provided
  if (baseUrl) {
    textureLayers = textureLayers.map(layer => ({
      ...layer,
      colorMap: resolveTexturePath(layer.colorMap, baseUrl),
      normalMap: layer.normalMap ? resolveTexturePath(layer.normalMap, baseUrl) : '',
      detail: layer.detail ? {
        ...layer.detail,
        detailMap: layer.detail.detailMap ? resolveTexturePath(layer.detail.detailMap, baseUrl) : '',
        detailNormalMap: layer.detail.detailNormalMap ? resolveTexturePath(layer.detail.detailNormalMap, baseUrl) : '',
      } : undefined,
    }));

    if (macroNoise?.noiseMap) {
      macroNoise = {
        ...macroNoise,
        noiseMap: resolveTexturePath(macroNoise.noiseMap, baseUrl),
      };
    }
  }

  // Resolve photo texture path if present
  const photoTexture = file.textures?.photoTexture && baseUrl
    ? resolveTexturePath(file.textures.photoTexture, baseUrl)
    : file.textures?.photoTexture || undefined;

  // Resolve heightmapImage path if present
  const heightmapImage = file.data?.heightmapImage && baseUrl
    ? resolveTexturePath(file.data.heightmapImage, baseUrl)
    : file.data?.heightmapImage || undefined;

  // Use base64 heightmap if available, otherwise empty placeholder (PNG will be loaded later)
  const heightData = file.data.heightmap
    ? base64ToHeightData(file.data.heightmap)
    : new Float32Array(getHeightmapSize(file.dimensions).cols * getHeightmapSize(file.dimensions).rows);

  return {
    dimensions: file.dimensions,
    heightData,
    splatData: base64ToSplatData(file.data.splatmap),
    heightScale: file.heightScale ?? 20,
    textureLayers,
    tileScale: file.textures?.tileScale || 10,
    macroNoise,
    photoTexture,
    heightmapImage,
  };
}

/**
 * Load terrain from URL
 * Texture paths in the terrain file are resolved relative to the terrain file's directory
 */
export async function loadTerrainFromUrl(url: string): Promise<TerrainData> {
  // Add cache-busting to ensure fresh file
  const cacheBustUrl = `${url}?t=${Date.now()}`;
  const response = await fetch(cacheBustUrl);
  if (!response.ok) {
    throw new Error(`Failed to load terrain: ${response.statusText}`);
  }
  const json = await response.text();
  const fileData = parseTerrainFile(json);

  // Resolve texture paths relative to the terrain file's directory
  const baseUrl = getBaseUrl(url);
  const terrainData = extractTerrainData(fileData, baseUrl);

  // If a PNG heightmap image is specified, load it and replace the height data
  if (terrainData.heightmapImage) {
    terrainData.heightData = await loadHeightmapFromPng(
      terrainData.heightmapImage,
      terrainData.dimensions
    );
  }

  return terrainData;
}

/**
 * Calculate heightmap grid size
 */
export function getHeightmapSize(dimensions: TerrainDimensions): { cols: number; rows: number } {
  const { width, depth, resolution } = dimensions;
  return {
    cols: Math.floor(width * resolution) + 1,
    rows: Math.floor(depth * resolution) + 1,
  };
}

/**
 * Get height at world position
 */
export function getHeightAtWorld(
  heightData: Float32Array,
  dimensions: TerrainDimensions,
  worldX: number,
  worldZ: number,
  heightScale: number = 1
): number {
  const { width, depth, resolution } = dimensions;
  const { cols, rows } = getHeightmapSize(dimensions);

  // Convert world to heightmap coordinates
  // Terrain is centered at origin
  const col = ((worldX + width / 2) * resolution);
  const row = ((depth / 2 - worldZ) * resolution);

  // Clamp to valid range
  const col0 = Math.max(0, Math.min(cols - 2, Math.floor(col)));
  const row0 = Math.max(0, Math.min(rows - 2, Math.floor(row)));
  const col1 = col0 + 1;
  const row1 = row0 + 1;

  // Bilinear interpolation
  const fx = col - col0;
  const fz = row - row0;

  const h00 = heightData[row0 * cols + col0] || 0;
  const h10 = heightData[row0 * cols + col1] || 0;
  const h01 = heightData[row1 * cols + col0] || 0;
  const h11 = heightData[row1 * cols + col1] || 0;

  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;
  const height = h0 * (1 - fz) + h1 * fz;

  return height * heightScale;
}

/**
 * Get surface type at world position by sampling the splatmap
 * Splatmap channels: R=fairway, G=rough, B=green, A=sand
 */
export function getSurfaceTypeAtWorld(
  splatData: Uint8Array,
  dimensions: TerrainDimensions,
  worldX: number,
  worldZ: number
): SurfaceType {
  const { width, depth, resolution } = dimensions;
  const { cols, rows } = getHeightmapSize(dimensions);

  // Convert world to grid coordinates (same math as getHeightAtWorld)
  const col = (worldX + width / 2) * resolution;
  const row = (depth / 2 - worldZ) * resolution;

  // Clamp to valid range (nearest-neighbor sampling)
  const c = Math.max(0, Math.min(cols - 1, Math.round(col)));
  const r = Math.max(0, Math.min(rows - 1, Math.round(row)));

  // Sample RGBA at this grid cell (4 bytes per pixel)
  const idx = (r * cols + c) * 4;
  const fairway = splatData[idx] ?? 0;
  const rough = splatData[idx + 1] ?? 0;
  const green = splatData[idx + 2] ?? 0;
  const sand = splatData[idx + 3] ?? 0;

  // Return channel with highest weight
  const max = Math.max(fairway, rough, green, sand);
  if (max === 0) return 'fairway'; // Default if all zero
  if (sand === max) return 'sand';
  if (rough === max) return 'rough';
  if (green === max) return 'green';
  return 'fairway';
}
