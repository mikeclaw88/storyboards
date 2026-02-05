import { useGameStore } from '../stores/gameStore';
import { GolfBall } from './GolfBall';
import { GolfTee, TEE_HEIGHT } from './GolfTee';
import { useSceneConfig } from '../hooks/useSceneConfig';

/**
 * Golf tee (small peg) - only visible in play mode
 * Position is determined by TeeBox + Tee relative position from scene config
 */
export function DynamicGolfTee() {
  const screenMode = useGameStore((s) => s.screenMode);
  const { getTeeNode, getTeeWorldPosition } = useSceneConfig();

  if (screenMode !== 'playing') {
    return null;
  }

  const teeNode = getTeeNode();
  if (!teeNode.visible) {
    return null;
  }

  const teeWorldPos = getTeeWorldPosition();

  // Tee position from scene config (TeeBox + Tee relative offset)
  const teePosition: [number, number, number] = [
    teeWorldPos.x,
    teeWorldPos.y,
    teeWorldPos.z,
  ];

  return <GolfTee position={teePosition} />;
}

/**
 * Golf ball - only visible in play mode
 * Position is determined by TeeBox + Tee relative position from scene config
 */
export function DynamicGolfBall() {
  const screenMode = useGameStore((s) => s.screenMode);
  const { getTeeWorldPosition } = useSceneConfig();

  if (screenMode !== 'playing') {
    return null;
  }

  const teeWorldPos = getTeeWorldPosition();

  // Ball sits on top of tee, using scene config position
  const adjustedBallConfig = {
    position: {
      x: teeWorldPos.x,
      y: teeWorldPos.y + TEE_HEIGHT + 0.02, // Ball center on top of tee cup
      z: teeWorldPos.z,
    },
  };

  return <GolfBall ballConfig={adjustedBallConfig} />;
}
