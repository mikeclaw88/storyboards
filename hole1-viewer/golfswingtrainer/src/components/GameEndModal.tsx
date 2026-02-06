import { useGameStore } from '../stores/gameStore';

export function GameEndModal() {
  const gameComplete = useGameStore((s) => s.gameComplete);
  const currentShot = useGameStore((s) => s.currentShot);
  const stopPlay = useGameStore((s) => s.stopPlay);

  if (!gameComplete) return null;

  const isHoleInOne = currentShot === 1;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
      onClick={stopPlay}
    >
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4 font-mono">
          {isHoleInOne ? 'HOLE IN ONE!' : 'HOLE COMPLETE'}
        </h2>
        <p className="text-2xl text-[#4ade80] font-mono font-bold mb-4">
          {currentShot} {currentShot === 1 ? 'STROKE' : 'STROKES'}
        </p>
        <p className="text-lg text-gray-400 font-mono uppercase tracking-widest">
          Tap to return to menu
        </p>
      </div>
    </div>
  );
}
