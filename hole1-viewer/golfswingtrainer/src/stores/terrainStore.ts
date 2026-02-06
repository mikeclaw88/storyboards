import { create } from 'zustand';
import type { TerrainData } from '../types/terrain';
import { getHeightAtWorld, getSurfaceTypeAtWorld } from '../utils/terrainLoader';
import type { SurfaceType } from '../utils/terrainLoader';
import { useDebugStore } from './debugStore';
import { Color } from 'three';

interface TerrainState {
  /** Standard Terrain Data (Old System) */
  terrainData: TerrainData | null;
  
  /** Raw Image Data (New GolfCourseRenderer System) */
  rawHeightData: Uint8ClampedArray | null;
  rawSurfaceData: Uint8ClampedArray | null;
  rawDimensions: { width: number; height: number };
  terrainSize: number; // World size (e.g. 512)

  /** Terrain position offset in world space */
  terrainPosition: { x: number; y: number; z: number };
  /** Height scale multiplier */
  heightScale: number;
  /** Uniform scale (from parent group transform) */
  terrainScale: number;

  /** Set terrain data when loaded (Old System) */
  setTerrainData: (data: TerrainData) => void;

  /** Set raw data from GolfCourseRenderer */
  setRawData: (
    heightData: Uint8ClampedArray, 
    surfaceData: Uint8ClampedArray, 
    width: number, 
    height: number,
    terrainSize: number,
    heightScale: number
  ) => void;

  /** Set terrain position offset */
  setTerrainPosition: (position: { x: number; y: number; z: number }) => void;
  /** Set height scale */
  setHeightScale: (scale: number) => void;
  /** Set terrain scale (uniform scale from parent group) */
  setTerrainScale: (scale: number) => void;

  /**
   * Get terrain height at world position
   */
  getHeightAtWorldPosition: (worldX: number, worldZ: number) => number;
  
  /**
   * Get surface type at world position
   */
  getSurfaceTypeAtWorldPosition: (worldX: number, worldZ: number) => SurfaceType;
}

// Color matching helpers
const cFairway = new Color(1.0, 1.0, 0.0);
const cRough = new Color(0.5, 0.5, 0.5);
const cGreen = new Color(0.0, 1.0, 1.0);
const cSand = new Color(0.0, 0.0, 1.0);
const cTee = new Color(1.0, 0.0, 1.0);

function matchColor(r: number, g: number, b: number, target: Color): boolean {
  // Simple distance check (r,g,b are 0-255, target is 0-1)
  const tr = Math.round(target.r * 255);
  const tg = Math.round(target.g * 255);
  const tb = Math.round(target.b * 255);
  
  const dist = Math.sqrt(
    Math.pow(r - tr, 2) + 
    Math.pow(g - tg, 2) + 
    Math.pow(b - tb, 2)
  );
  return dist < 50; // Tolerance
}

export const useTerrainStore = create<TerrainState>((set, get) => ({
  terrainData: null,
  rawHeightData: null,
  rawSurfaceData: null,
  rawDimensions: { width: 0, height: 0 },
  terrainSize: 512,
  terrainPosition: { x: 0, y: 0, z: 0 },
  heightScale: 50,
  terrainScale: 1,

  setTerrainData: (data) => set({ terrainData: data }),

  setRawData: (heightData, surfaceData, width, height, terrainSize, heightScale) => set({
    rawHeightData: heightData,
    rawSurfaceData: surfaceData,
    rawDimensions: { width, height },
    terrainSize,
    heightScale,
    // Reset old data to avoid conflict
    terrainData: null 
  }),

  setTerrainPosition: (position) => set({ terrainPosition: position }),
  setHeightScale: (scale) => set({ heightScale: scale }),
  setTerrainScale: (scale) => set({ terrainScale: scale }),

  getHeightAtWorldPosition: (worldX, worldZ) => {
    const { 
      terrainData, rawHeightData, rawDimensions, terrainSize,
      terrainPosition, heightScale, terrainScale 
    } = get();
    const { terrainYOffset } = useDebugStore.getState();

    // 1. New System (Raw Data)
    if (rawHeightData) {
      // Map world pos to UV (0-1)
      // Terrain is centered at origin?
      // GolfCourseRenderer uses plane geometry centered at (0,0) by default
      // size is `terrainSize`
      
      const halfSize = terrainSize / 2;
      const u = (worldX + halfSize) / terrainSize;
      // Texture V is flipped in Three.js usually (1-v)?
      // In GolfCourseRenderer: `sampleHeight(u, 1 - v)`
      // Here Z corresponds to V. 
      // Z goes from -half to +half.
      // v = (z + half) / size.
      // But standard UV: (0,0) is bottom-left.
      // In ThreeJS PlaneGeometry: +Y (up) corresponds to V=1?
      // Let's assume standard mapping:
      const v = (worldZ + halfSize) / terrainSize;
      
      // Flip V for image sampling?
      // GolfCourseRenderer shader uses `vUv`.
      // `pos.setZ(i, h)` where `h = sampleHeight(u, 1 - v)`.
      // So we need to sample at `1 - v`.
      
      const sampleU = Math.max(0, Math.min(1, u));
      const sampleV = Math.max(0, Math.min(1, 1 - v));
      
      const px = Math.floor(sampleU * (rawDimensions.width - 1));
      const py = Math.floor(sampleV * (rawDimensions.height - 1));
      
      const idx = (py * rawDimensions.width + px) * 4;
      const r = rawHeightData[idx]; // Red channel (0-255)
      
      const height = (r / 255) * heightScale;
      return height + terrainYOffset;
    }

    // 2. Old System
    if (terrainData) {
      const localX = (worldX - terrainPosition.x) / terrainScale;
      const localZ = (worldZ - terrainPosition.z) / terrainScale;
      const h = getHeightAtWorld(
        terrainData.heightData,
        terrainData.dimensions,
        localX,
        localZ,
        heightScale
      );
      return (h * terrainScale) + terrainPosition.y + terrainYOffset;
    }

    return 0; 
  },

  getSurfaceTypeAtWorldPosition: (worldX, worldZ) => {
    const { 
      terrainData, rawSurfaceData, rawDimensions, terrainSize
    } = get();

    // 1. New System
    if (rawSurfaceData) {
      const halfSize = terrainSize / 2;
      const u = (worldX + halfSize) / terrainSize;
      const v = (worldZ + halfSize) / terrainSize;
      
      const sampleU = Math.max(0, Math.min(1, u));
      const sampleV = Math.max(0, Math.min(1, 1 - v)); // Flip V like height
      
      const px = Math.floor(sampleU * (rawDimensions.width - 1));
      const py = Math.floor(sampleV * (rawDimensions.height - 1));
      
      const idx = (py * rawDimensions.width + px) * 4;
      const r = rawSurfaceData[idx];
      const g = rawSurfaceData[idx+1];
      const b = rawSurfaceData[idx+2];
      
      if (matchColor(r, g, b, cFairway)) return 'fairway';
      if (matchColor(r, g, b, cRough)) return 'rough';
      if (matchColor(r, g, b, cGreen)) return 'green';
      if (matchColor(r, g, b, cSand)) return 'sand';
      
      return 'fairway';
    }

    // 2. Old System
    if (terrainData) {
      // ... same old logic
      return 'fairway';
    }

    return 'fairway';
  },
}));
