import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_MOTION_CONFIG,
  DEFAULT_TERRAIN_CONFIG,
  DEFAULT_SPLAT_CONFIG,
  MOTION_CONFIG_CHANNEL,
  getClubTransformAtTime,
  getCharacterClubDefault,
  isAnimationConfig,
  type MotionConfig,
  type ClubKeyframe,
  type ClubModelConfig,
  type TerrainConfig,
  type SplatConfig,
  type Vector3,
} from '../config/motionConfig';
import { useBroadcastChannel } from './useBroadcastChannel';

export interface ClubTransform {
  position: Vector3;
  rotation: Vector3; // radians
}

export interface BallPosition {
  position: Vector3;
}

export interface CameraConfig {
  position: Vector3;
  target: Vector3;
  polarAngle?: number;
}

interface UseMotionConfigResult {
  config: MotionConfig;
  getClubTransform: (characterId: string, animationId: string, time: number) => ClubTransform;
  getClubScale: (characterId: string) => number;
  getClubModelConfig: (clubModelId: string) => ClubModelConfig;
  getBallPosition: (characterId: string, animationId: string) => BallPosition;
  getKeyframes: (characterId: string, animationId: string) => ClubKeyframe[];
  getCharacterPosition: (characterId: string) => Vector3;
  getImpactTime: (characterId: string, animationId: string) => number | undefined;
  getBackswingTopTime: (characterId: string, animationId: string) => number | undefined;
  getTerrainConfig: () => TerrainConfig;
  getSplatConfig: () => SplatConfig;
  getSelectionCamera: () => CameraConfig;
  getPlayCamera: () => CameraConfig;
}

/**
 * Type guard to validate motion config structure
 */
function isMotionConfig(data: unknown): data is MotionConfig {
  return (
    typeof data === 'object' &&
    data !== null &&
    'defaults' in data &&
    'characters' in data
  );
}

/**
 * Hook to manage motion configuration with keyframe interpolation
 * - Loads from ./config.json only
 * - Listens for real-time updates from golf_editor.html via BroadcastChannel
 * - Uses per-character club defaults, then keyframe overrides
 */
