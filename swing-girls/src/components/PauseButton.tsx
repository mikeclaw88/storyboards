import { useGameStore } from '../stores/gameStore';
import { playUIClick } from '../utils/audioManager';

/**
 * Pause button for gameplay screen
 */
export function PauseButton() {
  const pauseGame = useGameStore((s) => s.pauseGame);

  const handleClick = () => {
    playUIClick();
    pauseGame();
  };

  return (
    <button
      onClick={handleClick}
      className="pause-btn"
      aria-label="Pause game"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    </button>
  );
}
