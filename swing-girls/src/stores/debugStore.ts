import { create } from 'zustand';

interface DebugState {
  showWireframe: boolean;
  splatSwitchDistance: number;
  setShowWireframe: (show: boolean) => void;
  toggleWireframe: () => void;
  setSplatSwitchDistance: (dist: number) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  showWireframe: false,
  splatSwitchDistance: 150, // Default switch distance (meters)
  
  setShowWireframe: (show) => set({ showWireframe: show }),
  toggleWireframe: () => set((state) => ({ showWireframe: !state.showWireframe })),
  setSplatSwitchDistance: (dist) => set({ splatSwitchDistance: dist }),
}));
