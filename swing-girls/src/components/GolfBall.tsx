import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import { Mesh } from 'three';
import { useGameStore, BUMP_DIRECTION_VECTORS } from '../stores/gameStore';
import { useTerrainStore } from '../stores/terrainStore';
import type { FlightState } from '../utils/ballPhysics';
import {
  updateFlightPosition,
  calculateInitialVelocity,
  calculateDistance,
  createInitialFlightState,
  BALL_RADIUS,
} from '../utils/ballPhysics';
import { detectTargetZone, calculateShotPoints } from '../utils/topgolfScoring';
import { playBallLandingSound } from '../utils/ballLandingAudio';
import type { GolfConfig } from '../config/golf';

interface GolfBallProps {
  ballConfig: GolfConfig['ball'];
}

/**
 * Golf ball with flight physics and trail effect
 */
export function GolfBall({ ballConfig }: GolfBallProps) {
  const meshRef = useRef<Mesh>(null);
  const flightStateRef = useRef<FlightState | null>(null);
  const finalPositionRef = useRef<[number, number, number] | null>(null); // Store final stopped position

  const ball = useGameStore((s) => s.ball);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const swingResult = useGameStore((s) => s.swingResult);
  const aimAngle = useGameStore((s) => s.aimAngle);
  const updateBallPosition = useGameStore((s) => s.updateBallPosition);
  const landBall = useGameStore((s) => s.landBall);
  const gameMode = useGameStore((s) => s.gameMode);
  const currentShot = useGameStore((s) => s.topgolf.currentShot);
  const recordTopgolfShot = useGameStore((s) => s.recordTopgolfShot);
  const spinBumps = useGameStore((s) => s.spinBumps);

  // Get terrain height function for collision detection
  const getTerrainHeight = useTerrainStore((s) => s.getHeightAtWorldPosition);

  // Convert ballConfig to tuple for physics
  const startPosition = useMemo<[number, number, number]>(() => [
    ballConfig.position.x,
    ballConfig.position.y,
    ballConfig.position.z,
  ], [ballConfig]);

  // Initialize flight when ball is launched
  useEffect(() => {
    if (ball.isFlying && swingResult && !flightStateRef.current) {
      const velocity = calculateInitialVelocity(
        swingResult.power,
        swingResult.accuracy,
        swingResult.direction,
        aimAngle
      );
      flightStateRef.current = createInitialFlightState(startPosition, velocity, swingResult.sidespin ?? 0);
    }

    if (!ball.isFlying) {
      flightStateRef.current = null;
    }
  }, [ball.isFlying, swingResult, startPosition, aimAngle]);

  // Track if we've already processed landing for this flight
  const hasLandedRef = useRef(false);

  // Track if spin bumps have been applied for this flight
  const bumpsAppliedRef = useRef(false);

  // Reset landing flag and bumps flag when ball starts flying
  useEffect(() => {
    if (ball.isFlying) {
      hasLandedRef.current = false;
      bumpsAppliedRef.current = false;
    }
  }, [ball.isFlying]);

  // Reset final position when swing resets to ready
  useEffect(() => {
    if (swingPhase === 'ready') {
      finalPositionRef.current = null;
    }
  }, [swingPhase]);

  // Update flight physics each frame
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Process physics while ball is in motion (flying or rolling)
    if (ball.isFlying && flightStateRef.current && flightStateRef.current.phase !== 'stopped' && !hasLandedRef.current) {
      const newState = updateFlightPosition(flightStateRef.current, delta, getTerrainHeight);

      // Play landing sound when ball bounces
      if (newState.justBounced) {
        // Calculate volume: first bounce is 70%, subsequent bounces get quieter
        // Volume decreases exponentially: 0.7, 0.35, 0.175, ...
        const maxVolume = 0.7;
        const baseVolume = Math.min(maxVolume, (newState.impactSpeed / 10) * maxVolume);
        const bounceVolume = baseVolume * Math.pow(0.5, newState.bounceCount - 1);
        // Only play if volume is audible (above 0.05)
        if (bounceVolume > 0.05) {
          playBallLandingSound(bounceVolume);
        }
      }

      // Apply spin bumps on first bounce
      const BUMP_SPEED = 3.0;
      if (newState.justBounced && newState.bounceCount === 1 && !bumpsAppliedRef.current && spinBumps.totalUsed > 0) {
        let bumpX = 0;
        let bumpZ = 0;
        for (let i = 0; i < 8; i++) {
          if (spinBumps.allocations[i] > 0) {
            bumpX += BUMP_DIRECTION_VECTORS[i][0] * spinBumps.allocations[i];
            bumpZ += BUMP_DIRECTION_VECTORS[i][1] * spinBumps.allocations[i];
          }
        }
        // Rotate from grid-relative to world-space using aimAngle
        const cosA = Math.cos(aimAngle);
        const sinA = Math.sin(aimAngle);
        const worldX = bumpX * cosA + bumpZ * sinA;
        const worldZ = -bumpX * sinA + bumpZ * cosA;
        newState.velocity[0] += worldX * BUMP_SPEED;
        newState.velocity[2] += worldZ * BUMP_SPEED;
        bumpsAppliedRef.current = true;
      }

      flightStateRef.current = newState;

      // Update mesh position from physics state
      meshRef.current.position.set(
        newState.position[0],
        newState.position[1],
        newState.position[2]
      );

      // Update store: position + live distance
      const liveDistance = calculateDistance(startPosition, newState.position);
      updateBallPosition(newState.position, liveDistance);

      // In topgolf mode: check if ball touched ground inside a target zone
      // If so, stop immediately without rolling
      const groundHeightAtBall = getTerrainHeight(newState.position[0], newState.position[2]);
      // Use ball radius with small margin for ground proximity check
      const groundProximityThreshold = BALL_RADIUS * 1.5;
      if (gameMode === 'topgolf' && newState.position[1] <= groundHeightAtBall + groundProximityThreshold) {
        const { zone, distanceFromCenter } = detectTargetZone(newState.position);

        if (zone) {
          // Ball landed in a target zone - stop immediately!
          hasLandedRef.current = true;
          const stoppedPosition: [number, number, number] = [newState.position[0], groundHeightAtBall, newState.position[2]];
          finalPositionRef.current = stoppedPosition; // Store final position
          flightStateRef.current = {
            ...newState,
            position: stoppedPosition,
            velocity: [0, 0, 0],
            phase: 'stopped',
          };

          const distance = calculateDistance(startPosition, newState.position);
          const shotResult = calculateShotPoints(zone, distanceFromCenter, currentShot, newState.position);
          recordTopgolfShot(shotResult);
          landBall(distance);
          return;
        }
      }

      // Ball has completely stopped (after rolling) - normal case
      if (newState.phase === 'stopped') {
        hasLandedRef.current = true;
        finalPositionRef.current = [...newState.position] as [number, number, number]; // Store final position
        const distance = calculateDistance(startPosition, newState.position);

        // In topgolf mode, detect target zone and calculate points
        if (gameMode === 'topgolf') {
          const { zone, distanceFromCenter } = detectTargetZone(newState.position);
          const shotResult = calculateShotPoints(zone, distanceFromCenter, currentShot, newState.position);
          recordTopgolfShot(shotResult);
        }

        landBall(distance);
      }
    } else if (!ball.isFlying || !flightStateRef.current) {
      // Ball has stopped or not yet launched
      if (finalPositionRef.current && swingPhase === 'finished') {
        // Keep ball at final stopped position during 'finished' phase
        meshRef.current.position.set(
          finalPositionRef.current[0],
          finalPositionRef.current[1],
          finalPositionRef.current[2]
        );
      } else if (swingPhase === 'ready' || swingPhase === 'pulling') {
        // Only reset to start position when ready for new swing
        // Don't reset during 'swinging' phase (flight state might not be initialized yet)
        meshRef.current.position.set(startPosition[0], startPosition[1], startPosition[2]);
      }
      // During 'swinging' phase with no flight state: do nothing, keep current position
    }
  });

  if (!ball.isVisible) return null;

  // Compute the current position for the mesh prop
  // Only use startPosition during ready/pulling phases
  // During swinging/finished, let useFrame handle position via ref
  const currentPosition: [number, number, number] =
    (finalPositionRef.current && swingPhase === 'finished')
      ? finalPositionRef.current
      : (swingPhase === 'ready' || swingPhase === 'pulling')
        ? startPosition
        : (meshRef.current?.position.toArray() as [number, number, number]) || startPosition;

  const ballMesh = (
    <mesh ref={meshRef} position={currentPosition} castShadow>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );

  // Only show trail while ball is flying
  if (ball.isFlying) {
    return (
      <Trail
        width={1.2}
        length={100}
        color="#4ECDC4"
        attenuation={(t) => t * t * t}
        decay={1}
      >
        {ballMesh}
      </Trail>
    );
  }

  return ballMesh;
}
