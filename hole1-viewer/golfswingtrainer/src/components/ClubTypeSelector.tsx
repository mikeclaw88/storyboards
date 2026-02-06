import { useGameStore } from '../stores/gameStore';
import { getCharacterSwingTypes } from '../stores/videoConfigStore';
import { playUIClick } from '../utils/audioManager';

const CLUB_TYPE_LABELS: Record<string, string> = {
  driver: 'Driver',
  iron: 'Iron',
};

/**
 * Club type selector with up/down arrows
 * Only visible when character has multiple swing types (driver, iron)
 */
export function ClubTypeSelector() {
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  const selectedClubType = useGameStore((s) => s.selectedClubType);
  const nextClubType = useGameStore((s) => s.nextClubType);
  const prevClubType = useGameStore((s) => s.prevClubType);

  const availableTypes = getCharacterSwingTypes(selectedCharacter);

  // Don't render if only one club type available
  if (availableTypes.length <= 1) {
    return null;
  }

  const handlePrev = () => {
    playUIClick();
    prevClubType();
  };

  const handleNext = () => {
    playUIClick();
    nextClubType();
  };

  return (
    <div className="club-type-selector">
      <button
        onClick={handlePrev}
        className="club-type-arrow club-type-arrow-up"
        aria-label="Previous club type"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <span className="club-type-label">
        {CLUB_TYPE_LABELS[selectedClubType] || selectedClubType}
      </span>
      <button
        onClick={handleNext}
        className="club-type-arrow club-type-arrow-down"
        aria-label="Next club type"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
