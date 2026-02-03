/**
 * Topgolf HUD - displays shot counter and running score
 */

import { useGameStore } from '../stores/gameStore';
import { TOPGOLF_CONFIG } from '../config/targets';

export function TopgolfHUD() {
  const gameMode = useGameStore((s) => s.gameMode);
  const screenMode = useGameStore((s) => s.screenMode);
  const { currentShot, totalShots, runningScore, gameComplete } = useGameStore((s) => s.topgolf);

  // Only show in topgolf mode during play
  if (gameMode !== 'topgolf' || screenMode !== 'playing') {
    return null;
  }

  const isBonusBall = currentShot === TOPGOLF_CONFIG.totalShots;
  const shotDisplay = gameComplete ? totalShots : currentShot;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-10"
      style={{ top: '60px' }}
    >
      <div
        className="flex items-center gap-4 bg-black/70 text-white rounded-xl shadow-lg"
        style={{ padding: '16px 24px' }}
      >
        {/* Shot */}
        <div className="text-center">
          <div className="text-xs text-white/60 mb-1">SHOT</div>
          <div className={`text-xl font-bold ${isBonusBall ? 'text-yellow-400' : ''}`}>
            {shotDisplay}/{totalShots}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-white/30" style={{ height: '40px' }} />

        {/* Score */}
        <div className="text-center">
          <div className="text-xs text-white/60 mb-1">SCORE</div>
          <div className="text-xl font-bold text-green-400">{runningScore}</div>
        </div>

        {/* Bonus indicator */}
        {isBonusBall && !gameComplete && (
          <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
            2x
          </div>
        )}
      </div>
    </div>
  );
}
