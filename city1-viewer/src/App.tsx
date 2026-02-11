import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { CityScene } from './components/CityScene';
import { MenuBar } from './components/MenuBar';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 60, -90], fov: 50, near: 0.1, far: 1000 }}
        style={{ background: '#87CEEB' }}
      >
        <Suspense fallback={null}>
          <CityScene />
        </Suspense>
      </Canvas>
      <Loader />
      <MenuBar />
    </div>
  );
}
