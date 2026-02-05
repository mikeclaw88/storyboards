import { useGameStore, getCharacterConfig } from '../stores/gameStore';

/**
 * Displays the selected character's name with fade animation
 */
export function CharacterNameDisplay() {
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  const characterConfig = getCharacterConfig(selectedCharacter);

  return (
    <div
      key={selectedCharacter}
      className="character-name character-name-fade"
    >
      {characterConfig.name}
    </div>
  );
}
