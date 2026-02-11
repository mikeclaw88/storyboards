import { useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, LinearSRGBColorSpace, SRGBColorSpace } from 'three';
import { useCityStore } from '../stores/cityStore';

export function CityTerrain() {
  const heightScale = useCityStore((s) => s.heightScale);
  const setTerrainReady = useCityStore((s) => s.setTerrainReady);
  const processedHeightTexture = useCityStore((s) => s.processedHeightTexture);

  const detailMap = useLoader(TextureLoader, './assets/city/detailmap.jpeg');
  const heightMap = useLoader(TextureLoader, './assets/city/heightmap.jpeg');

  useEffect(() => {
    // Detail map is photorealistic — use sRGB for correct color
    detailMap.colorSpace = SRGBColorSpace;
    // Heightmap is raw data — use linear for accurate displacement values
    heightMap.colorSpace = LinearSRGBColorSpace;

    setTerrainReady(true);
  }, [detailMap, heightMap, setTerrainReady]);

  // Use processed heightmap if available, otherwise original
  const activeHeightMap = processedHeightTexture ?? heightMap;

  // Terrain dimensions: preserve 1696:2528 aspect ratio
  // Short axis = 100, long axis = 100 * (2528/1696) ≈ 149.06
  const width = 100;
  const depth = 149;
  const segmentsX = 512;
  const segmentsY = 763;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth, segmentsX, segmentsY]} />
      <meshStandardMaterial
        map={detailMap}
        displacementMap={activeHeightMap}
        displacementScale={heightScale}
        roughness={0.8}
        metalness={0.05}
      />
    </mesh>
  );
}
