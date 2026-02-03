/**
 * Scene configuration defaults and constants
 */

import type {
  SceneConfig,
  TerrainNode,
  SplatNode,
  TeeBoxNode,
  TeeNode,
  PropNode,
  Vector3,
} from '../types/scene';

// BroadcastChannel name for real-time scene updates
export const SCENE_CONFIG_CHANNEL = 'swing-girls-scene-config';

// LocalStorage key for scene config (fallback)
export const SCENE_STORAGE_KEY = 'swing-girls-scene-config';

// Current scene format version
export const SCENE_VERSION = '1.0';

/**
 * Default Vector3 values
 */
export const ZERO_VECTOR3: Vector3 = { x: 0, y: 0, z: 0 };
export const ONE_VECTOR3: Vector3 = { x: 1, y: 1, z: 1 };

/**
 * Default terrain configuration
 */
export const DEFAULT_TERRAIN_NODE: TerrainNode = {
  id: 'terrain-001',
  name: 'Main Terrain',
  url: './terrains/terrain.terrain',
  position: { x: 0, y: 0, z: 100 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  visible: true,
};

/**
 * Default splat configuration
 */
export const DEFAULT_SPLAT_NODE: SplatNode = {
  id: 'splat-001',
  name: 'Background Splat',
  url: './splats/Urban-Golf-Range.ply',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 180, z: 180 },
  scale: 16.537,
  visible: true,
};

/**
 * Default tee (small peg) configuration
 */
export const DEFAULT_TEE_NODE: TeeNode = {
  id: 'tee-peg-001',
  name: 'Tee',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  visible: true,
};

/**
 * Default tee box configuration
 */
export const DEFAULT_TEE_BOX_NODE: TeeBoxNode = {
  id: 'tee-001',
  name: 'Tee Box',
  url: './models/teebox/Teebox.glb',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  visible: true,
  tee: { ...DEFAULT_TEE_NODE },
};

/**
 * Default scene configuration
 */
export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  version: SCENE_VERSION,
  name: 'Urban Golf Range',
  description: 'Rooftop driving range scene',
  terrain: { ...DEFAULT_TERRAIN_NODE },
  splat: { ...DEFAULT_SPLAT_NODE },
  teeBox: { ...DEFAULT_TEE_BOX_NODE },
  props: [],
};

/**
 * Create a new prop node with default values
 */
export function createDefaultProp(id: string, name: string, url: string): PropNode {
  return {
    id,
    name,
    url,
    position: { ...ZERO_VECTOR3 },
    rotation: { ...ZERO_VECTOR3 },
    scale: { ...ONE_VECTOR3 },
    visible: true,
  };
}

/**
 * Create a deep copy of a scene config
 */
export function cloneSceneConfig(scene: SceneConfig): SceneConfig {
  return JSON.parse(JSON.stringify(scene));
}

/**
 * Merge partial scene updates into a scene config
 */
export function mergeSceneConfig(
  base: SceneConfig,
  updates: Partial<SceneConfig>
): SceneConfig {
  return {
    ...base,
    ...updates,
    terrain: updates.terrain ? { ...base.terrain, ...updates.terrain } : base.terrain,
    splat: updates.splat ? { ...base.splat, ...updates.splat } : base.splat,
    teeBox: updates.teeBox ? { ...base.teeBox, ...updates.teeBox } : base.teeBox,
    props: updates.props ?? base.props,
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
