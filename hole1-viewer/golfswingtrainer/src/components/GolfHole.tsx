import { useGameStore } from '../stores/gameStore';
import { useTerrainStore } from '../stores/terrainStore';
import { getHeightAtWorld } from '../utils/terrainLoader';

export function GolfHole() {
  const holePosition = useGameStore((s) => s.holePosition);
  const terrainData = useTerrainStore((s) => s.terrainData);
  const terrainPosition = useTerrainStore((s) => s.terrainPosition);
  const heightScale = useTerrainStore((s) => s.heightScale);
  const terrainScale = useTerrainStore((s) => s.terrainScale);

  // Compute terrain surface height directly, bypassing debug offsets/clamps
  let terrainY = holePosition[1];
  if (terrainData) {
    const localX = (holePosition[0] - terrainPosition.x) / terrainScale;
    const localZ = (holePosition[2] - terrainPosition.z) / terrainScale;
    const rawHeight = getHeightAtWorld(
      terrainData.heightData,
      terrainData.dimensions,
      localX,
      localZ,
      heightScale
    );
    terrainY = rawHeight * terrainScale + terrainPosition.y;
  }
  const adjustedPosition: [number, number, number] = [holePosition[0], terrainY, holePosition[2]];

  return (
    <group position={adjustedPosition}>
      {/* The Hole (Black Circle) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.108, 32]} />
        <meshBasicMaterial color="black" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      
      {/* Flagstick (Optional, simple cylinder) */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 2, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Flag (Red triangle) */}
      <mesh position={[0, 1.8, 0.25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshStandardMaterial color="red" side={2} />
      </mesh>
    </group>
  );
}
