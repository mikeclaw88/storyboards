import { useGameStore } from '../stores/gameStore';

export function GameHUD() {
  const shotsRemaining = useGameStore((s) => s.shotsRemaining);
  const maxShots = useGameStore((s) => s.maxShots);
  const totalScore = useGameStore((s) => s.totalScore);
  const swingResult = useGameStore((s) => s.swingResult);
  const swingPhase = useGameStore((s) => s.swingPhase);

  // Show result after swing finishes
  const showResult = swingPhase === 'finished' && swingResult;

  return (
    <div className="absolute top-6 left-6 z-10 font-mono text-white pointer-events-none">
      {/* Scoreboard */}
      <div className="bg-black/50 p-4 rounded-lg backdrop-blur-sm border border-white/20">
        <div className="text-xl font-bold mb-2 text-[#4ade80]">SCORE: {totalScore}</div>
        <div className="text-sm text-gray-300">
          SHOTS: {shotsRemaining} / {maxShots}
        </div>
      </div>

      {/* Shot Result Popup */}
      {showResult && (
        <div className="mt-4 bg-black/70 p-4 rounded-lg backdrop-blur-md border border-[#4ade80] animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="text-lg font-bold text-white mb-1">SHOT RESULT</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-400">Distance:</span>
            <span className="text-white font-bold">{Math.round(swingResult.distanceTraveled || 0)}m</span>
            
            <span className="text-gray-400">To Pin:</span>
            <span className="text-white font-bold">{Math.round(swingResult.distanceToHole || 0)}m</span>
            
            <span className="text-gray-400">Points:</span>
            <span className="text-[#4ade80] font-bold">+{swingResult.shotScore}</span>
          </div>
        </div>
      )}
    </div>
  );
}
