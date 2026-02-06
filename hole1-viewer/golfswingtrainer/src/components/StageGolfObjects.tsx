import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GolfBall } from './GolfBall';
import { GolfTee, TEE_HEIGHT } from './GolfTee';

/**
 * Golf tee (small peg) - only visible in play mode, hidden on shots > 1
 * Position is determined by teePosition from gameStore (set by GolfCourseRenderer)
 */
export function DynamicGolfTee() {
  const screenMode = useGameStore((s) => s.screenMode);
  const currentShot = useGameStore((s) => s.currentShot);
  const teePosition = useGameStore((s) => s.teePosition);
  const courseReady = useGameStore((s) => s.courseReady);

  if (!courseReady) return null;

  // Hide tee on fairway shots (shot 2+)
  if (screenMode !== 'playing' || currentShot > 1) {
    return null;
  }

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
  const teePosition = useGameStore((s) => s.teePosition);
  const courseReady = useGameStore((s) => s.courseReady);
  const updateBallPosition = useGameStore((s) => s.updateBallPosition);

  // Sync store's ball position with actual tee position on shot 1
  // so HUD "To Pin" distance is correct from the start
  useEffect(() => {
    if (courseReady && screenMode === 'playing' && currentShot === 1) {
      const pos: [number, number, number] = [
        teePosition[0],
        teePosition[1] + TEE_HEIGHT + 0.02,
        teePosition[2],
      ];
      updateBallPosition(pos);
    }
  }, [screenMode, currentShot, teePosition[0], teePosition[1], teePosition[2], courseReady]);

  if (!courseReady || screenMode !== 'playing') {
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
        x: teePosition[0],
        y: teePosition[1] + TEE_HEIGHT + 0.02,
        z: teePosition[2],
      },
    };
  }

  return <GolfBall ballConfig={adjustedBallConfig} />;
}
