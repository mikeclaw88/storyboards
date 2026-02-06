import { create } from 'zustand';

interface DebugState {
  showWireframe: boolean;
  freeRoamCamera: boolean;
  surfaceEditorOpen: boolean;
  terrainYOffset: number;
  renderYOffset: number;
  heightMultiplier: number;
  showVoxels: boolean;
  voxelWidth: number;
  voxelHeight: number;
  voxelLength: number;
  voxelScale: number;
  yCutoff: number;
  fogFar: number;
  setYCutoff: (value: number) => void;
  setFogFar: (value: number) => void;
  setShowWireframe: (show: boolean) => void;
  toggleWireframe: () => void;
  setFreeRoamCamera: (enabled: boolean) => void;
  toggleFreeRoamCamera: () => void;
  setSurfaceEditorOpen: (open: boolean) => void;
  setTerrainYOffset: (value: number) => void;
  setRenderYOffset: (value: number) => void;
  setHeightMultiplier: (value: number) => void;
  toggleShowVoxels: () => void;
  setVoxelWidth: (w: number) => void;
  setVoxelHeight: (h: number) => void;
  setVoxelLength: (l: number) => void;
  setVoxelScale: (s: number) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  showWireframe: false,
  freeRoamCamera: false,
  surfaceEditorOpen: false,
  terrainYOffset: -3,
  renderYOffset: 0,
  heightMultiplier: 1.0,
  showVoxels: false,
  voxelWidth: 300,
  voxelHeight: 10,
  voxelLength: 400,
  voxelScale: 2,
  yCutoff: 100,
  fogFar: 300,
  setYCutoff: (value) => set({ yCutoff: value }),
  setFogFar: (value) => set({ fogFar: value }),

  setShowWireframe: (show) => set({ showWireframe: show }),
  toggleWireframe: () => set((state) => ({ showWireframe: !state.showWireframe })),
  setFreeRoamCamera: (enabled) => set({ freeRoamCamera: enabled }),
  toggleFreeRoamCamera: () => set((state) => ({ freeRoamCamera: !state.freeRoamCamera })),
  setSurfaceEditorOpen: (open) => set({ surfaceEditorOpen: open }),
  setTerrainYOffset: (value) => set({ terrainYOffset: value }),
  setRenderYOffset: (value) => set({ renderYOffset: value }),
  setHeightMultiplier: (value) => set({ heightMultiplier: value }),
  toggleShowVoxels: () => set((state) => ({ showVoxels: !state.showVoxels })),
  setVoxelWidth: (w) => set({ voxelWidth: w }),
  setVoxelHeight: (h) => set({ voxelHeight: h }),
  setVoxelLength: (l) => set({ voxelLength: l }),
  setVoxelScale: (s) => set({ voxelScale: s }),
}));
