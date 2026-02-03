import { create } from 'zustand';

interface DebugState {
  showWireframe: boolean;
  splatSwitchDistance: number;
  teeSplatOffset: { x: number; y: number; z: number };
  greenSplatOffset: { x: number; y: number; z: number };
  setShowWireframe: (show: boolean) => void;
  toggleWireframe: () => void;
  setSplatSwitchDistance: (dist: number) => void;
  setTeeSplatOffset: (axis: 'x' | 'y' | 'z', value: number) => void;
  setGreenSplatOffset: (axis: 'x' | 'y' | 'z', value: number) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  showWireframe: false,
  splatSwitchDistance: 150,
  teeSplatOffset: { x: 0, y: 0, z: 0 },
  greenSplatOffset: { x: 0, y: 0, z: 0 },
  
  setShowWireframe: (show) => set({ showWireframe: show }),
  toggleWireframe: () => set((state) => ({ showWireframe: !state.showWireframe })),
  setSplatSwitchDistance: (dist) => set({ splatSwitchDistance: dist }),
  setTeeSplatOffset: (axis, value) => set((state) => ({
    teeSplatOffset: { ...state.teeSplatOffset, [axis]: value }
  })),
  setGreenSplatOffset: (axis, value) => set((state) => ({
    greenSplatOffset: { ...state.greenSplatOffset, [axis]: value }
  })),
}));
