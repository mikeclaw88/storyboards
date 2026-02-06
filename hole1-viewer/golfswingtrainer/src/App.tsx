import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { PCFSoftShadowMap } from 'three';
import { Stage } from './scenes/Stage';
import { CharacterSelectionScreen } from './components/CharacterSelectionScreen';
import { SwingButton } from './components/SwingButton';
import { PowerArc } from './components/PowerArc';
import { PauseButton } from './components/PauseButton';
import { PauseModal } from './components/PauseModal';
import { ModeSelectionUI } from './components/ModeSelectionUI';
import { useGameStore } from './stores/gameStore';
import { useDebugStore } from './stores/debugStore';
import { useVideoConfigStore } from './stores/videoConfigStore';
import { DebugOverlay } from './components/DebugOverlay';
import { LoadScreen } from './components/LoadScreen';
import { GameHUD } from './components/GameHUD';
import { GameEndModal } from './components/GameEndModal';
import { ClubSelector } from './components/ClubSelector';
import { DroneButton } from './components/DroneButton';
import { useThree } from '@react-three/fiber';
import { initSurfaceMap, findRandomGreenPosition } from './utils/surfaceDetection';
// import { HoleViewer } from './scenes/HoleViewer'; // Removed missing import

function FogController() {
  const terrainYOffset = useDebugStore((s) => s.terrainYOffset);
  const { scene } = useThree();
  return null;
}

export default function App() {
  const screenMode = useGameStore((s) => s.screenMode);
  const setArcPower = useGameStore((s) => s.setArcPower);
  const droneMode = useGameStore((s) => s.droneMode);
  const surfaceEditorOpen = useDebugStore((s) => s.surfaceEditorOpen);
  // const viewerMode = useDebugStore((s) => s.viewerMode); // Removed unknown prop

  // Load video config from config.json
  useEffect(() => {
    useVideoConfigStore.getState().loadConfig();
  }, []);

  // Load surface map for terrain type detection
  useEffect(() => {
    initSurfaceMap();
  }, []);
  
  /*
  if (viewerMode) {
    return <HoleViewer />;
  }
  */

  console.log("App: Rendering...");

  return (
    <div className="w-full h-full relative">
      <LoadScreen />
      <DebugOverlay />
      <Canvas
        shadows={false} // Disabled for stability
        camera={{
          position: [0, 50, -250],
          fov: 50,
          near: 0.1,
          far: 2000, 
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <color attach="background" args={['#a8e6ff']} />
        <FogController />

        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      </Canvas>

      <Loader />

      {!surfaceEditorOpen && (screenMode === 'selection' ? (
        <>
          <CharacterSelectionScreen />
          <ModeSelectionUI />
        </>
      ) : (
        <>
          <GameHUD />
          {!droneMode && (
            <div className="absolute bottom-6 right-4 z-40 flex flex-col items-end gap-2">
              <DroneButton />
              <ClubSelector />
            </div>
          )}
          <div className="absolute top-6 right-6 z-10">
            <PauseButton />
          </div>
          <PowerArc visible={true} onPowerCapture={setArcPower} />
          <SwingButton />
          <PauseModal />
        </>
      ))}
      <GameEndModal />
    </div>
  );
}
