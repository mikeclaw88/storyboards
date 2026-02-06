import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../stores/gameStore';
import { useTerrainStore } from '../stores/terrainStore';
import { useDebugStore } from '../stores/debugStore';
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

// Drone mode constants
const DRONE_PAN_SPEED = 30; // units per second at full joystick deflection
const DRONE_ELEV_SPEED = 20; // slower than pan for control
const DRONE_YAW_SPEED = 1.5; // radians per second at full deflection
const DRONE_MIN_GROUND_CLEARANCE = 2; // minimum height above terrain

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
  const droneMode = useGameStore((s) => s.droneMode);
  const droneJoystick = useGameStore((s) => s.droneJoystick);
  const droneElevation = useGameStore((s) => s.droneElevation);
  const droneYaw = useGameStore((s) => s.droneYaw);

  const getTerrainHeight = useTerrainStore((s) => s.getHeightAtWorldPosition);
  const droneDelay = useDebugStore((s) => s.droneDelay);

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
  // Track when ball flight started (elapsed time)
  const flightStartTime = useRef<number | null>(null);
  // Drone mode: accumulated joystick pan offset
  const droneOffset = useRef(new Vector3());
  const droneBasePos = useRef(new Vector3());
  const droneBaseLookAt = useRef(new Vector3());
  const droneYawAngle = useRef(0);
  const wasDroneMode = useRef(false);

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

  useFrame((state, delta) => {
    if (freeRoam || !controlsRef.current || !courseReady) return;
    const controls = controlsRef.current;
    const dt = Math.min(delta, 0.1);
    const elapsed = state.clock.getElapsedTime();

    const playerPos = new Vector3(ballStartPosition[0], ballStartPosition[1], ballStartPosition[2]);
    const holeV = new Vector3(holePosition[0], holePosition[1], holePosition[2]);

    const ballV = new Vector3(ball.position[0], ball.position[1], ball.position[2]);

    const isBallFlying = ball.isFlying && swingPhase === 'swinging';

    // Reset flight start time when ball stops flying
    if (!isBallFlying) {
      flightStartTime.current = null;
    }

    // Detect if ballStartPosition changed (shot transition — player moved)
    const bsp = ballStartPosition;
    const lbs = lastBallStart.current;
    const ballStartMoved = bsp[0] !== lbs[0] || bsp[1] !== lbs[1] || bsp[2] !== lbs[2];
    if (ballStartMoved) {
      lastBallStart.current = [...bsp];
    }

    // Accumulate joystick pan + elevation + yaw in drone mode
    if (droneMode) {
      const [jx, jz] = droneJoystick;
      droneOffset.current.x += jx * DRONE_PAN_SPEED * dt;
      droneOffset.current.z += jz * DRONE_PAN_SPEED * dt;
      droneOffset.current.y += droneElevation * DRONE_ELEV_SPEED * dt;
      droneYawAngle.current += droneYaw * DRONE_YAW_SPEED * dt;
    }

    // Reset offset when leaving drone mode
    if (!droneMode && droneOffset.current.lengthSq() > 0) {
      droneOffset.current.set(0, 0, 0);
    }

    // Detect drone mode transitions — seed from current camera for smooth transition
    if (droneMode !== wasDroneMode.current) {
      if (droneMode) {
        // Entering: capture current camera as base, reset offset + yaw
        droneBasePos.current.copy(camera.position);
        droneBaseLookAt.current.copy(controls.target);
        droneOffset.current.set(0, 0, 0);
        droneYawAngle.current = 0;
      }
      dronePos.current.copy(camera.position);
      droneLookAt.current.copy(controls.target);
      posVel.current.set(0, 0, 0);
      lookVel.current.set(0, 0, 0);
      droneActive.current = true;
      settled.current = 0;
      wasDroneMode.current = droneMode;
    }

    let desiredPos: Vector3;
    let desiredLookAt: Vector3;
    let posSmoothTime: number;
    let lookSmoothTime: number;

    if (isBallFlying) {
      // Use horizontal velocity only — camera shouldn't dive with the ball
      const horizVel = new Vector3(ball.velocity[0], 0, ball.velocity[2]);
      const horizSpeed = horizVel.length();
      const toHole = holeV.clone().sub(ballV);
      toHole.y = 0;
      const toHoleDir = toHole.length() > 0.1 ? toHole.normalize() : new Vector3(0, 0, 1);
      const flightDir = horizSpeed > 1
        ? horizVel.normalize()
        : toHoleDir.clone();

      // How long has the ball been flying?
      const flightElapsed = flightStartTime.current !== null
        ? elapsed - flightStartTime.current
        : 0;

      if (flightElapsed < droneDelay) {
        // WAIT PHASE: camera stays frozen at tee, gently tracks ball with look-at
        desiredPos = camera.position.clone();
        desiredLookAt = ballV.clone();
        posSmoothTime = 1.0;    // frozen position
        lookSmoothTime = 0.4;   // gentle look-at tracking
      } else {
        // CHASE PHASE: ground-level chase behind ball
        const chaseDist = 15 + horizSpeed * 0.1;

        const chasePos = ballV.clone()
          .sub(flightDir.clone().multiplyScalar(chaseDist));

        // Match ball height so the drone never has to look steeply up
        const groundHeight = getTerrainHeight(chasePos.x, chasePos.z);
        chasePos.y = Math.max(ballV.y, groundHeight + 2.5);

        desiredPos = chasePos;
        desiredLookAt = ballV.clone();
        posSmoothTime = 0.5;
        lookSmoothTime = 0.15;
      }
    } else if (droneMode) {
      // Free-fly: base position + accumulated offset, view rotated by yaw
      desiredPos = droneBasePos.current.clone().add(droneOffset.current);
      // Clamp camera Y to terrain + minimum clearance
      const groundH = getTerrainHeight(desiredPos.x, desiredPos.z);
      desiredPos.y = Math.max(desiredPos.y, groundH + DRONE_MIN_GROUND_CLEARANCE);
      // Rotate original view direction by accumulated yaw
      const viewDir = droneBaseLookAt.current.clone().sub(droneBasePos.current);
      const cosY = Math.cos(droneYawAngle.current);
      const sinY = Math.sin(droneYawAngle.current);
      const rx = viewDir.x * cosY - viewDir.z * sinY;
      const rz = viewDir.x * sinY + viewDir.z * cosY;
      desiredLookAt = desiredPos.clone().add(new Vector3(rx, viewDir.y, rz));
      posSmoothTime = 0.15;   // snappy response
      lookSmoothTime = 0.15;
    } else {
      // Normal tee-behind position
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
      flightStartTime.current = elapsed;
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

      if (!isBallFlying && !droneMode) {
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
