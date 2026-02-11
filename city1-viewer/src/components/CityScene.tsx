import { OrbitControls } from '@react-three/drei';
import { CityTerrain } from './CityTerrain';
import { BuildingMeshes } from './BuildingMeshes';

export function CityScene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[40, 60, -30]} intensity={1.0} />
      <hemisphereLight args={['#87CEEB', '#444444', 0.4]} />

      {/* Controls */}
      <OrbitControls
        minDistance={5}
        maxDistance={300}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Terrain */}
      <CityTerrain />

      {/* Buildings (rendered after import) */}
      <BuildingMeshes />
    </>
  );
}
