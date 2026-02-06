import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function GolfCourseRenderer() {
  return (
    <group>
        <mesh position={[0, 50, 0]}>
            <boxGeometry args={[10, 100, 10]} />
            <meshBasicMaterial color={0xff0000} />
        </mesh>
    </group>
  );
}
