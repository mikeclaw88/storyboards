import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GolfBall } from './GolfBall';
import { GolfTee, TEE_HEIGHT } from './GolfTee';
import { useSceneConfig } from '../hooks/useSceneConfig';

/**
 * Golf tee (small peg) - only visible in play mode, hidden on shots > 1
 * Position is determined by TeeBox + Tee relative position from scene config
 */
export function DynamicGolfTee() {
  const screenMode = useGameStore((s) => s.screenMode);
  const currentShot = useGameStore((s) => s.currentShot);
  const { getTeeNode, getTeeWorldPosition } = useSceneConfig();

  // Hide tee on fairway shots (shot 2+)
  if (screenMode !== 'playing' || currentShot > 1) {
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
 * Shot 1: on tee. Shot 2+: at ballStartPosition from store.
 */
export function DynamicGolfBall() {
  const screenMode = useGameStore((s) => s.screenMode);
  const currentShot = useGameStore((s) => s.currentShot);
  const ballStartPosition = useGameStore((s) => s.ballStartPosition);
  const updateBallPosition = useGameStore((s) => s.updateBallPosition);
  const { getTeeWorldPosition } = useSceneConfig();

  const teeWorldPos = getTeeWorldPosition();

  // Sync store's ball position with actual tee position on shot 1
  // so HUD "To Pin" distance is correct from the start
  useEffect(() => {
    if (screenMode === 'playing' && currentShot === 1) {
      const pos: [number, number, number] = [
        teeWorldPos.x,
        teeWorldPos.y + TEE_HEIGHT + 0.02,
        teeWorldPos.z,
      ];
      updateBallPosition(pos);
    }
  }, [screenMode, currentShot, teeWorldPos.x, teeWorldPos.y, teeWorldPos.z]);

  if (screenMode !== 'playing') {
    return null;
  }

  let adjustedBallConfig;

  if (currentShot > 1) {
    // Subsequent shots: ball starts from where it landed
    adjustedBallConfig = {
      position: {
        x: ballStartPosition[0],
        y: ballStartPosition[1],
        z: ballStartPosition[2],
      },
    };
  } else {
    // Shot 1: Ball sits on top of tee
    adjustedBallConfig = {
      position: {
        x: teeWorldPos.x,
        y: teeWorldPos.y + TEE_HEIGHT + 0.02,
        z: teeWorldPos.z,
      },
    };
  }

  return <GolfBall ballConfig={adjustedBallConfig} />;
}
