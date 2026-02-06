import { useMemo } from 'react';
import * as THREE from 'three';
import { useTerrainStore } from '../stores/terrainStore';
import { useDebugStore } from '../stores/debugStore';

export function CollisionWireframe() {
  const rawHeightData = useTerrainStore((s) => s.rawHeightData);
  const rawDimensions = useTerrainStore((s) => s.rawDimensions);
  const terrainSize = useTerrainStore((s) => s.terrainSize);
  const heightScale = useTerrainStore((s) => s.heightScale);
  const terrainYOffset = useDebugStore((s) => s.terrainYOffset);

  const geometry = useMemo(() => {
    if (!rawHeightData || rawDimensions.width === 0) return null;

    const { width, height } = rawDimensions;

    // Match GolfCourseRenderer: PlaneGeometry(terrainSize, terrainSize, w-1, h-1)
    // rotated -PI/2 to lay flat on XZ plane
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, width - 1, height - 1);

    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;

    // Apply height displacement — same as GolfCourseRenderer
    // sampleHeight(u, 1-v) * heightScale, set into Z (pre-rotation)
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);

      // Sample height from raw data — flip v to match renderer
      const sampleU = Math.max(0, Math.min(1, u));
      const sampleV = Math.max(0, Math.min(1, 1 - v));

      const px = Math.floor(sampleU * (width - 1));
      const py = Math.floor(sampleV * (height - 1));
      const idx = (py * width + px) * 4;
      const h = (rawHeightData[idx] / 255) * heightScale;

      pos.setZ(i, h);
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    return geo;
  }, [rawHeightData, rawDimensions, terrainSize, heightScale]);

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, terrainYOffset, 0]}
    >
      <meshBasicMaterial
        color="#ff0000"
        wireframe={true}
        transparent={true}
        opacity={0.3}
      />
    </mesh>
  );
}
