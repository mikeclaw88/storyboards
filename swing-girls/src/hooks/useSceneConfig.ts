import { useState, useEffect, useCallback } from 'react';
import { Euler, Vector3 as ThreeVector3 } from 'three';
import {
  SCENE_CONFIG_CHANNEL,
  DEFAULT_SCENE_CONFIG,
  cloneSceneConfig,
  degToRad,
} from '../config/sceneConfig';
import type {
  SceneConfig,
  TerrainNode,
  SplatNode,
  TeeBoxNode,
  TeeNode,
  PropNode,
  Vector3,
} from '../types/scene';
import { isSceneConfig } from '../types/scene';
import { useBroadcastChannel } from './useBroadcastChannel';

interface UseSceneConfigResult {
  scene: SceneConfig;
  getTerrainNode: () => TerrainNode;
  getSplatNode: () => SplatNode;
  getTeeBoxNode: () => TeeBoxNode;
  getTeeNode: () => TeeNode;
  getTeeWorldPosition: () => Vector3;
  getProps: () => PropNode[];
  getPropById: (id: string) => PropNode | undefined;
  getTeeBoxPosition: () => Vector3;
}

/**
 * Hook to manage scene configuration with real-time updates from editor
 * - Loads from ./scene.json on startup
 * - Listens for real-time updates from golf_editor.html via BroadcastChannel
 * - Provides scene data to components
 */
export function useSceneConfig(): UseSceneConfigResult {
  const [scene, setScene] = useState<SceneConfig>(cloneSceneConfig(DEFAULT_SCENE_CONFIG));

  // Load scene from scene file on startup
  useEffect(() => {
    // Try loading from scenes folder first, fallback to root scene.json
    const sceneUrl = './scenes/urban-golf-range.scene.json';
    const fallbackUrl = './scene.json';

    fetch(sceneUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isSceneConfig(data)) {
          setScene(data);
        } else {
          console.warn('[useSceneConfig] Scene config is invalid, using defaults. Missing fields:', {
            hasVersion: typeof data?.version === 'string',
            hasName: typeof data?.name === 'string',
            hasTerrain: data?.terrain !== undefined,
            hasSplat: data?.splat !== undefined,
            hasTeeBox: data?.teeBox !== undefined,
            hasProps: Array.isArray(data?.props),
          });
        }
      })
      .catch((e) => {
        console.warn('[useSceneConfig] Failed to load scene, trying fallback:', e);
        // Fallback to root scene.json
        fetch(fallbackUrl)
          .then((res) => res.json())
          .then((data) => {
            if (isSceneConfig(data)) {
              setScene(data);
            }
          })
          .catch((fallbackError) => {
            console.warn('[useSceneConfig] Failed to load fallback scene.json, using defaults:', fallbackError);
          });
      });
  }, []);

  // Handle BroadcastChannel message
  const handleSceneUpdate = useCallback((newScene: SceneConfig) => {
    setScene(newScene);
  }, []);

  // Listen for BroadcastChannel messages (real-time updates from golf_editor.html)
  useBroadcastChannel<SceneConfig>({
    channelName: SCENE_CONFIG_CHANNEL,
    messageType: 'scene',
    payloadKey: 'scene',
    onMessage: handleSceneUpdate,
    validator: isSceneConfig,
  });

  /**
   * Get terrain node configuration
   */
  const getTerrainNode = useCallback((): TerrainNode => {
    return scene.terrain;
  }, [scene]);

  /**
   * Get splat node configuration
   */
  const getSplatNode = useCallback((): SplatNode => {
    return scene.splat;
  }, [scene]);

  /**
   * Get tee box node configuration
   */
  const getTeeBoxNode = useCallback((): TeeBoxNode => {
    return scene.teeBox;
  }, [scene]);

  /**
   * Get tee node configuration (child of teeBox)
   */
  const getTeeNode = useCallback((): TeeNode => {
    return scene.teeBox.tee;
  }, [scene]);

  /**
   * Get tee world position (hierarchical transform: teeBox position + rotated tee relative position)
   */
  const getTeeWorldPosition = useCallback((): Vector3 => {
    const teeBox = scene.teeBox;
    const tee = teeBox.tee;

    // Apply parent rotation to child's relative position
    const parentRot = new Euler(
      degToRad(teeBox.rotation.x),
      degToRad(teeBox.rotation.y),
      degToRad(teeBox.rotation.z)
    );
    const childRelPos = new ThreeVector3(tee.position.x, tee.position.y, tee.position.z);
    childRelPos.applyEuler(parentRot);

    return {
      x: teeBox.position.x + childRelPos.x,
      y: teeBox.position.y + childRelPos.y,
      z: teeBox.position.z + childRelPos.z,
    };
  }, [scene]);

  /**
   * Get all props
   */
  const getProps = useCallback((): PropNode[] => {
    return scene.props;
  }, [scene]);

  /**
   * Get a specific prop by ID
   */
  const getPropById = useCallback((id: string): PropNode | undefined => {
    return scene.props.find((prop) => prop.id === id);
  }, [scene]);

  /**
   * Get tee box position for ball placement
   */
  const getTeeBoxPosition = useCallback((): Vector3 => {
    return scene.teeBox.position;
  }, [scene]);

  return {
    scene,
    getTerrainNode,
    getSplatNode,
    getTeeBoxNode,
    getTeeNode,
    getTeeWorldPosition,
    getProps,
    getPropById,
    getTeeBoxPosition,
  };
}
