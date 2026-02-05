/**
 * Mode selection UI - Practice mode start button
 */

import { useGameStore } from '../stores/gameStore';
import { playUIClick } from '../utils/audioManager';

export function ModeSelectionUI() {
  const screenMode = useGameStore((s) => s.screenMode);
  const startPlay = useGameStore((s) => s.startPlay);

  // Only show in selection mode
  if (screenMode !== 'selection') {
    return null;
  }

  const handlePractice = () => {
    playUIClick();
    startPlay();
  };

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      <button
        onClick={handlePractice}
        className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ padding: '16px 32px', minWidth: '150px' }}
      >
        <div className="flex flex-col items-center">
          <span className="text-2xl">Play</span>
        </div>
      </button>
    </div>
  );
}
