/**
 * Topgolf game end screen - shows final score and shot breakdown
 */

import { useGameStore } from '../stores/gameStore';
import { calculateMaxScore } from '../utils/topgolfScoring';
import { playUIClick } from '../utils/audioManager';

export function TopgolfGameEnd() {
  const gameMode = useGameStore((s) => s.gameMode);
  const screenMode = useGameStore((s) => s.screenMode);
  const { runningScore, shotHistory, gameComplete } = useGameStore((s) => s.topgolf);
  const endTopgolfGame = useGameStore((s) => s.endTopgolfGame);

  // Only show when game is complete
  if (gameMode !== 'topgolf' || screenMode !== 'playing' || !gameComplete) {
    return null;
  }

  const maxScore = calculateMaxScore();
  const percentage = Math.round((runningScore / maxScore) * 100);

  // Performance rating
  let rating = 'Keep practicing!';
  if (percentage >= 80) rating = 'Amazing!';
  else if (percentage >= 60) rating = 'Great job!';
  else if (percentage >= 40) rating = 'Good effort!';
  else if (percentage >= 20) rating = 'Not bad!';

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
          <p className="text-white/70">{rating}</p>
        </div>

        {/* Final Score */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 mb-6 text-center">
          <div className="text-white/80 text-sm uppercase tracking-wide">Final Score</div>
          <div className="text-5xl font-bold text-white">{runningScore}</div>
          <div className="text-white/60 text-sm mt-1">out of {maxScore} ({percentage}%)</div>
        </div>

        {/* Shot Breakdown */}
        <div className="mb-6">
          <h3 className="text-white/80 text-sm uppercase tracking-wide mb-3">Shot Breakdown</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {shotHistory.map((shot, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm w-8">#{shot.shotNumber}</span>
                  {shot.zone ? (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: shot.zone.color }}
                    >
                      {shot.zone.name}
                      {shot.isCenter && ' *'}
                    </span>
                  ) : (
                    <span className="text-white/40 text-sm">Miss</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {shot.multiplier > 1 && (
                    <span className="text-yellow-400 text-xs">2x</span>
                  )}
                  <span className={`font-medium ${shot.totalPoints > 0 ? 'text-green-400' : 'text-white/40'}`}>
                    +{shot.totalPoints}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={() => {
            playUIClick();
            endTopgolfGame();
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
