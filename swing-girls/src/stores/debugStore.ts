import { create } from 'zustand';

interface DebugState {
  showWireframe: boolean;
  freeRoamCamera: boolean;
  splatSwitchDistance: number;
  teeSplatOffset: { x: number; y: number; z: number };
  greenSplatOffset: { x: number; y: number; z: number };
  setShowWireframe: (show: boolean) => void;
  toggleWireframe: () => void;
  setFreeRoamCamera: (enabled: boolean) => void;
  toggleFreeRoamCamera: () => void;
  setSplatSwitchDistance: (dist: number) => void;
  setTeeSplatOffset: (axis: 'x' | 'y' | 'z', value: number) => void;
  setGreenSplatOffset: (axis: 'x' | 'y' | 'z', value: number) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  showWireframe: false,
  freeRoamCamera: false,
  splatSwitchDistance: 86,
  teeSplatOffset: { x: 0, y: 1, z: 0 },
  greenSplatOffset: { x: 0, y: 1, z: 147 },
  
  setShowWireframe: (show) => set({ showWireframe: show }),
  toggleWireframe: () => set((state) => ({ showWireframe: !state.showWireframe })),
  setFreeRoamCamera: (enabled) => set({ freeRoamCamera: enabled }),
  toggleFreeRoamCamera: () => set((state) => ({ freeRoamCamera: !state.freeRoamCamera })),
  setSplatSwitchDistance: (dist) => set({ splatSwitchDistance: dist }),
  setTeeSplatOffset: (axis, value) => set((state) => ({
    teeSplatOffset: { ...state.teeSplatOffset, [axis]: value }
  })),
  setGreenSplatOffset: (axis, value) => set((state) => ({
    greenSplatOffset: { ...state.greenSplatOffset, [axis]: value }
  })),
}));
