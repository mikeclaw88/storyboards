/**
 * Motion configuration types for keyframe-based club animation
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ClubConfig {
  position: Vector3;
  rotation: Vector3; // radians
  scale: number;
}

export interface ClubKeyframe {
  time: number; // seconds
  position: Vector3;
  rotation: Vector3; // radians
}

export interface CameraConfig {
  position: Vector3;
  target: Vector3;
  polarAngle?: number;
}

export interface DefaultsConfig {
  club: ClubConfig;
  ball: {
    position: Vector3;
  };
  selectionCamera?: CameraConfig;
  playCamera?: CameraConfig;
}

export interface AnimationConfig {
  keyframes: ClubKeyframe[];
  ball?: { position: Vector3 }; // Optional override
  impactTime?: number; // Time in seconds when ball is hit (optional)
}

/**
 * Video type config (driver, idle, iron, etc.)
 */
export interface VideoTypeConfig {
  url: string;
  offset: Vector3;
  pivot: { x: number; y: number };
  scale: number;
  chromaKey: {
    color: string;
    threshold: number;
    smoothing: number;
  };
  impactTime?: number;         // Time in seconds when ball is hit
  backswingTopTime?: number;   // Time in seconds at top of backswing
}

/**
 * Video config for a character (contains multiple video types)
 */
export interface CharacterVideoConfig {
  driver?: VideoTypeConfig;
  idle?: VideoTypeConfig;
  iron?: VideoTypeConfig;
  [videoType: string]: VideoTypeConfig | undefined;
}

export interface CharacterConfig {
  position?: Vector3; // Character world position
  club?: ClubConfig; // Per-character club default
  video?: CharacterVideoConfig; // Video character configs
  [animationId: string]: Vector3 | ClubConfig | CharacterVideoConfig | AnimationConfig | undefined;
}

export type CharactersConfig = Record<string, CharacterConfig>;

export interface ClubModelConfig {
  pivot: Vector3;
  scale: number;
  rotation: Vector3; // radians
  autoScale?: number; // Auto-calculated scale factor
}

export type ClubsConfig = Record<string, ClubModelConfig>;

/**
 * @deprecated Use CharacterVideoConfig instead (video is now under characters.{id}.video)
 */
export interface VideoCharacterConfig {
  url: string;
  offset: Vector3;
  pivot: { x: number; y: number };
  scale: number;
  chromaKey: {
    color: string;
    threshold: number;
    smoothing: number;
  };
  impactTime?: number;
  backswingTopTime?: number;
}

/**
 * @deprecated Video config is now under characters.{id}.video
 */
export type VideoConfig = Record<string, VideoCharacterConfig>;

export interface TerrainConfig {
  url: string;                 // Path to .terrain file
  position: Vector3;           // World position offset
  heightScale?: number;        // Vertical scale override (uses file value if not set)
  visible: boolean;            // Whether terrain is visible
}

export interface SplatConfig {
  url: string;                 // Path to .ply splat file
  position: Vector3;           // World position offset
  rotation: Vector3;           // Rotation in degrees
  scale: number;               // Uniform scale
  visible: boolean;            // Whether splat is visible
}

export interface MotionConfig {
  clubs: ClubsConfig;
  defaults: DefaultsConfig;
  characters: CharactersConfig;
  video?: VideoConfig;
  terrain?: TerrainConfig;
  splat?: SplatConfig;
}

export const MOTION_CONFIG_CHANNEL = 'swing-girls-motion-config';
export const MOTION_STORAGE_KEY = 'swing-girls-motion-config';

const DEFAULT_CLUB: ClubConfig = {
  position: { x: 0, y: 0.05, z: 0 },
  rotation: { x: -Math.PI / 2, y: -Math.PI / 2, z: -Math.PI / 2 },
  scale: 1,
};

const DEFAULT_CLUB_MODEL: ClubModelConfig = {
  pivot: { x: 0, y: 0, z: 0 },
  scale: 1,
  rotation: { x: 0, y: 0, z: 0 },
};

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  url: './terrains/terrain.terrain',
  position: { x: 0, y: 0, z: 100 },
  visible: true,
};

export const DEFAULT_SPLAT_CONFIG: SplatConfig = {
  url: './splats/hole1tee.spz',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 180, z: 180 },
  scale: 16.537,
  visible: true,
};

/**
 * Default motion configuration
 */
export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  clubs: {
    driver: { ...DEFAULT_CLUB_MODEL },
    ironclub5: { ...DEFAULT_CLUB_MODEL },
  },
  defaults: {
    club: { ...DEFAULT_CLUB },
    ball: {
      position: { x: -0.5, y: 0.02, z: 0.3 },
    },
  },
  characters: {},
};

/**
 * Catmull-Rom spline interpolation for a single value
 * Creates smooth curves that pass through all control points
 * p0, p1, p2, p3 are four consecutive values, t interpolates between p1 and p2
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

/**
 * Catmull-Rom spline interpolation for Vector3
 */
function catmullRomVec3(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: number): Vector3 {
  return {
    x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
    y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
    z: catmullRom(p0.z, p1.z, p2.z, p3.z, t),
  };
}

/**
 * Check if an object is an AnimationConfig (has keyframes array)
 */
export function isAnimationConfig(obj: unknown): obj is AnimationConfig {
  return obj !== null && typeof obj === 'object' && 'keyframes' in obj && Array.isArray((obj as AnimationConfig).keyframes);
}

/**
 * Get character's club default (falls back to global default)
 */
export function getCharacterClubDefault(config: MotionConfig, characterId: string): ClubConfig {
  const charConfig = config.characters[characterId];
  if (charConfig?.club && 'position' in charConfig.club && 'rotation' in charConfig.club) {
    return charConfig.club as ClubConfig;
  }
  return config.defaults.club;
}

/**
 * Get club transform at a given time
 * - If no keyframes, returns character's club default
 * - If keyframes exist, interpolates between them
 */
export function getClubTransformAtTime(
  characterClubDefault: ClubConfig,
  keyframes: ClubKeyframe[],
  time: number
): { position: Vector3; rotation: Vector3 } {
  // No keyframes - use character's club default
  if (!keyframes || keyframes.length === 0) {
    return {
      position: { ...characterClubDefault.position },
      rotation: { ...characterClubDefault.rotation },
    };
  }

  // Single keyframe
  if (keyframes.length === 1) {
    return {
      position: { ...keyframes[0].position },
      rotation: { ...keyframes[0].rotation },
    };
  }

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0].time) {
    return {
      position: { ...sorted[0].position },
      rotation: { ...sorted[0].rotation },
    };
  }

  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) {
    return {
      position: { ...sorted[sorted.length - 1].position },
      rotation: { ...sorted[sorted.length - 1].rotation },
    };
  }

  // Interpolate between keyframes using Catmull-Rom spline
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      const duration = sorted[i + 1].time - sorted[i].time;
      const t = duration > 0 ? (time - sorted[i].time) / duration : 0;

      // Get 4 points for Catmull-Rom (p0, p1, p2, p3)
      // p1 and p2 are the current segment, p0 and p3 are neighbors
      const p0 = sorted[Math.max(0, i - 1)];
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      const p3 = sorted[Math.min(sorted.length - 1, i + 2)];

      return {
        position: catmullRomVec3(p0.position, p1.position, p2.position, p3.position, t),
        rotation: catmullRomVec3(p0.rotation, p1.rotation, p2.rotation, p3.rotation, t),
      };
    }
  }

  // Fallback to character default
  return {
    position: { ...characterClubDefault.position },
    rotation: { ...characterClubDefault.rotation },
  };
}

/**
 * Convert degrees to radians
 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}
