import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { SplatMesh } from '@sparkjsdev/spark';
import * as THREE from 'three';

interface SplatProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number]; // degrees
  scale?: number;
  visible?: boolean;
}

/**
 * Gaussian Splat component using @sparkjsdev/spark
 */
export function Splat({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  visible = true,
}: SplatProps) {
  const { scene } = useThree();
  const splatRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    // Create splat mesh
    // @ts-ignore
    const splat = new SplatMesh({ url });
    splatRef.current = splat;

    // Apply transform
    splat.position.set(position[0], position[1], position[2]);
    splat.rotation.set(
      (rotation[0] * Math.PI) / 180,
      (rotation[1] * Math.PI) / 180,
      (rotation[2] * Math.PI) / 180
    );
    splat.scale.setScalar(scale);
    splat.visible = visible;

    // Add to scene
    scene.add(splat);

    return () => {
      scene.remove(splat);
      splatRef.current = null;
    };
  }, [url, scene]);

  // Update transform when props change
  useEffect(() => {
    if (splatRef.current) {
      splatRef.current.position.set(position[0], position[1], position[2]);
    }
  }, [position]);

  useEffect(() => {
    if (splatRef.current) {
      splatRef.current.rotation.set(
        (rotation[0] * Math.PI) / 180,
        (rotation[1] * Math.PI) / 180,
        (rotation[2] * Math.PI) / 180
      );
    }
  }, [rotation]);

  useEffect(() => {
    if (splatRef.current) {
      splatRef.current.scale.setScalar(scale);
    }
  }, [scale]);

  useEffect(() => {
    if (splatRef.current) {
      splatRef.current.visible = visible;
    }
  }, [visible]);

  // Component doesn't render anything directly - splat is added to scene
  return null;
}
