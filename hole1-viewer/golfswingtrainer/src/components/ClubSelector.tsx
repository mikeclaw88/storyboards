import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { CLUBS, CLUB_MAP } from '../config/clubs';

export function ClubSelector() {
  const [expanded, setExpanded] = useState(false);
  const selectedClub = useGameStore((s) => s.selectedClub);
  const setClub = useGameStore((s) => s.setClub);
  const swingPhase = useGameStore((s) => s.swingPhase);

  const disabled = swingPhase !== 'ready';
  const current = CLUB_MAP[selectedClub];

  return (
    <div className="font-mono">
      {/* Expanded list — opens upward */}
      {expanded && !disabled && (
        <div className="mb-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden w-44">
          {CLUBS.map((club) => {
            const isSelected = club.id === selectedClub;
            return (
              <button
                key={club.id}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-lg transition-colors
                  ${isSelected ? 'bg-[#4ade80]/20 text-[#4ade80]' : 'text-white/80 hover:bg-white/10 active:bg-white/20'}
                `}
                onClick={() => {
                  setClub(club.id);
                  setExpanded(false);
                }}
              >
                <span className="font-bold">{club.shortName}</span>
                <span className="text-sm text-gray-400">{club.maxRange}y</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Collapsed pill */}
      <button
        className={`
          flex items-center gap-3 px-5 py-3 rounded-full text-lg font-bold transition-colors
          ${disabled
            ? 'bg-black/30 text-white/30 cursor-not-allowed'
            : 'bg-black/60 text-white hover:bg-black/80 active:bg-black/90 backdrop-blur-sm border border-white/20'}
        `}
        onClick={() => !disabled && setExpanded(!expanded)}
      >
        <span>{current.shortName}</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-300">{current.maxRange}y</span>
      </button>
    </div>
  );
}
