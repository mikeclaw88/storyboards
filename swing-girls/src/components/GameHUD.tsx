import { useGameStore } from '../stores/gameStore';
import { metersToYards } from '../utils/ballPhysics';

const SURFACE_COLORS: Record<string, string> = {
  Rough: 'text-green-800',
  Fairway: 'text-green-400',
  Green: 'text-green-500',
  Sand: 'text-yellow-400',
  OB: 'text-red-500',
};

const SHOT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  straight: { label: 'STRAIGHT', color: 'text-white' },
  draw: { label: 'DRAW', color: 'text-cyan-400' },
  fade: { label: 'FADE', color: 'text-amber-400' },
  big_draw: { label: 'BIG DRAW', color: 'text-cyan-300' },
  big_fade: { label: 'BIG FADE', color: 'text-amber-300' },
  push: { label: 'PUSH', color: 'text-orange-400' },
  pull: { label: 'PULL', color: 'text-orange-400' },
};

function getPowerLabel(power: number): { label: string; color: string } {
  if (power >= 95) return { label: 'PERFECT', color: 'text-yellow-400' };
  if (power >= 80) return { label: 'GREAT', color: 'text-green-400' };
  if (power >= 60) return { label: 'GOOD', color: 'text-blue-400' };
  if (power >= 40) return { label: 'WEAK', color: 'text-gray-400' };
  return { label: 'DUFF', color: 'text-red-400' };
}

export function GameHUD() {
  const currentShot = useGameStore((s) => s.currentShot);
  const maxShots = useGameStore((s) => s.maxShots);
  const totalScore = useGameStore((s) => s.totalScore);
  const swingResult = useGameStore((s) => s.swingResult);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const gameComplete = useGameStore((s) => s.gameComplete);
  const nextShot = useGameStore((s) => s.nextShot);
  const ball = useGameStore((s) => s.ball);

  // Show result after swing finishes, but not when game is complete (GameEndModal takes over)
  const showResult = swingPhase === 'finished' && swingResult && !gameComplete;

  // Show live distance during flight
  const isInFlight = swingPhase === 'swinging' && ball.isFlying;
  const distanceYards = Math.round(metersToYards(ball.distanceTraveled));

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

        {/* Live flight tracker */}
        {isInFlight && distanceYards > 0 && (
          <div className="mt-3 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
            <span className="text-2xl font-bold tabular-nums text-white">{distanceYards}</span>
            <span className="text-sm text-gray-400 ml-1">yds</span>
          </div>
        )}

        {/* Shot Result Popup */}
        {showResult && (
          <div className="mt-4 bg-black/70 p-4 rounded-lg backdrop-blur-md border border-[#4ade80] animate-in fade-in slide-in-from-left-4 duration-300 w-64 pointer-events-auto relative z-50">
            {/* Header: SHOT # + shot type badge */}
            <div className="flex items-center justify-between mb-2 border-b border-gray-600 pb-2">
              <span className="text-lg font-bold text-white">SHOT {currentShot}</span>
              {swingResult.shotType && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${SHOT_TYPE_CONFIG[swingResult.shotType]?.color || 'text-white'} bg-white/10`}>
                  {SHOT_TYPE_CONFIG[swingResult.shotType]?.label || swingResult.shotType.toUpperCase()}
                </span>
              )}
            </div>

            <div className="space-y-1.5 mb-4">
              {/* Distance */}
              <div className="flex justify-between">
                <span className="text-gray-400">Distance:</span>
                <span className="text-white font-bold">{distanceYards} yds</span>
              </div>

              {/* To Pin */}
              <div className="flex justify-between">
                <span className="text-gray-400">To Pin:</span>
                <span className="text-white font-bold">{Math.round(metersToYards(swingResult.distanceToHole || 0))} yds</span>
              </div>

              {/* Surface */}
              <div className="flex justify-between">
                <span className="text-gray-400">Surface:</span>
                <span className={`${SURFACE_COLORS[swingResult.surface] || 'text-white'} font-bold`}>{swingResult.surface || 'Unknown'}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700 pt-1.5" />

              {/* Power % + label */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Power:</span>
                <span className="flex items-center gap-2">
                  <span className="text-white font-bold">{Math.round(swingResult.power)}%</span>
                  <span className={`text-xs font-bold ${getPowerLabel(swingResult.power).color}`}>
                    {getPowerLabel(swingResult.power).label}
                  </span>
                </span>
              </div>

              {/* Accuracy */}
              <div className="flex justify-between">
                <span className="text-gray-400">Accuracy:</span>
                <span className="text-white font-bold">{Math.round(swingResult.accuracy)}%</span>
              </div>

              {/* Sidespin — only show if non-trivial */}
              {Math.abs(swingResult.sidespin) >= 0.05 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Curve:</span>
                  <span className="flex items-center gap-1">
                    <span className={`font-bold ${swingResult.sidespin < 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {swingResult.sidespin < 0 ? '◀' : '▶'} {Math.round(Math.abs(swingResult.sidespin) * 100)}%
                    </span>
                  </span>
                </div>
              )}

              {/* Divider + Points */}
              <div className="border-t border-gray-700 pt-1.5" />
              <div className="flex justify-between">
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
