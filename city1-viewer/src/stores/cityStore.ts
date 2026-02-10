import { create } from 'zustand';

interface CityState {
  heightScale: number;
  terrainReady: boolean;
  setHeightScale: (scale: number) => void;
  setTerrainReady: (ready: boolean) => void;
}

export const useCityStore = create<CityState>((set) => ({
  heightScale: 12,
  terrainReady: false,
  setHeightScale: (scale) => set({ heightScale: scale }),
  setTerrainReady: (ready) => set({ terrainReady: ready }),
}));
