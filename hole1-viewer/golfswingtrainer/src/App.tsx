import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Stage } from './scenes/Stage';

export default function App() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 150, 300], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
}
