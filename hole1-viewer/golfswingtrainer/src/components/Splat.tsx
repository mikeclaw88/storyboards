import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SplatEdit, SplatEditSdf, SplatEditSdfType } from '@sparkjsdev/spark';
import { getSplatMesh } from '../utils/splatCache';
import { useDebugStore } from '../stores/debugStore';

interface SplatProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number]; // degrees
  scale?: number;
  visible?: boolean;
}

/**
 * Gaussian Splat component using cached instances
 */
export function Splat({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  visible = true,
}: SplatProps) {
  const { scene } = useThree();
  const splatRef = useRef<any>(null);
  const editRef = useRef<SplatEdit | null>(null);
  const sdfRef = useRef<SplatEditSdf | null>(null);

  const surfaceEditorOpen = useDebugStore((s) => s.surfaceEditorOpen);
  const yCutoff = useDebugStore((s) => s.yCutoff);

  useEffect(() => {
    // Get cached splat mesh (singleton)
    const splat = getSplatMesh(url);
    if (!splat) return;

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

    // Cleanup: Don't dispose the mesh/geometry, just remove from scene
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

  // Apply Y cutoff clipping via SplatEdit when surface editor is open
  useEffect(() => {
    const splat = splatRef.current;
    if (!splat) return;

    if (surfaceEditorOpen) {
      // Ensure the splat's world matrix is current
      splat.updateMatrixWorld(true);

      // Transform world-space cutoff point to the splat's object space
      const cutoffWorld = new THREE.Vector3(0, yCutoff, 0);
      const cutoffObj = splat.worldToLocal(cutoffWorld);

      // Find the world-up direction in the splat's object space
      // This accounts for the splat's rotation (e.g., 0,180,180)
      const worldUp = new THREE.Vector3(0, 1, 0);
      const invQuat = splat.quaternion.clone().invert();
      const objectUp = worldUp.applyQuaternion(invQuat).normalize();

      // Rotate SDF so its local Z axis aligns with world-up-in-object-space
      // PLANE SDF uses sdfPos.z for distance evaluation
      const sdfQuat = new THREE.Quaternion();
      sdfQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), objectUp);

      if (!sdfRef.current) {
        sdfRef.current = new SplatEditSdf({
          type: SplatEditSdfType.PLANE,
          invert: true,
          opacity: 0,
        });
      }
      sdfRef.current.position.copy(cutoffObj);
      sdfRef.current.quaternion.copy(sdfQuat);

      if (!editRef.current) {
        editRef.current = new SplatEdit({
          name: 'y-cutoff',
          softEdge: 0,
        });
        editRef.current.addSdf(sdfRef.current);
      }

      splat.edits = [editRef.current];
    } else {
      splat.edits = null;
      editRef.current = null;
      sdfRef.current = null;
    }
  }, [surfaceEditorOpen, yCutoff, position, rotation, scale]);

  return null;
}
