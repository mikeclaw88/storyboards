import { useGameStore } from '../stores/gameStore';
import { metersToYards } from '../utils/ballPhysics';

/**
 * Display swing result scores
 */
export function SwingResult() {
  const swingResult = useGameStore((s) => s.swingResult);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const ball = useGameStore((s) => s.ball);
  const gameMode = useGameStore((s) => s.gameMode);

  // Hide in topgolf mode - TopgolfShotResult handles display
  if (gameMode === 'topgolf') {
    return null;
  }

  if (!swingResult || swingPhase === 'ready' || swingPhase === 'pulling') {
    return null;
  }

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'Perfect!', color: 'text-yellow-400' };
    if (score >= 70) return { grade: 'Great!', color: 'text-green-400' };
    if (score >= 50) return { grade: 'Good', color: 'text-blue-400' };
    return { grade: 'Miss', color: 'text-gray-400' };
  };

  const { grade, color } = getGrade(swingResult.score);

  const distanceYards = Math.round(metersToYards(ball.distanceTraveled));

  return (
    <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: '160px' }}>
      {/* Grade */}
      <div className={`text-5xl font-bold ${color} drop-shadow-lg animate-bounce`}>
        {grade}
      </div>

      {/* Scores */}
      <div className="mt-3 bg-white/30 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-orange-500">
              {Math.round(swingResult.power)}
            </div>
            <div className="text-xs text-gray-500 uppercase">Power</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">
              {Math.round(swingResult.accuracy)}
            </div>
            <div className="text-xs text-gray-500 uppercase">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">
              {swingResult.score}
            </div>
            <div className="text-xs text-gray-500 uppercase">Score</div>
          </div>
        </div>

        {/* Distance - shown when ball has landed */}
        {swingPhase === 'finished' && ball.distanceTraveled > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-3xl font-bold text-purple-600">
              {distanceYards} yds
            </div>
            <div className="text-xs text-gray-500 uppercase">Distance</div>
          </div>
        )}
      </div>
    </div>
  );
}
