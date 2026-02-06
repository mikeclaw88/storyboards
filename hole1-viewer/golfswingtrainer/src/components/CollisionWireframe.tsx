import { useMemo } from 'react';
import * as THREE from 'three';
import { useTerrainStore } from '../stores/terrainStore';
import { useDebugStore } from '../stores/debugStore';
import { getHeightmapSize } from '../utils/terrainLoader';

export function CollisionWireframe() {
  const terrainData = useTerrainStore((s) => s.terrainData);
  const terrainPosition = useTerrainStore((s) => s.terrainPosition);
  const heightScale = useTerrainStore((s) => s.heightScale);
  const terrainScale = useTerrainStore((s) => s.terrainScale);
  const terrainYOffset = useDebugStore((s) => s.terrainYOffset);

  const geometry = useMemo(() => {
    if (!terrainData) return null;

    const { dimensions, heightData } = terrainData;
    const { width, depth } = dimensions;
    const { cols, rows } = getHeightmapSize(dimensions);

    const geo = new THREE.PlaneGeometry(width, depth, cols - 1, rows - 1);
    
    // Rotate to XZ plane first
    geo.rotateX(-Math.PI / 2);

    // Apply displacement (same algorithm as visual terrain)
    const posAttribute = geo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      posAttribute.setY(i, (heightData[i] || 0) * heightScale);
    }
    
    // Recalculate normals/bounds
    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    return geo;
  }, [terrainData, heightScale, terrainScale, terrainPosition.y, terrainYOffset]);

  if (!geometry) return null;

  return (
    <group
      position={[terrainPosition.x, terrainPosition.y + terrainYOffset, terrainPosition.z]}
      scale={[terrainScale, terrainScale, terrainScale]}
    >
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#ff0000" 
          wireframe={true} 
          transparent={true} 
          opacity={0.3} 
        />
      </mesh>
    </group>
  );
}
