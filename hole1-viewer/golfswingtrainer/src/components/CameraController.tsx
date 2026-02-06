import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../stores/gameStore';
import { useMotionConfig } from '../hooks/useMotionConfig';

// Camera settings
const CAMERA_FOLLOW_DELAY = 2; // Seconds to wait before following the ball
const CAMERA_FOLLOW_THRESHOLD = 5; // Start following when ball is this far (meters)
const CAMERA_FOLLOW_SPEED = 3; // Camera movement lerp speed (lower = smoother gimbal effect)
const BALL_TRACKING_SPEED = 8; // Ball position tracking speed (smooths ball position)
const CAMERA_OFFSET_FAR = new Vector3(0, 30, -30); // Camera offset when ball is high
const CAMERA_OFFSET_CLOSE = new Vector3(0, 3, -3); // Camera offset when ball is landing
const BALL_HEIGHT_FAR = 15; // Height at which camera is furthest
const BALL_HEIGHT_CLOSE = 2; // Height at which camera is closest
const CAMERA_RETURN_DELAY = 2; // Seconds to wait at stopped ball before returning

export interface CameraControllerProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  onFollowStateChange?: (isFollowing: boolean) => void;
  onCenterAzimuthChange?: (azimuth: number) => void;
}

/**
 * Camera controller that:
 * - Positions camera behind character when entering play mode
 * - Follows ball when it travels far enough
 * - Waits at stopped ball before returning to character
 */
