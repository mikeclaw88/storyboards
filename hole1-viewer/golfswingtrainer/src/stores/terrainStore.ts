import { create } from 'zustand';
import type { TerrainData } from '../types/terrain';
import { getHeightAtWorld, getSurfaceTypeAtWorld } from '../utils/terrainLoader';
import type { SurfaceType } from '../utils/terrainLoader';
import { useDebugStore } from './debugStore';

interface TerrainState {
  /** Loaded terrain data */
  terrainData: TerrainData | null;
  /** Terrain position offset in world space */
  terrainPosition: { x: number; y: number; z: number };
  /** Height scale multiplier */
  heightScale: number;
  /** Uniform scale (from parent group transform) */
  terrainScale: number;
  /** Set terrain data when loaded */
  setTerrainData: (data: TerrainData) => void;
  /** Set terrain position offset */
  setTerrainPosition: (position: { x: number; y: number; z: number }) => void;
  /** Set height scale */
  setHeightScale: (scale: number) => void;
  /** Set terrain scale (uniform scale from parent group) */
  setTerrainScale: (scale: number) => void;
  /**
   * Get terrain height at world position
   * Accounts for terrain position offset, height scale, and terrain scale
   * Returns 0 if terrain not loaded
   */
  getHeightAtWorldPosition: (worldX: number, worldZ: number) => number;
  /**
   * Get surface type at world position
   * Returns 'fairway' if terrain not loaded
   */
  getSurfaceTypeAtWorldPosition: (worldX: number, worldZ: number) => SurfaceType;
}

export const useTerrainStore = create<TerrainState>((set, get) => ({
  terrainData: null,
  terrainPosition: { x: 0, y: 0, z: 0 },
  heightScale: 1,
  terrainScale: 1,

  setTerrainData: (data) => set({ terrainData: data }),

  setTerrainPosition: (position) => set({ terrainPosition: position }),

  setHeightScale: (scale) => set({ heightScale: scale }),

  setTerrainScale: (scale) => set({ terrainScale: scale }),

  getHeightAtWorldPosition: (worldX, worldZ) => {
    const { terrainData, terrainPosition, heightScale, terrainScale } = get();

    if (!terrainData) {
      return 0; // No terrain loaded, use flat ground
    }

    // Convert world position to terrain-local position
    // Account for terrain scale: world coords need to be converted to local coords
    // When terrain is scaled, local coords = (world - position) / scale
    const localX = (worldX - terrainPosition.x) / terrainScale;
    const localZ = (worldZ - terrainPosition.z) / terrainScale;

    // Get height from terrain data (uses bilinear interpolation)
    const terrainHeight = getHeightAtWorld(
      terrainData.heightData,
      terrainData.dimensions,
      localX,
      localZ,
      heightScale
    );

    // Apply terrain scale to height and add terrain Y position offset
    // Height is also scaled by the uniform scale
    const worldHeight = terrainHeight * terrainScale + terrainPosition.y;

    // Apply debug Y offset
    const { terrainYOffset } = useDebugStore.getState();
    return worldHeight + terrainYOffset;
  },

  getSurfaceTypeAtWorldPosition: (worldX, worldZ) => {
    const { terrainData, terrainPosition, terrainScale } = get();

    if (!terrainData) {
      return 'fairway';
    }

    // Convert world position to terrain-local position (same as getHeightAtWorldPosition)
    const localX = (worldX - terrainPosition.x) / terrainScale;
    const localZ = (worldZ - terrainPosition.z) / terrainScale;

    return getSurfaceTypeAtWorld(
      terrainData.splatData,
      terrainData.dimensions,
      localX,
      localZ
    );
  },
}));
