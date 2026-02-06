import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../stores/gameStore';

export type CameraMode = 'TEE_STATIC' | 'PLAY_READY' | 'BALL_FOLLOW' | 'LANDING' | 'FREEROAM';

interface CameraSystemProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  freeRoam: boolean;
  onFollowStateChange?: (following: boolean) => void;
  onCenterAzimuthChange?: (azimuth: number) => void;
}

export function CameraSystem({ controlsRef, freeRoam, onFollowStateChange, onCenterAzimuthChange }: CameraSystemProps) {
  const { camera } = useThree();
  const ball = useGameStore((s) => s.ball);
  const screenMode = useGameStore((s) => s.screenMode);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const holePosition = useGameStore((s) => s.holePosition);
  const teePosition = useGameStore((s) => s.teePosition);
  const courseReady = useGameStore((s) => s.courseReady);

  // Internal State
  const modeRef = useRef<CameraMode>('TEE_STATIC');
  const prevModeRef = useRef<CameraMode>('TEE_STATIC');
  const snappedRef = useRef(false);

  // Snap camera immediately when courseReady first becomes true
  useEffect(() => {
    if (!courseReady || freeRoam || !controlsRef.current) return;

    const teeV = new Vector3(teePosition[0], teePosition[1], teePosition[2]);
    const holeV = new Vector3(holePosition[0], holePosition[1], holePosition[2]);
    const teeToHole = holeV.clone().sub(teeV).normalize();

    // Snap camera to behind tee, looking AT the tee (character position)
    const pos = teeV.clone()
      .sub(teeToHole.clone().multiplyScalar(5))
      .add(new Vector3(0, 2, 0));
    const target = teeV.clone().add(new Vector3(0, 1, 0));

    camera.position.copy(pos);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
    snappedRef.current = true;

    // Set the center azimuth so play mode constraints work
    onCenterAzimuthChange?.(controlsRef.current.getAzimuthalAngle());
  }, [courseReady]);

  // Transition logic
  useEffect(() => {
    if (freeRoam) {
      modeRef.current = 'FREEROAM';
      return;
    }

    if (screenMode === 'selection') {
       modeRef.current = 'TEE_STATIC';
       return;
    }

    // Playing mode
    if (swingPhase === 'swinging' && ball.isFlying) {
      const dx = ball.position[0] - teePosition[0];
      const dz = ball.position[2] - teePosition[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 5) {
        modeRef.current = 'BALL_FOLLOW';
      } else {
        modeRef.current = 'PLAY_READY';
      }
    } else if (swingPhase === 'finished' || (swingPhase === 'swinging' && !ball.isFlying)) {
      if (modeRef.current === 'BALL_FOLLOW') {
        modeRef.current = 'LANDING';
      } else {
        modeRef.current = 'TEE_STATIC';
      }
    } else if (swingPhase === 'ready' || swingPhase === 'pulling') {
      modeRef.current = 'PLAY_READY';
    } else {
      modeRef.current = 'TEE_STATIC';
    }

  }, [swingPhase, ball.isFlying, freeRoam, screenMode, ball.position, teePosition]);

  useFrame((state, delta) => {
    if (freeRoam || !controlsRef.current) return;

    const controls = controlsRef.current;
    const mode = modeRef.current;
    const modeChanged = mode !== prevModeRef.current;

    if (modeChanged) {
      prevModeRef.current = mode;

      // Notify Stage about follow state
      const isFollowing = mode === 'BALL_FOLLOW' || mode === 'LANDING';
      onFollowStateChange?.(isFollowing);
    }

    const ballV = new Vector3(ball.position[0], ball.position[1], ball.position[2]);
    const holeV = new Vector3(holePosition[0], holePosition[1], holePosition[2]);
    const teeV = new Vector3(teePosition[0], teePosition[1], teePosition[2]);

    if (mode === 'TEE_STATIC') {
      if (!courseReady) return;

      // Snap once on mode entry, then let OrbitControls handle user input
      if (modeChanged) {
        const teeToHole = holeV.clone().sub(teeV).normalize();
        const pos = teeV.clone()
          .sub(teeToHole.clone().multiplyScalar(5))
          .add(new Vector3(0, 2, 0));
        const target = teeV.clone().add(new Vector3(0, 1, 0));

        camera.position.copy(pos);
        controls.target.copy(target);
        controls.update();

        onCenterAzimuthChange?.(controls.getAzimuthalAngle());
      }
      // No continuous lerp — user has free orbit within Stage's angle constraints
    }
    else if (mode === 'PLAY_READY') {
      if (!courseReady) return;

      // Snap once on mode entry, then let OrbitControls handle user input
      if (modeChanged) {
        const teeToHole = holeV.clone().sub(teeV).normalize();
        const right = new Vector3().crossVectors(teeToHole, new Vector3(0, 1, 0)).normalize();

        const pos = teeV.clone()
          .sub(teeToHole.clone().multiplyScalar(3))
          .add(new Vector3(0, 1.5, 0))
          .add(right.multiplyScalar(1));

        const target = teeV.clone()
          .add(new Vector3(0, 1, 0))
          .add(teeToHole.clone().multiplyScalar(1));

        camera.position.copy(pos);
        controls.target.copy(target);
        controls.update();

        onCenterAzimuthChange?.(controls.getAzimuthalAngle());
      }
      // No continuous lerp — user has free orbit within Stage's angle constraints
    }
    else if (mode === 'BALL_FOLLOW') {
      // Continuous lerp to track ball in flight
      const velocity = new Vector3(ball.velocity[0], ball.velocity[1], ball.velocity[2]);
      const speed = velocity.length();

      const followDist = 8 + (speed * 0.1);
      const followHeight = 3 + (ball.position[1] * 0.5);

      let direction = velocity.clone().normalize();
      if (speed < 1) {
         direction = holeV.clone().sub(ballV).normalize();
      }

      const desiredPos = ballV.clone()
        .sub(direction.multiplyScalar(followDist))
        .add(new Vector3(0, followHeight, 0));

      if (desiredPos.y < 1) desiredPos.y = 1;

      camera.position.lerp(desiredPos, delta * 3);
      controls.target.lerp(ballV, delta * 5);
    }
    else if (mode === 'LANDING') {
      const desiredPos = ballV.clone().add(new Vector3(5, 5, 5));
      camera.position.lerp(desiredPos, delta * 1);
      controls.target.lerp(ballV, delta * 2);
    }

    controls.update();
  });

  return null;
}
