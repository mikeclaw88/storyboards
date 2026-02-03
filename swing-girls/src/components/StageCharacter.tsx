import { useRef, useEffect, useCallback, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  useGameStore,
  getCharacterConfig,
  isVideoCharacter,
  VIDEO_CHARACTERS_IDLE,
} from '../stores/gameStore';
import { VideoCharacter } from './VideoCharacter';
import { useMotionConfig } from '../hooks/useMotionConfig';
import { useSceneConfig } from '../hooks/useSceneConfig';
import { playGolfShotSound } from '../utils/golfShotAudio';

/**
 * Character for selection mode - displays video character at tee position with offset
 */
function SelectionCharacter() {
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  const { getTeeWorldPosition } = useSceneConfig();

  const charConfig = getCharacterConfig(selectedCharacter);

  // Character position = tee position + offset (left 0.1, up 0.1)
  const teeWorldPos = getTeeWorldPosition();
  const characterPosition: [number, number, number] = [
    teeWorldPos.x - 0.1,
    teeWorldPos.y + 0.1,
    teeWorldPos.z
  ];

  // Only video characters are supported
  if (!isVideoCharacter(selectedCharacter)) {
    return null;
  }

  // Video character rendering - use idle video for selection screen
  const idleVideoPath = VIDEO_CHARACTERS_IDLE[charConfig.id] || charConfig.path;
  const idleCharacterId = `${charConfig.id}_idle`;
  return (
    <Suspense fallback={null}>
      <VideoCharacter
        key={`${idleCharacterId}-${idleVideoPath}`}
        videoPath={idleVideoPath}
        characterId={idleCharacterId}
        position={characterPosition}
        loop={true}
        playing={true}
      />
    </Suspense>
  );
}

/**
 * Video character for play mode - syncs video playback with swing phases
 * Uses pulling logic (play to backswingTopTime when pullProgress >= 0.9)
 * SwingPhase: 'ready' | 'pulling' | 'swinging' | 'finished'
 */
function PlayVideoCharacter() {
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const pullProgress = useGameStore((s) => s.pullProgress);
  const launchBall = useGameStore((s) => s.launchBall);
  const { getCharacterPosition, getImpactTime, getBackswingTopTime } = useMotionConfig();
  const { getTeeWorldPosition } = useSceneConfig();

  const charConfig = getCharacterConfig(selectedCharacter);
  const impactTime = getImpactTime(charConfig.id, 'golf_drive') ?? 1.0;
  const backswingTopTime = getBackswingTopTime(charConfig.id, 'golf_drive') ?? 0.8;

  // Character position = tee world position + character offset from config
  const teeWorldPos = getTeeWorldPosition();
  const charOffset = getCharacterPosition(charConfig.id);

  // Track state
  const contactFiredRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevPullThresholdRef = useRef(false);

  // Get video element ref from VideoCharacter
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
  }, []);

  // Reset when returning to ready state
  useEffect(() => {
    if (swingPhase === 'ready') {
      contactFiredRef.current = false;
      prevPullThresholdRef.current = false;
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }
    }
  }, [swingPhase]);

  // Handle pulling phase
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (swingPhase === 'pulling') {
      const crossedThreshold = pullProgress >= 0.9;

      if (crossedThreshold && !prevPullThresholdRef.current) {
        // Just crossed 0.9 threshold - start playing from 0
        video.currentTime = 0;
        video.play().catch(() => {});
      } else if (!crossedThreshold && prevPullThresholdRef.current) {
        // Dropped below 0.9 - reset to 0
        video.pause();
        video.currentTime = 0;
      } else if (!crossedThreshold) {
        // Still below 0.9 - keep at 0
        video.pause();
        video.currentTime = 0;
      }

      prevPullThresholdRef.current = crossedThreshold;
    }
  }, [swingPhase, pullProgress]);

  // Animation update loop - check for backswingTopTime and impact
  useFrame(() => {
    const video = videoRef.current;
    if (!video) return;

    const isPulling = swingPhase === 'pulling';
    const isSwinging = swingPhase === 'swinging';
    const isFinished = swingPhase === 'finished';

    if (isPulling && pullProgress >= 0.9) {
      // Stop at backswingTopTime
      if (video.currentTime >= backswingTopTime) {
        video.pause();
        video.currentTime = backswingTopTime;
      }
    } else if (isSwinging) {
      // Ensure video is playing during swing
      if (video.paused) {
        video.play().catch(() => {});
      }

      // Check for impact
      if (!contactFiredRef.current && video.currentTime >= impactTime) {
        contactFiredRef.current = true;
        playGolfShotSound();
        launchBall();
      }
    } else if (isFinished) {
      // Reset video to first frame when swing is finished
      if (video.currentTime > 0.1 || !video.paused) {
        video.pause();
        video.currentTime = 0;
      }
    }
  });

  // Calculate world position: tee + offset
  const charWorldPos: [number, number, number] = [
    teeWorldPos.x + charOffset.x,
    teeWorldPos.y + charOffset.y,
    teeWorldPos.z + charOffset.z,
  ];

  return (
    <VideoCharacter
      videoPath={charConfig.path}
      characterId={charConfig.id}
      position={charWorldPos}
      loop={false}
      playing={false}
      onVideoRef={setVideoRef}
    />
  );
}

/**
 * Character for play mode - only video characters are supported
 */
function PlayCharacter() {
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);

  // Only video characters are supported
  if (!isVideoCharacter(selectedCharacter)) {
    return null;
  }

  return <PlayVideoCharacter />;
}

/**
 * Character wrapper that switches between selection and play mode
 */
export function DynamicCharacter() {
  const screenMode = useGameStore((s) => s.screenMode);

  if (screenMode === 'playing') {
    return (
      <Suspense fallback={null}>
        <PlayCharacter />
      </Suspense>
    );
  }

  return <SelectionCharacter />;
}
