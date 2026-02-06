import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PCFSoftShadowMap } from 'three';
import { Stage } from './scenes/Stage';
import { CharacterSelectionScreen } from './components/CharacterSelectionScreen';
import { SwingButton } from './components/SwingButton';
import { PowerArc } from './components/PowerArc';
import { PauseButton } from './components/PauseButton';
import { PauseModal } from './components/PauseModal';
import { ModeSelectionUI } from './components/ModeSelectionUI';
import { useGameStore } from './stores/gameStore';
import { DebugOverlay } from './components/DebugOverlay';
import { LoadScreen } from './components/LoadScreen';
import { GameHUD } from './components/GameHUD';
import { GameEndModal } from './components/GameEndModal';
import { initSurfaceMap } from './utils/surfaceDetection';

export default function App() {
  const screenMode = useGameStore((s) => s.screenMode);
  const setArcPower = useGameStore((s) => s.setArcPower);

  // Load surface map for terrain type detection
  useEffect(() => {
    initSurfaceMap();
  }, []);

  return (
    <div className="w-full h-full relative">
      <LoadScreen />
      <DebugOverlay />
      <GameEndModal />
      <Canvas
        shadows={{ type: PCFSoftShadowMap }}
        camera={{
          position: [0.0705, 2.4411, -2.7293],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <color attach="background" args={['#a8e6ff']} />
        <fog attach="fog" args={['#a8e6ff', 50, 300]} />

        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      </Canvas>


      {/* UI based on screen mode */}
      {screenMode === 'selection' ? (
        <>
          <CharacterSelectionScreen />
          <ModeSelectionUI />
        </>
      ) : (
        <>
          <GameHUD />
          {/* Pause button - top right */}
          <div className="absolute top-6 right-6 z-10">
            <PauseButton />
          </div>
          <PowerArc visible={true} onPowerCapture={setArcPower} />
          <SwingButton />
          <PauseModal />
        </>
      )}
    </div>
  );
}
