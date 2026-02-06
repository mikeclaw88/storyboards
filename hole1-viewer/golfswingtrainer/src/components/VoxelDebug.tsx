import { useMemo, useRef, useEffect } from 'react';
import { Object3D, InstancedMesh as InstancedMeshType } from 'three';
import { useDebugStore } from '../stores/debugStore';

const MAX_VOXELS = 125_000;
const tempObject = new Object3D();

export function VoxelDebug() {
  const meshRef = useRef<InstancedMeshType>(null);
  const voxelWidth = useDebugStore((s) => s.voxelWidth);
  const voxelHeight = useDebugStore((s) => s.voxelHeight);
  const voxelLength = useDebugStore((s) => s.voxelLength);
  const voxelScale = useDebugStore((s) => s.voxelScale);
  const terrainYOffset = useDebugStore((s) => s.terrainYOffset);

  const { countX, countY, countZ, totalCount } = useMemo(() => {
    const cx = Math.ceil(voxelWidth / voxelScale);
    const cy = Math.ceil(voxelHeight / voxelScale);
    const cz = Math.ceil(voxelLength / voxelScale);
    const total = Math.min(cx * cy * cz, MAX_VOXELS);
    return { countX: cx, countY: cy, countZ: cz, totalCount: total };
  }, [voxelWidth, voxelHeight, voxelLength, voxelScale]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Terrain spans X: -150 to +150, Z: -50 to +350
    const originX = -voxelWidth / 2;  // -150 at default 300
    const originZ = -50;              // terrain Z start
    const originY = terrainYOffset;   // base at terrain surface

    let idx = 0;
    for (let ix = 0; ix < countX && idx < totalCount; ix++) {
      for (let iy = 0; iy < countY && idx < totalCount; iy++) {
        for (let iz = 0; iz < countZ && idx < totalCount; iz++) {
          tempObject.position.set(
            originX + (ix + 0.5) * voxelScale,
            originY + (iy + 0.5) * voxelScale,
            originZ + (iz + 0.5) * voxelScale,
          );
          tempObject.updateMatrix();
          mesh.setMatrixAt(idx, tempObject.matrix);
          idx++;
        }
      }
    }

    mesh.count = totalCount;
    mesh.instanceMatrix.needsUpdate = true;
  }, [countX, countY, countZ, totalCount, voxelScale, terrainYOffset, voxelWidth]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalCount]}>
      <boxGeometry args={[voxelScale, voxelScale, voxelScale]} />
      <meshBasicMaterial wireframe color="#0ff" />
    </instancedMesh>
  );
}
