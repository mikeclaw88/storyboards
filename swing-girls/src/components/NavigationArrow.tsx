import { playUIClick } from '../utils/audioManager';

interface NavigationArrowProps {
  direction: 'left' | 'right';
  onClick: () => void;
}

/**
 * Circular navigation arrow button for character selection
 */
export function NavigationArrow({ direction, onClick }: NavigationArrowProps) {
  const handleClick = () => {
    playUIClick();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="nav-arrow"
      aria-label={direction === 'left' ? 'Previous character' : 'Next character'}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === 'left' ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 6 15 12 9 18" />
        )}
      </svg>
    </button>
  );
}
