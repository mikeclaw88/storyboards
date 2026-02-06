import { create } from 'zustand';

interface DebugState {
  showWireframe: boolean;
  freeRoamCamera: boolean;
  surfaceEditorOpen: boolean;
  terrainYOffset: number;
  showVoxels: boolean;
  voxelWidth: number;
  voxelHeight: number;
  voxelLength: number;
  voxelScale: number;
  yCutoff: number;
  fogFar: number;
  showSkybox: boolean;
  skyboxUpperSquish: number;
  skyboxLowerSquish: number;
  skyboxHorizonStretch: number;
  skyboxHorizonBias: number;
  skyboxRotation: number;
  droneDelay: number;
  setYCutoff: (value: number) => void;
  setFogFar: (value: number) => void;
  setShowWireframe: (show: boolean) => void;
  toggleWireframe: () => void;
  setFreeRoamCamera: (enabled: boolean) => void;
  toggleFreeRoamCamera: () => void;
  setSurfaceEditorOpen: (open: boolean) => void;
  setTerrainYOffset: (value: number) => void;
  toggleShowVoxels: () => void;
  setVoxelWidth: (w: number) => void;
  setVoxelHeight: (h: number) => void;
  setVoxelLength: (l: number) => void;
  setVoxelScale: (s: number) => void;
  setShowSkybox: (show: boolean) => void;
  setSkyboxUpperSquish: (value: number) => void;
  setSkyboxLowerSquish: (value: number) => void;
  setSkyboxHorizonStretch: (value: number) => void;
  setSkyboxHorizonBias: (value: number) => void;
  setSkyboxRotation: (value: number) => void;
  setDroneDelay: (value: number) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  showWireframe: false,
  freeRoamCamera: false,
  surfaceEditorOpen: false,
  terrainYOffset: 0,
  showVoxels: false,
  voxelWidth: 300,
  voxelHeight: 10,
  voxelLength: 400,
  voxelScale: 2,
  yCutoff: 100,
  fogFar: 300,
  showSkybox: true,
  skyboxUpperSquish: 1.0,
  skyboxLowerSquish: 1.0,
  skyboxHorizonStretch: 1.0,
  skyboxHorizonBias: 0,
  skyboxRotation: 0,
  droneDelay: 1.5,
  setYCutoff: (value) => set({ yCutoff: value }),
  setFogFar: (value) => set({ fogFar: value }),

  setShowWireframe: (show) => set({ showWireframe: show }),
  toggleWireframe: () => set((state) => ({ showWireframe: !state.showWireframe })),
  setFreeRoamCamera: (enabled) => set({ freeRoamCamera: enabled }),
  toggleFreeRoamCamera: () => set((state) => ({ freeRoamCamera: !state.freeRoamCamera })),
  setSurfaceEditorOpen: (open) => set({ surfaceEditorOpen: open }),
  setTerrainYOffset: (value) => set({ terrainYOffset: value }),
  toggleShowVoxels: () => set((state) => ({ showVoxels: !state.showVoxels })),
  setVoxelWidth: (w) => set({ voxelWidth: w }),
  setVoxelHeight: (h) => set({ voxelHeight: h }),
  setVoxelLength: (l) => set({ voxelLength: l }),
  setVoxelScale: (s) => set({ voxelScale: s }),
  setShowSkybox: (show) => set({ showSkybox: show }),
  setSkyboxUpperSquish: (value) => set({ skyboxUpperSquish: value }),
  setSkyboxLowerSquish: (value) => set({ skyboxLowerSquish: value }),
  setSkyboxHorizonStretch: (value) => set({ skyboxHorizonStretch: value }),
  setSkyboxHorizonBias: (value) => set({ skyboxHorizonBias: value }),
  setSkyboxRotation: (value) => set({ skyboxRotation: value }),
  setDroneDelay: (value) => set({ droneDelay: value }),
}));
