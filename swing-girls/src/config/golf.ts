/**
 * Golf configuration constants
 */

export interface GolfConfig {
  club: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  };
  ball: {
    position: { x: number; y: number; z: number };
  };
}

export const GOLF_CONFIG: GolfConfig = {
  club: {
    position: { x: 0, y: 0.05, z: 0 },
    rotation: { x: -Math.PI / 2, y: -Math.PI / 2, z: -Math.PI / 2 },
  },
  ball: {
    position: { x: -0.5, y: 0.02, z: 0.3 },
  },
};

export const GOLF_CONFIG_CHANNEL = 'swing-girls-config';
