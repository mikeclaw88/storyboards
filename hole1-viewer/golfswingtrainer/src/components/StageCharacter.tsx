import { useRef, useEffect, useCallback, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  useGameStore,
  getCharacterConfig,
  isVideoCharacter,
  getVideoCharactersIdleMap,
} from '../stores/gameStore';
import { getVideoConfig } from '../stores/videoConfigStore';
import { VideoCharacter } from './VideoCharacter';
import { useMotionConfig } from '../hooks/useMotionConfig';
import { playGolfShotSound } from '../utils/golfShotAudio';

/**
 * Character for selection mode - displays video character at tee position with offset
 */
function SelectionCharacter() {
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  const teePosition = useGameStore((s) => s.teePosition);
  const courseReady = useGameStore((s) => s.courseReady);

  const charConfig = getCharacterConfig(selectedCharacter);

  if (!courseReady) return null;

  // Character position = tee position + offset (left 0.1, up 0.1)
  const characterPosition: [number, number, number] = [
    teePosition[0] - 0.1,
    teePosition[1] + 0.1,
    teePosition[2]
  ];

  // Only video characters are supported
  if (!isVideoCharacter(selectedCharacter)) {
    return null;
  }

  // Video character rendering - use idle video for selection screen
  const idleVideos = getVideoCharactersIdleMap();
  const idleVideoPath = idleVideos[charConfig.id] || charConfig.path;
  return (
    <Suspense fallback={null}>
      <VideoCharacter
        key={`${charConfig.id}-idle-${idleVideoPath}`}
        videoPath={idleVideoPath}
        characterId={charConfig.id}
        videoType="idle"
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
  const selectedClubType = useGameStore((s) => s.selectedClubType);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const pullProgress = useGameStore((s) => s.pullProgress);
  const launchBall = useGameStore((s) => s.launchBall);
  const currentShot = useGameStore((s) => s.currentShot);
  const ballStartPosition = useGameStore((s) => s.ballStartPosition);
  const teePosition = useGameStore((s) => s.teePosition);
  const { getCharacterPosition, getImpactTime, getBackswingTopTime } = useMotionConfig();

  const charConfig = getCharacterConfig(selectedCharacter);

  // Get video config for selected club type, fallback to driver
  const clubTypeConfig = getVideoConfig(charConfig.id, selectedClubType);
  const videoPath = clubTypeConfig?.url || charConfig.path;

  // Get timing from selected club type config
  const impactTime = clubTypeConfig?.impactTime ?? getImpactTime(charConfig.id, 'golf_drive') ?? 1.0;
  const backswingTopTime = clubTypeConfig?.backswingTopTime ?? getBackswingTopTime(charConfig.id, 'golf_drive') ?? 0.8;

  // Character offset from config
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

  // Calculate world position: shot 1 = tee + offset, shot 2+ = ball landing + offset
  const charWorldPos: [number, number, number] = currentShot > 1
    ? [
        ballStartPosition[0] + charOffset.x,
        ballStartPosition[1] + charOffset.y,
        ballStartPosition[2] + charOffset.z,
      ]
    : [
        teePosition[0] + charOffset.x,
        teePosition[1] + charOffset.y,
        teePosition[2] + charOffset.z,
      ];

  return (
    <VideoCharacter
      key={`${charConfig.id}-${selectedClubType}`}
      videoPath={videoPath}
      characterId={charConfig.id}
      videoType={selectedClubType}
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
