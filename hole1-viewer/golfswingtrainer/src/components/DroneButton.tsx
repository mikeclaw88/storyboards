import { useGameStore } from '../stores/gameStore';

export function DroneButton() {
  const droneMode = useGameStore((s) => s.droneMode);
  const setDroneMode = useGameStore((s) => s.setDroneMode);
  const swingPhase = useGameStore((s) => s.swingPhase);

  if (swingPhase !== 'ready') return null;

  return (
    <button
      className={`
        px-5 py-2 rounded-full text-sm font-bold transition-colors backdrop-blur-sm
        ${droneMode
          ? 'bg-blue-500/60 text-white border border-blue-400'
          : 'bg-black/60 text-white border border-white/20 hover:bg-black/80 active:bg-black/90'}
      `}
      onClick={() => setDroneMode(!droneMode)}
    >
      DRONE
    </button>
  );
}
