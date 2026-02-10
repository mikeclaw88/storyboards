import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { CityScene } from './components/CityScene';

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
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: 'white',
          fontSize: 18,
          fontWeight: 700,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}
      >
        City Viewer
      </div>
    </div>
  );
}
