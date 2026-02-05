import { useRef, useEffect, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { PropNode } from '../types/scene';
import { degToRad } from '../config/sceneConfig';

interface ScenePropProps {
  prop: PropNode;
}

/**
 * Inner component that loads and renders a GLB/GLTF prop model
 */
function PropModel({ prop }: ScenePropProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(prop.url);

  useEffect(() => {
    if (groupRef.current && scene) {
      // Clone the scene to avoid sharing issues
      const clonedScene = scene.clone();

      // Clear any existing children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }

      // Add the cloned model
      groupRef.current.add(clonedScene);

      // Enable shadows
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  if (!prop.visible) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      position={[prop.position.x, prop.position.y, prop.position.z]}
      rotation={[
        degToRad(prop.rotation.x),
        degToRad(prop.rotation.y),
        degToRad(prop.rotation.z),
      ]}
      scale={[prop.scale.x, prop.scale.y, prop.scale.z]}
    />
  );
}

/**
 * Fallback component while loading
 */
function PropFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  );
}

/**
 * SceneProp component that renders a prop from scene config
 * Wraps the model loading in Suspense for async loading
 */
export function SceneProp({ prop }: ScenePropProps) {
  if (!prop.visible) {
    return null;
  }

  return (
    <Suspense fallback={<PropFallback />}>
      <PropModel prop={prop} />
    </Suspense>
  );
}

/**
 * Renders multiple props from an array
 */
interface ScenePropsProps {
  props: PropNode[];
}

export function SceneProps({ props }: ScenePropsProps) {
  return (
    <>
      {props.map((prop) => (
        <SceneProp key={prop.id} prop={prop} />
      ))}
    </>
  );
}
