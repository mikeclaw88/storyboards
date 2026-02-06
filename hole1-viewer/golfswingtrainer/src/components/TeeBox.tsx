import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import type { TeeBoxNode } from '../types/scene';

interface TeeBoxProps {
  config: TeeBoxNode;
}

/**
 * TeeBox component - loads and renders the tee box GLB model
 * Position is relative to the scene origin
 */
export function TeeBox({ config }: TeeBoxProps) {
  const { scene } = useGLTF(config.url);

  // Clone the scene to avoid issues with reusing the same model
  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Setup shadows
  useMemo(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  if (!config.visible) {
    return null;
  }

  return (
    <primitive
      object={clonedScene}
      position={[config.position.x, config.position.y, config.position.z]}
      rotation={[
        (config.rotation.x * Math.PI) / 180,
        (config.rotation.y * Math.PI) / 180,
        (config.rotation.z * Math.PI) / 180,
      ]}
      scale={config.scale}
    />
  );
}

// Preload the default tee box model
useGLTF.preload('./models/teebox/Teebox.glb');
