import { create } from 'zustand';
import type { Texture } from 'three';
import type { Building } from '../lib/cityImporter';

interface CityState {
  heightScale: number;
  heightPercent: number;
  terrainReady: boolean;
  buildings: Building[];
  processedHeightTexture: Texture | null;
  selectedBuildingId: number | null;
  setHeightScale: (scale: number) => void;
  setHeightPercent: (percent: number) => void;
  setTerrainReady: (ready: boolean) => void;
  setBuildings: (buildings: Building[]) => void;
  setProcessedHeightTexture: (texture: Texture) => void;
  setSelectedBuildingId: (id: number | null) => void;
}

export const useCityStore = create<CityState>((set) => ({
  heightScale: 12,
  heightPercent: 40,
  terrainReady: false,
  buildings: [],
  processedHeightTexture: null,
  selectedBuildingId: null,
  setHeightScale: (scale) => set({ heightScale: scale }),
  setHeightPercent: (percent) => set({ heightPercent: percent }),
  setTerrainReady: (ready) => set({ terrainReady: ready }),
  setBuildings: (buildings) => set({ buildings }),
  setProcessedHeightTexture: (texture) => set({ processedHeightTexture: texture }),
  setSelectedBuildingId: (id) => set((state) => ({
    selectedBuildingId: state.selectedBuildingId === id ? null : id,
  })),
}));
