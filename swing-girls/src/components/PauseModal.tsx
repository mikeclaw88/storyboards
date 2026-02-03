import { useGameStore } from '../stores/gameStore';
import { playUIClick } from '../utils/audioManager';

/**
 * Pause modal with continue and back options
 */
export function PauseModal() {
  const isPaused = useGameStore((s) => s.isPaused);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const stopPlay = useGameStore((s) => s.stopPlay);

  if (!isPaused) {
    return null;
  }

  const handleResume = () => {
    playUIClick();
    resumeGame();
  };

  const handleBack = () => {
    playUIClick();
    stopPlay();
  };

  return (
    <div className="pause-overlay">
      <div className="pause-modal">
        <h2 className="pause-title">Paused</h2>
        <div className="pause-buttons">
          <button onClick={handleResume} className="pause-modal-btn continue-btn">
            Continue
          </button>
          <button onClick={handleBack} className="pause-modal-btn back-btn">
            Back to Selection
          </button>
        </div>
      </div>
    </div>
  );
}
