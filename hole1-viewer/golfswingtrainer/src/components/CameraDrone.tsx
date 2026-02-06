import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../stores/gameStore';
import { smoothDampVec3 } from '../utils/smoothDamp';

interface CameraDroneProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  freeRoam: boolean;
  onFollowStateChange?: (following: boolean) => void;
  onCenterAzimuthChange?: (azimuth: number) => void;
}

const SETTLED_DISTANCE = 0.05;
const SETTLED_FRAMES = 10;

// Base camera: behind player along course line
const BASE_BACK = 5;
const BASE_UP = 2;
const LOOK_UP = 1;

export function CameraDrone({
  controlsRef,
  freeRoam,
  onFollowStateChange,
  onCenterAzimuthChange,
}: CameraDroneProps) {
  const { camera } = useThree();

  const ball = useGameStore((s) => s.ball);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const ballStartPosition = useGameStore((s) => s.ballStartPosition);
  const holePosition = useGameStore((s) => s.holePosition);
  const courseReady = useGameStore((s) => s.courseReady);

  const dronePos = useRef(new Vector3());
  const droneLookAt = useRef(new Vector3());
  const posVel = useRef(new Vector3());
  const lookVel = useRef(new Vector3());
  const droneActive = useRef(true);
  const settled = useRef(0);
  const wasFollowing = useRef(false);
  const initialized = useRef(false);
  // Track ballStartPosition so we know when player moved (shot transition)
  const lastBallStart = useRef<[number, number, number]>([0, 0, 0]);

  function getBehind(playerPos: Vector3, holeV: Vector3): Vector3 {
    const dir = playerPos.clone().sub(holeV);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);
    dir.normalize();
    return dir;
  }

  // Snap on first courseReady
  useEffect(() => {
    if (!courseReady || freeRoam || !controlsRef.current || initialized.current) return;

    const playerPos = new Vector3(ballStartPosition[0], ballStartPosition[1], ballStartPosition[2]);
    const holeV = new Vector3(holePosition[0], holePosition[1], holePosition[2]);
    const behind = getBehind(playerPos, holeV);

    const pos = playerPos.clone().add(behind.multiplyScalar(BASE_BACK)).add(new Vector3(0, BASE_UP, 0));
    const target = playerPos.clone().add(new Vector3(0, LOOK_UP, 0));

    dronePos.current.copy(pos);
    droneLookAt.current.copy(target);
    posVel.current.set(0, 0, 0);
    lookVel.current.set(0, 0, 0);

    camera.position.copy(pos);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
    onCenterAzimuthChange?.(controlsRef.current.getAzimuthalAngle());

    droneActive.current = true;
    settled.current = 0;
    initialized.current = true;
    lastBallStart.current = [...ballStartPosition];
  }, [courseReady]);

  useFrame((_state, delta) => {
    if (freeRoam || !controlsRef.current || !courseReady) return;
    const controls = controlsRef.current;
    const dt = Math.min(delta, 0.1);

    const playerPos = new Vector3(ballStartPosition[0], ballStartPosition[1], ballStartPosition[2]);
    const holeV = new Vector3(holePosition[0], holePosition[1], holePosition[2]);
    const ballV = new Vector3(ball.position[0], ball.position[1], ball.position[2]);

    const isBallFlying = ball.isFlying && swingPhase === 'swinging';

    // Detect if ballStartPosition changed (shot transition — player moved)
    const bsp = ballStartPosition;
    const lbs = lastBallStart.current;
    const ballStartMoved = bsp[0] !== lbs[0] || bsp[1] !== lbs[1] || bsp[2] !== lbs[2];
    if (ballStartMoved) {
      lastBallStart.current = [...bsp];
    }

    let desiredPos: Vector3;
    let desiredLookAt: Vector3;
    let posSmoothTime: number;
    let lookSmoothTime: number;

    if (isBallFlying) {
      const vel = new Vector3(ball.velocity[0], ball.velocity[1], ball.velocity[2]);
      const speed = vel.length();
      const toHole = holeV.clone().sub(ballV);
      toHole.y = 0;
      const toHoleDir = toHole.length() > 0.1 ? toHole.normalize() : new Vector3(0, 0, 1);

      const flightDir = speed > 1
        ? vel.clone().normalize()
        : toHoleDir.clone();

      // Camera: behind ball, higher up, further back
      const followDist = 12 + speed * 0.15;
      const followHeight = 8 + ball.position[1] * 0.3;

      desiredPos = ballV.clone()
        .sub(flightDir.clone().multiplyScalar(followDist))
        .add(new Vector3(0, followHeight, 0));
      if (desiredPos.y < 3) desiredPos.y = 3;

      // Look at ball with a small fixed nudge forward (max 5 units)
      // so hole direction is slightly ahead in frame, but ball stays centered
      desiredLookAt = ballV.clone().add(toHoleDir.clone().multiplyScalar(5));
      posSmoothTime = 0.3;
      lookSmoothTime = 0.15;
    } else {
      const behind = getBehind(playerPos, holeV);
      desiredPos = playerPos.clone().add(behind.multiplyScalar(BASE_BACK)).add(new Vector3(0, BASE_UP, 0));
      desiredLookAt = playerPos.clone().add(new Vector3(0, LOOK_UP, 0));
      posSmoothTime = 0.8;
      lookSmoothTime = 0.5;
    }

    // Re-activate drone ONLY when:
    // 1. Ball starts flying (swing launched) — seed from current orbit position, spring to ball
    // 2. Player position changed (shot transition) — snap to new base instantly (no spring wobble)
    // NEVER re-activate just because user orbited away — that's aiming, not a drone event.
    if (!droneActive.current && isBallFlying) {
      dronePos.current.copy(camera.position);
      droneLookAt.current.copy(controls.target);
      posVel.current.set(0, 0, 0);
      lookVel.current.set(0, 0, 0);
      droneActive.current = true;
      settled.current = 0;
    }
    if (ballStartMoved) {
      // Snap camera to new base position — no spring animation for shot transitions
      dronePos.current.copy(desiredPos);
      droneLookAt.current.copy(desiredLookAt);
      posVel.current.set(0, 0, 0);
      lookVel.current.set(0, 0, 0);
      camera.position.copy(desiredPos);
      controls.target.copy(desiredLookAt);
      droneActive.current = true;
      settled.current = 0;
    }

    if (droneActive.current) {
      smoothDampVec3(dronePos.current, desiredPos, posVel.current, posSmoothTime, dt);
      smoothDampVec3(droneLookAt.current, desiredLookAt, lookVel.current, lookSmoothTime, dt);

      camera.position.copy(dronePos.current);
      controls.target.copy(droneLookAt.current);

      if (!isBallFlying) {
        const err = dronePos.current.distanceTo(desiredPos);
        if (err < SETTLED_DISTANCE && posVel.current.length() < 0.01) {
          settled.current++;
        } else {
          settled.current = 0;
        }
        if (settled.current >= SETTLED_FRAMES) {
          droneActive.current = false;
          onCenterAzimuthChange?.(controls.getAzimuthalAngle());
        }
      } else {
        settled.current = 0;
      }

      const following = droneActive.current && isBallFlying;
      if (following !== wasFollowing.current) {
        wasFollowing.current = following;
        onFollowStateChange?.(following);
      }
    }

    controls.update();
  });

  return null;
}
