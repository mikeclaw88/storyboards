import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
// Keep imports to test if they cause crash
import { useGameStore } from '../stores/gameStore';
import { useDebugStore } from '../stores/debugStore';
import { GolfCourseRenderer } from '../components/GolfCourseRenderer';
import { useMotionConfig } from '../hooks/useMotionConfig';
import { useSceneConfig } from '../hooks/useSceneConfig';

export function Stage() {
  // Test hooks - if these crash, we'll know
  const screenMode = useGameStore((s) => s.screenMode);
  // const { getPlayCamera } = useMotionConfig();
  // const { getTerrainNode } = useSceneConfig();

  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Test GolfCourseRenderer (Red Box version) */}
      <GolfCourseRenderer />
    </>
  );
}
