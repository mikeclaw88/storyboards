/**
 * Topgolf shot result overlay - shows points earned after each shot
 */

import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';

export function TopgolfShotResult() {
  const gameMode = useGameStore((s) => s.gameMode);
  const screenMode = useGameStore((s) => s.screenMode);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const lastShotResult = useGameStore((s) => s.topgolf.lastShotResult);
  const gameComplete = useGameStore((s) => s.topgolf.gameComplete);
  const [isVisible, setIsVisible] = useState(false);

  // Show result when shot lands
  useEffect(() => {
    if (lastShotResult && swingPhase === 'finished' && !gameComplete) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [lastShotResult, swingPhase, gameComplete]);

  // Only show in topgolf mode during play
  if (gameMode !== 'topgolf' || screenMode !== 'playing') {
    return null;
  }

  if (!isVisible || !lastShotResult) {
    return null;
  }

  const { zone, isCenter, totalPoints, multiplier } = lastShotResult;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ top: '180px' }}>
      <div className="flex flex-col items-center animate-bounce">
        {/* Points */}
        <div className={`
          text-5xl font-bold drop-shadow-lg
          ${totalPoints > 0 ? 'text-green-400' : 'text-white/50'}
        `}>
          +{totalPoints}
        </div>

        {/* Zone info */}
        {zone && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <div
              className="px-3 py-1 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: zone.color }}
            >
              {zone.name} Zone{isCenter ? ' - CENTER!' : ''}
            </div>
            {multiplier > 1 && (
              <div className="text-yellow-400 text-sm font-bold">
                {multiplier}x BONUS BALL!
              </div>
            )}
          </div>
        )}

        {/* Miss */}
        {!zone && (
          <div className="text-white/70 text-lg mt-1">
            Missed targets
          </div>
        )}
      </div>
    </div>
  );
}
