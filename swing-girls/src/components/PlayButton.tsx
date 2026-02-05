import { useGameStore } from '../stores/gameStore';

/**
 * Large game-style PLAY button for character selection screen
 */
export function PlayButton() {
  const startPlay = useGameStore((s) => s.startPlay);

  return (
    <button onClick={startPlay} className="play-btn">
      Play
    </button>
  );
}
