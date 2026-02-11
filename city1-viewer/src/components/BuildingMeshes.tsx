import { useRef, useMemo } from 'react';
import { useLoader, type ThreeEvent } from '@react-three/fiber';
import { TextureLoader, SRGBColorSpace, Color, type Mesh } from 'three';
import { useCityStore } from '../stores/cityStore';
import type { Building } from '../lib/cityImporter';

function BuildingBox({ building }: { building: Building }) {
  const meshRef = useRef<Mesh>(null);
  const selectedId = useCityStore((s) => s.selectedBuildingId);
  const setSelectedId = useCityStore((s) => s.setSelectedBuildingId);
  const isSelected = selectedId === building.id;

  const detailMap = useLoader(TextureLoader, './assets/city/detailmap.jpeg');

  // Textured material for roof (top face)
  const roofTexture = useMemo(() => {
    const tex = detailMap.clone();
    tex.colorSpace = SRGBColorSpace;
    const [u0, v0] = building.uvMin;
    const [u1, v1] = building.uvMax;
    tex.offset.set(u0, v0);
    tex.repeat.set(u1 - u0, v1 - v0);
    tex.needsUpdate = true;
    return tex;
  }, [detailMap, building.uvMin, building.uvMax]);

  // Solid color from average detailmap color for sides
  const sideColor = useMemo(
    () => new Color(building.avgColor[0], building.avgColor[1], building.avgColor[2]),
    [building.avgColor]
  );

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedId(building.id);
  };

  const emissive = isSelected ? '#4488ff' : '#000000';
  const emissiveIntensity = isSelected ? 0.5 : 0;

  // BoxGeometry material order: [+x, -x, +y, -y, +z, -z]
  // +y (index 2) = roof = textured; all others = solid side color
  return (
    <mesh
      ref={meshRef}
      position={[building.x, building.baseHeight + building.extrudeHeight / 2, building.z]}
      onClick={handleClick}
    >
      <boxGeometry args={[building.width, building.extrudeHeight, building.depth]} />
      <meshStandardMaterial attach="material-0" color={sideColor} roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
      <meshStandardMaterial attach="material-1" color={sideColor} roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
      <meshStandardMaterial attach="material-2" map={roofTexture} roughness={0.6} metalness={0.1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
      <meshStandardMaterial attach="material-3" color={sideColor} roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
      <meshStandardMaterial attach="material-4" color={sideColor} roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
      <meshStandardMaterial attach="material-5" color={sideColor} roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
    </mesh>
  );
}

export function BuildingMeshes() {
  const buildings = useCityStore((s) => s.buildings);
  const setSelectedId = useCityStore((s) => s.setSelectedBuildingId);

  if (buildings.length === 0) return null;

  return (
    <group onPointerMissed={() => setSelectedId(null)}>
      {buildings.map((b) => (
        <BuildingBox key={b.id} building={b} />
      ))}
    </group>
  );
}
