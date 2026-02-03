import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../stores/gameStore';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface AimControllerProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

/**
 * Syncs camera azimuthal angle to game store for aim-based ball physics.
 * Updates aimAngle during ready phase so ball flies in camera direction.
 */
export function AimController({ controlsRef }: AimControllerProps) {
  const screenMode = useGameStore((s) => s.screenMode);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const setAimAngle = useGameStore((s) => s.setAimAngle);

  useFrame(() => {
    if (!controlsRef.current || screenMode !== 'playing') return;

    // Only update aim angle during ready phase (when player can aim)
    if (swingPhase === 'ready') {
      // Camera azimuthal angle is camera's position around target
      // Add PI to get aim direction (opposite of camera position)
      const aimAngle = controlsRef.current.getAzimuthalAngle() + Math.PI;
      setAimAngle(aimAngle);
    }
  });

  return null;
}
