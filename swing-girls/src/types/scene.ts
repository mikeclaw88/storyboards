/**
 * Scene configuration types for golf hole management
 * Each scene represents one golf hole with terrain, splat, tee box, and props
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Base node interface for all scene objects
 */
export interface SceneNode {
  id: string;
  name: string;
  visible: boolean;
}

/**
 * Terrain node configuration
 */
export interface TerrainNode extends SceneNode {
  url: string;
  position: Vector3;
  rotation: Vector3;
  scale: number;
}

/**
 * Gaussian splat node configuration
 */
export interface SplatNode extends SceneNode {
  url: string;
  position: Vector3;
  rotation: Vector3;
  scale: number;
}

/**
 * Tee node configuration (small golf tee peg that holds the ball)
 * Position/rotation/scale are relative to parent TeeBox
 */
export interface TeeNode extends SceneNode {
  position: Vector3;
  rotation: Vector3;
  scale: number;
}

/**
 * Tee box node configuration (platform/mat area where player stands)
 */
export interface TeeBoxNode extends SceneNode {
  url: string;
  position: Vector3;
  rotation: Vector3;
  scale: number;
  tee: TeeNode;
}

/**
 * Prop node configuration for 3D models (GLB/GLTF)
 */
export interface PropNode extends SceneNode {
  url: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

/**
 * Complete scene configuration
 */
export interface SceneConfig {
  version: string;
  name: string;
  description: string;
  terrain: TerrainNode;
  splat: SplatNode;
  teeBox: TeeBoxNode;
  props: PropNode[];
}

/**
 * Scene file data (for loading/saving)
 */
export type SceneFileData = SceneConfig;

/**
 * Type guard to check if an object is a valid SceneConfig
 */
export function isSceneConfig(obj: unknown): obj is SceneConfig {
  if (!obj || typeof obj !== 'object') return false;
  const scene = obj as Record<string, unknown>;
  return (
    typeof scene.version === 'string' &&
    typeof scene.name === 'string' &&
    scene.terrain !== undefined &&
    scene.splat !== undefined &&
    scene.teeBox !== undefined &&
    Array.isArray(scene.props)
  );
}

/**
 * Generate a unique ID for scene objects
 */
export function generateSceneId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`;
}
