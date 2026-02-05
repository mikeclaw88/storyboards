import { useGameStore } from '../stores/gameStore';

export function GameEndModal() {
  const gameComplete = useGameStore((s) => s.gameComplete);
  const startPlay = useGameStore((s) => s.startPlay);

  if (!gameComplete) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
      onClick={startPlay}
    >
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4 font-mono">ROUND COMPLETE</h2>
        <p className="text-lg text-[#4ade80] font-mono uppercase tracking-widest">Tap to play another round</p>
      </div>
    </div>
  );
}
