/**
 * Terrain file loader utilities
 */

import type { TerrainFileData, TerrainData, TerrainDimensions } from '../types/terrain';
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
  if (!data.data?.heightmap || !data.data?.splatmap) {
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

  return {
    dimensions: file.dimensions,
    heightData: base64ToHeightData(file.data.heightmap),
    splatData: base64ToSplatData(file.data.splatmap),
    heightScale: file.heightScale ?? 20,
    textureLayers,
    tileScale: file.textures?.tileScale || 10,
    macroNoise,
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
  return extractTerrainData(fileData, baseUrl);
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
