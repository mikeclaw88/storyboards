import { useGameStore } from '../stores/gameStore';

const SURFACE_COLORS: Record<string, string> = {
  Rough: 'text-green-800',
  Fairway: 'text-green-400',
  Green: 'text-green-500',
  Sand: 'text-yellow-400',
  OB: 'text-red-500',
};

export function GameHUD() {
  const currentShot = useGameStore((s) => s.currentShot);
  const maxShots = useGameStore((s) => s.maxShots);
  const totalScore = useGameStore((s) => s.totalScore);
  const swingResult = useGameStore((s) => s.swingResult);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const gameComplete = useGameStore((s) => s.gameComplete);
  const nextShot = useGameStore((s) => s.nextShot);

  // Show result after swing finishes, but not when game is complete (GameEndModal takes over)
  const showResult = swingPhase === 'finished' && swingResult && !gameComplete;

  return (
    <>
      {/* Full screen click handler for next shot */}
      {showResult && (
        <div 
          className="fixed inset-0 z-50 cursor-pointer"
          onClick={nextShot}
        />
      )}

      <div className="absolute top-6 left-6 z-50 font-mono text-white pointer-events-none">
        {/* Scoreboard */}
        <div className="bg-black/50 p-4 rounded-lg backdrop-blur-sm border border-white/20 pointer-events-auto">
          <div className="text-xl font-bold mb-2 text-[#4ade80]">SCORE: {totalScore}</div>
          <div className="text-sm text-gray-300">
            SHOT: {currentShot} / {maxShots}
          </div>
        </div>

        {/* Shot Result Popup */}
        {showResult && (
          <div className="mt-4 bg-black/70 p-4 rounded-lg backdrop-blur-md border border-[#4ade80] animate-in fade-in slide-in-from-left-4 duration-300 w-64 pointer-events-auto relative z-50">
            <div className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1">SHOT {currentShot}</div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Distance:</span>
                <span className="text-white font-bold">{Math.round(swingResult.distanceTraveled || 0)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">To Pin:</span>
                <span className="text-white font-bold">{Math.round(swingResult.distanceToHole || 0)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Surface:</span>
                <span className={`${SURFACE_COLORS[swingResult.surface] || 'text-white'} font-bold`}>{swingResult.surface || 'Unknown'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-400">Points:</span>
                <span className="text-[#4ade80] font-bold text-lg">+{swingResult.shotScore}</span>
              </div>
            </div>

            <button 
              className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold py-2 rounded transition-colors"
            >
              {currentShot >= maxShots ? "TAP TO FINISH" : "TAP TO CONTINUE"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