export function CameraController({
  controlsRef,
  onFollowStateChange,
  onCenterAzimuthChange,
}: CameraControllerProps) {
  const ball = useGameStore((s) => s.ball);
  const screenMode = useGameStore((s) => s.screenMode);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const currentShot = useGameStore((s) => s.currentShot);
  const ballStartPosition = useGameStore((s) => s.ballStartPosition);
  const holePosition = useGameStore((s) => s.holePosition);
  const { getSelectionCamera, getPlayCamera } = useMotionConfig();
  const targetRef = useRef(new Vector3(0, 1, 0));
  const isFollowingRef = useRef(false);
  const lastScreenModeRef = useRef<string>('');
  const lastSwingPhaseRef = useRef<string>('');
  const followDelayTimerRef = useRef(0);
  const returnDelayTimerRef = useRef(0);
  const isWaitingToReturnRef = useRef(false);
  const waitingCameraPosRef = useRef(new Vector3());
  const waitingTargetPosRef = useRef(new Vector3());
  const wasBallFlyingRef = useRef(false);
  const smoothedBallPosRef = useRef(new Vector3());
  const smoothedCameraPosRef = useRef(new Vector3());

  // Get selection camera config from config.json
  const selectionCameraConfig = getSelectionCamera();
  const selectionCameraPosition = useMemo(() => new Vector3(
    selectionCameraConfig.position.x,
    selectionCameraConfig.position.y,
    selectionCameraConfig.position.z
  ), [selectionCameraConfig.position.x, selectionCameraConfig.position.y, selectionCameraConfig.position.z]);
  const selectionCameraTarget = useMemo(() => new Vector3(
    selectionCameraConfig.target.x,
    selectionCameraConfig.target.y,
    selectionCameraConfig.target.z
  ), [selectionCameraConfig.target.x, selectionCameraConfig.target.y, selectionCameraConfig.target.z]);

  // Apply selection camera when config loads (async)
  const lastAppliedSelectionConfigRef = useRef<string>('');
  useEffect(() => {
    const configKey = `selection-${selectionCameraConfig.position.x},${selectionCameraConfig.position.y},${selectionCameraConfig.position.z}`;
    if (screenMode === 'selection' && controlsRef.current && lastAppliedSelectionConfigRef.current !== configKey) {
      const camera = controlsRef.current.object;
      camera.position.copy(selectionCameraPosition);
      controlsRef.current.target.copy(selectionCameraTarget);
      lastAppliedSelectionConfigRef.current = configKey;
    }
  }, [selectionCameraConfig, selectionCameraPosition, selectionCameraTarget, screenMode, controlsRef]);

  // Get play camera config from config.json (absolute world coordinates)
  const playCameraConfig = getPlayCamera();
  const playCameraPosition = useMemo(() => new Vector3(
    playCameraConfig.position.x,
    playCameraConfig.position.y,
    playCameraConfig.position.z
  ), [playCameraConfig.position.x, playCameraConfig.position.y, playCameraConfig.position.z]);
  const playCameraTarget = useMemo(() => new Vector3(
    playCameraConfig.target.x,
    playCameraConfig.target.y,
    playCameraConfig.target.z
  ), [playCameraConfig.target.x, playCameraConfig.target.y, playCameraConfig.target.z]);

  // Apply play camera when config loads (async)
  const lastAppliedPlayConfigRef = useRef<string>('');
  useEffect(() => {
    const configKey = `play-${playCameraConfig.position.x},${playCameraConfig.position.y},${playCameraConfig.position.z}`;
    if (screenMode === 'playing' && controlsRef.current && lastAppliedPlayConfigRef.current !== configKey) {
      const camera = controlsRef.current.object;
      camera.position.copy(playCameraPosition);
      controlsRef.current.target.copy(playCameraTarget);
      lastAppliedPlayConfigRef.current = configKey;
    }
  }, [playCameraConfig, playCameraPosition, playCameraTarget, screenMode, controlsRef]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    // Set camera position when entering selection mode
    if (screenMode === 'selection' && lastScreenModeRef.current !== 'selection') {
      state.camera.position.copy(selectionCameraPosition);
      controls.target.copy(selectionCameraTarget);
      targetRef.current.copy(selectionCameraTarget);
      controls.update();
      isFollowingRef.current = false;
      isWaitingToReturnRef.current = false;
      followDelayTimerRef.current = 0;
      returnDelayTimerRef.current = 0;
      wasBallFlyingRef.current = false;
      onFollowStateChange?.(false);
      // Allow useEffect to re-apply play camera on next transition
      lastAppliedPlayConfigRef.current = '';
    }

    // Set camera position when entering play mode (relative to tee)
    if (screenMode === 'playing' && lastScreenModeRef.current !== 'playing') {
      state.camera.position.copy(playCameraPosition);
      controls.target.copy(playCameraTarget);
      targetRef.current.copy(playCameraTarget);
      controls.update();
      onCenterAzimuthChange?.(controls.getAzimuthalAngle());
      isFollowingRef.current = false;
      isWaitingToReturnRef.current = false;
      followDelayTimerRef.current = 0;
      returnDelayTimerRef.current = 0;
      wasBallFlyingRef.current = false;
      onFollowStateChange?.(false);
      // Allow useEffect to re-apply selection camera on next transition
      lastAppliedSelectionConfigRef.current = '';
    }
    lastScreenModeRef.current = screenMode;

    // Reset camera when a new shot starts (swingPhase goes back to 'ready')
    if (screenMode === 'playing' && swingPhase === 'ready' && lastSwingPhaseRef.current === 'finished') {
      if (currentShot > 1) {
        // Subsequent shots: position camera behind ball, facing toward hole
        const ballPos = new Vector3(ballStartPosition[0], ballStartPosition[1], ballStartPosition[2]);
        const holePos = new Vector3(holePosition[0], holePosition[1], holePosition[2]);

        // Direction from ball to hole
        const toHole = holePos.clone().sub(ballPos).normalize();

        // Camera behind ball (opposite direction of hole), ~4m back, ~2m up
        const cameraPos = ballPos.clone().add(toHole.clone().multiplyScalar(-4));
        cameraPos.y = ballPos.y + 2;

        state.camera.position.copy(cameraPos);
        controls.target.copy(ballPos);
        targetRef.current.copy(ballPos);
      } else {
        // Shot 1: use tee camera
        state.camera.position.copy(playCameraPosition);
        controls.target.copy(playCameraTarget);
        targetRef.current.copy(playCameraTarget);
      }
      controls.update();
      onCenterAzimuthChange?.(controls.getAzimuthalAngle());
      isFollowingRef.current = false;
      isWaitingToReturnRef.current = false;
      followDelayTimerRef.current = 0;
      returnDelayTimerRef.current = 0;
      onFollowStateChange?.(false);
    }
    lastSwingPhaseRef.current = swingPhase;

    // Track when ball starts flying to reset delay timers
    if (ball.isFlying && !wasBallFlyingRef.current) {
      followDelayTimerRef.current = 0;
      returnDelayTimerRef.current = 0;
      isWaitingToReturnRef.current = false;
    }
    wasBallFlyingRef.current = ball.isFlying;

    // Follow ball in both practice and topgolf modes
    if (screenMode === 'playing' && ball.isFlying) {
      followDelayTimerRef.current += delta;

      const ballPos = new Vector3(ball.position[0], ball.position[1], ball.position[2]);
      const distanceFromStart = ballPos.length();

      // Start following when ball goes beyond threshold AND delay has passed
      if (distanceFromStart > CAMERA_FOLLOW_THRESHOLD && followDelayTimerRef.current >= CAMERA_FOLLOW_DELAY) {
        const wasFollowing = isFollowingRef.current;
        if (!wasFollowing) {
          isFollowingRef.current = true;
          onFollowStateChange?.(true);
        }

        // Gimbal effect: First smooth the ball position
        if (!wasFollowing) {
          smoothedBallPosRef.current.copy(ballPos);
        } else {
          smoothedBallPosRef.current.lerp(ballPos, delta * BALL_TRACKING_SPEED);
        }

        const smoothedBallPos = smoothedBallPosRef.current;

        const targetPos = new Vector3(
          smoothedBallPos.x,
          smoothedBallPos.y,
          smoothedBallPos.z
        );

        // Calculate dynamic camera offset based on ball height
        const heightRatio = Math.max(0, Math.min(1,
          (smoothedBallPos.y - BALL_HEIGHT_CLOSE) / (BALL_HEIGHT_FAR - BALL_HEIGHT_CLOSE)
        ));
        const dynamicOffset = CAMERA_OFFSET_CLOSE.clone().lerp(CAMERA_OFFSET_FAR, heightRatio);
        const desiredCameraPos = targetPos.clone().add(dynamicOffset);

        if (!wasFollowing) {
          smoothedCameraPosRef.current.copy(desiredCameraPos);
        } else {
          smoothedCameraPosRef.current.lerp(desiredCameraPos, delta * CAMERA_FOLLOW_SPEED);
        }

        state.camera.position.copy(smoothedCameraPosRef.current);
        state.camera.lookAt(smoothedBallPos);

        controls.target.copy(smoothedBallPos);
        targetRef.current.copy(smoothedBallPos);
      }
    } else if (screenMode === 'playing' && !ball.isFlying && (isFollowingRef.current || isWaitingToReturnRef.current)) {
      // Ball has stopped - wait at stopped ball before returning to character
      if (!isWaitingToReturnRef.current) {
        isWaitingToReturnRef.current = true;
        returnDelayTimerRef.current = 0;
        waitingCameraPosRef.current.copy(state.camera.position);
        waitingTargetPosRef.current.copy(smoothedBallPosRef.current);
      }

      state.camera.position.copy(waitingCameraPosRef.current);
      state.camera.lookAt(waitingTargetPosRef.current);
      controls.target.copy(waitingTargetPosRef.current);

      // Disable auto-return (wait for next shot trigger)
      // returnDelayTimerRef.current += delta;
      // if (returnDelayTimerRef.current >= CAMERA_RETURN_DELAY) { ... }
    }
  });

  return null;
}
