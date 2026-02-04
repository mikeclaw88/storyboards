import { create } from 'zustand';

interface DebugState {
  showWireframe: boolean;
  freeRoamCamera: boolean;
  showTeeSplat: boolean;
  showGreenSplat: boolean;
  teeSplatOffset: { x: number; y: number; z: number };
  greenSplatOffset: { x: number; y: number; z: number };
  maxTerrainHeight: number;
  terrainYOffset: number;
  setShowWireframe: (show: boolean) => void;
  toggleWireframe: () => void;
  setFreeRoamCamera: (enabled: boolean) => void;
  toggleFreeRoamCamera: () => void;
  setShowTeeSplat: (show: boolean) => void;
  toggleShowTeeSplat: () => void;
  setShowGreenSplat: (show: boolean) => void;
  toggleShowGreenSplat: () => void;
  setTeeSplatOffset: (axis: 'x' | 'y' | 'z', value: number) => void;
  setGreenSplatOffset: (axis: 'x' | 'y' | 'z', value: number) => void;
  setMaxTerrainHeight: (value: number) => void;
  setTerrainYOffset: (value: number) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  showWireframe: false,
  freeRoamCamera: false,
  showTeeSplat: true,
  showGreenSplat: true,
  teeSplatOffset: { x: 0, y: 1, z: 0 },
  greenSplatOffset: { x: 0, y: 1, z: 147 },
  maxTerrainHeight: 0,
  terrainYOffset: -3,

  setShowWireframe: (show) => set({ showWireframe: show }),
  toggleWireframe: () => set((state) => ({ showWireframe: !state.showWireframe })),
  setFreeRoamCamera: (enabled) => set({ freeRoamCamera: enabled }),
  toggleFreeRoamCamera: () => set((state) => ({ freeRoamCamera: !state.freeRoamCamera })),
  setShowTeeSplat: (show) => set({ showTeeSplat: show }),
  toggleShowTeeSplat: () => set((state) => ({ showTeeSplat: !state.showTeeSplat })),
  setShowGreenSplat: (show) => set({ showGreenSplat: show }),
  toggleShowGreenSplat: () => set((state) => ({ showGreenSplat: !state.showGreenSplat })),
  setTeeSplatOffset: (axis, value) => set((state) => ({
    teeSplatOffset: { ...state.teeSplatOffset, [axis]: value }
  })),
  setGreenSplatOffset: (axis, value) => set((state) => ({
    greenSplatOffset: { ...state.greenSplatOffset, [axis]: value }
  })),
  setMaxTerrainHeight: (value) => set({ maxTerrainHeight: value }),
  setTerrainYOffset: (value) => set({ terrainYOffset: value }),
}));
