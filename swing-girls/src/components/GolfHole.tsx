import { useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

export function GolfHole() {
  const holePosition = useGameStore((s) => s.holePosition);

  return (
    <group position={holePosition}>
      {/* The Hole (Black Circle) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.108, 32]} /> {/* Standard hole diameter ~4.25 inches = 0.108m radius */}
        <meshBasicMaterial color="black" />
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