export function useMotionConfig(): UseMotionConfigResult {
  const [config, setConfig] = useState<MotionConfig>(DEFAULT_MOTION_CONFIG);

  // Load config from config.json on startup
  useEffect(() => {
    fetch('./config.json')
      .then((res) => res.json())
      .then((data) => {
        if (isMotionConfig(data)) {
          setConfig(data);
        } else {
          console.warn('config.json is in old format, using defaults');
        }
      })
      .catch((e) => {
        console.warn('Failed to load ./config.json, using defaults:', e);
      });
  }, []);

  // Handle BroadcastChannel message
  const handleConfigUpdate = useCallback((newConfig: MotionConfig) => {
    setConfig(newConfig);
  }, []);

  // Listen for BroadcastChannel messages (real-time updates from golf_editor.html)
  useBroadcastChannel<MotionConfig>({
    channelName: MOTION_CONFIG_CHANNEL,
    messageType: 'motion',
    payloadKey: 'config',
    onMessage: handleConfigUpdate,
  });

  /**
   * Get interpolated club transform for a character/animation at a given time
   * Uses per-character club default if no keyframes exist
   */
  const getClubTransform = useCallback(
    (characterId: string, animationId: string, time: number): ClubTransform => {
      const characterClubDefault = getCharacterClubDefault(config, characterId);
      const animConfig = config.characters[characterId]?.[animationId];
      const keyframes = isAnimationConfig(animConfig) ? animConfig.keyframes : [];
      return getClubTransformAtTime(characterClubDefault, keyframes, time);
    },
    [config]
  );

  /**
   * Get club scale for a character
   * Uses per-character scale if exists, otherwise defaults
   */
  const getClubScale = useCallback(
    (characterId: string): number => {
      const characterClubDefault = getCharacterClubDefault(config, characterId);
      return characterClubDefault.scale ?? 1;
    },
    [config]
  );

  /**
   * Get club model config (pivot, scale, rotation for the model itself)
   */
  const getClubModelConfig = useCallback(
    (clubModelId: string): ClubModelConfig => {
      const defaultConfig: ClubModelConfig = {
        pivot: { x: 0, y: 0, z: 0 },
        scale: 1,
        rotation: { x: 0, y: 0, z: 0 },
      };
      return config.clubs?.[clubModelId] ?? defaultConfig;
    },
    [config]
  );

  /**
   * Get ball position for a character/animation
   * Uses per-animation override if exists, otherwise defaults
   */
  const getBallPosition = useCallback(
    (characterId: string, animationId: string): BallPosition => {
      const animConfig = config.characters[characterId]?.[animationId];
      if (isAnimationConfig(animConfig) && animConfig.ball) {
        return { position: animConfig.ball.position };
      }
      return { position: config.defaults.ball.position };
    },
    [config]
  );

  /**
   * Get keyframes for a character/animation
   */
  const getKeyframes = useCallback(
    (characterId: string, animationId: string): ClubKeyframe[] => {
      const animConfig = config.characters[characterId]?.[animationId];
      return isAnimationConfig(animConfig) ? animConfig.keyframes : [];
    },
    [config]
  );

  /**
   * Get character position offset (relative to tee)
   * For 3D characters: reads from config.characters[characterId].position
   * For video characters: reads from config.characters[characterId].video.driver.offset
   */
  const getCharacterPosition = useCallback(
    (characterId: string): Vector3 => {
      const charConfig = config.characters[characterId];
      if (charConfig?.position) {
        return charConfig.position;
      }
      // Check video character config (new structure: characters.{id}.video.driver.offset)
      const videoConfig = charConfig?.video?.driver;
      if (videoConfig?.offset) {
        return videoConfig.offset;
      }
      return { x: 0, y: 0, z: 0 };
    },
    [config]
  );

  /**
   * Get impact time for ball launch (returns undefined if not set)
   * For video characters: reads from config.characters[characterId].video.driver.impactTime
   * For model characters: reads from config.animations[animationId].impactTime
   */
  const getImpactTime = useCallback(
    (characterId: string, animationId: string): number | undefined => {
      // Check video config first (new structure: characters.{id}.video.driver)
      const videoConfig = config.characters[characterId]?.video?.driver;
      if (videoConfig?.impactTime !== undefined) {
        return videoConfig.impactTime;
      }
      // Fallback to animation-level config
      const animConfig = (config as any).animations?.[animationId];
      return animConfig?.impactTime;
    },
    [config]
  );

  /**
   * Get backswing top time (returns undefined if not set)
   * For video characters: reads from config.characters[characterId].video.driver.backswingTopTime
   * For model characters: reads from config.animations[animationId].backswingTopTime
   */
  const getBackswingTopTime = useCallback(
    (characterId: string, animationId: string): number | undefined => {
      // Check video config first (new structure: characters.{id}.video.driver)
      const videoConfig = config.characters[characterId]?.video?.driver;
      if (videoConfig?.backswingTopTime !== undefined) {
        return videoConfig.backswingTopTime;
      }
      // Fallback to animation-level config
      const animConfig = (config as any).animations?.[animationId];
      return animConfig?.backswingTopTime;
    },
    [config]
  );

  /**
   * Get terrain configuration
   */
  const getTerrainConfig = useCallback((): TerrainConfig => {
    return config.terrain ?? DEFAULT_TERRAIN_CONFIG;
  }, [config]);

  /**
   * Get splat configuration
   */
  const getSplatConfig = useCallback((): SplatConfig => {
    return config.splat ?? DEFAULT_SPLAT_CONFIG;
  }, [config]);

  /**
   * Get selection camera configuration
   */
  const getSelectionCamera = useCallback((): CameraConfig => {
    const defaultCamera: CameraConfig = {
      position: { x: 0, y: 2.5, z: -6 },
      target: { x: 0, y: 1, z: 0 }
    };
    return config.defaults?.selectionCamera ?? defaultCamera;
  }, [config]);

  /**
   * Get play camera configuration
   */
  const getPlayCamera = useCallback((): CameraConfig => {
    const defaultCamera: CameraConfig = {
      position: { x: 0, y: 2.5, z: -6 },
      target: { x: 0, y: 1, z: 0 }
    };
    return config.defaults?.playCamera ?? defaultCamera;
  }, [config]);

  return {
    config,
    getClubTransform,
    getClubScale,
    getClubModelConfig,
    getBallPosition,
    getKeyframes,
    getCharacterPosition,
    getImpactTime,
    getBackswingTopTime,
    getTerrainConfig,
    getSplatConfig,
    getSelectionCamera,
    getPlayCamera,
  };
}
