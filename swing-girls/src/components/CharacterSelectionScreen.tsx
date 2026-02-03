import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { NavigationArrow } from './NavigationArrow';
import { CharacterNameDisplay } from './CharacterNameDisplay';

const SWIPE_THRESHOLD = 50;

/**
 * Full-screen character selection UI with navigation arrows,
 * character name display, and play button
 */
export function CharacterSelectionScreen() {
  const nextCharacter = useGameStore((s) => s.nextCharacter);
  const prevCharacter = useGameStore((s) => s.prevCharacter);

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) >= SWIPE_THRESHOLD) {
      if (diff > 0) {
        nextCharacter();
      } else {
        prevCharacter();
      }
    }

    touchStartX.current = null;
  }, [nextCharacter, prevCharacter]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevCharacter();
    } else if (e.key === 'ArrowRight') {
      nextCharacter();
    }
  }, [nextCharacter, prevCharacter]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTouchStart, handleTouchEnd, handleKeyDown]);

  return (
    <>
      {/* Navigation arrows - vertically centered */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
        <NavigationArrow direction="left" onClick={prevCharacter} />
      </div>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10">
        <NavigationArrow direction="right" onClick={nextCharacter} />
      </div>

      {/* Character name - positioned above character */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <CharacterNameDisplay />
      </div>
    </>
  );
}
