import { useRef, useEffect, useState, Suspense } from 'react';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore, isVideoCharacter } from '../stores/gameStore';
import { useDebugStore } from '../stores/debugStore';
import { AimController } from '../components/AimController';
import { TeeBox } from '../components/TeeBox';
import { TargetZones } from '../components/TargetZone';
import { Terrain } from '../components/Terrain';
import { GolfCourseRenderer } from '../components/GolfCourseRenderer';
import { CollisionWireframe } from '../components/CollisionWireframe';
import { GolfHole } from '../components/GolfHole';
import { SurfaceEditor } from '../components/SurfaceEditor';
import { useMotionConfig } from '../hooks/useMotionConfig';
import { useSceneConfig } from '../hooks/useSceneConfig';
import { SceneProps } from '../components/SceneProp';
import { CameraController } from '../components/CameraController';
import { DynamicCharacter } from '../components/StageCharacter';
import { DynamicGolfTee, DynamicGolfBall } from '../components/StageGolfObjects';
import { VoxelDebug } from '../components/VoxelDebug';

// Polar angle limits for play mode
const PLAY_MODE_FIXED_POLAR_ANGLE = 1.45; // ~83 degrees from vertical (nearly level)
const PLAY_MODE_MIN_POLAR_ANGLE = 0.3; // ~17 degrees from vertical (looking down)
const PLAY_MODE_MAX_POLAR_ANGLE = Math.PI / 2; // 90 degrees (horizontal)

// Azimuth angle limits for play mode (left-right rotation for aiming)
const PLAY_MODE_AZIMUTH_RANGE = (12 * Math.PI) / 180; // +/-12 degrees from center

/**
 * Training stage with floor and character
 */
export function Stage() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const screenMode = useGameStore((s) => s.screenMode);
  const ballPos = useGameStore((s) => s.ball.position);
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  
  // Debug state
  const { showWireframe, freeRoamCamera, surfaceEditorOpen, showVoxels } = useDebugStore();

  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isCameraFollowing, setIsCameraFollowing] = useState(false);
  const { getPlayCamera } = useMotionConfig();
  const playPolarAngle = getPlayCamera().polarAngle ?? PLAY_MODE_FIXED_POLAR_ANGLE;
  const [lockedPolarAngle, setLockedPolarAngle] = useState(playPolarAngle);
  const [centerAzimuthAngle, setCenterAzimuthAngle] = useState<number | null>(null);

  // Sync locked polar angle when config loads
  useEffect(() => {
    setLockedPolarAngle(playPolarAngle);
  }, [playPolarAngle]);

  const { getTerrainNode, getTeeBoxNode, getProps } = useSceneConfig();
  const terrainConfig = getTerrainNode();
  const teeBoxConfig = getTeeBoxNode();
  const props = getProps();

  // Track modifier keys for camera control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(true);
      if (e.key === 'Control') setIsCtrlPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        if (controlsRef.current) {
          setLockedPolarAngle(controlsRef.current.getPolarAngle());
        }
        setIsAltPressed(false);
      }
      if (e.key === 'Control') setIsCtrlPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Camera Constraints Logic
  const minPolarAngle = surfaceEditorOpen ? 0 : (freeRoamCamera 
    ? 0.1 
    : (screenMode === 'playing'
      ? (isCameraFollowing ? 0.1 : (isAltPressed ? PLAY_MODE_MIN_POLAR_ANGLE : lockedPolarAngle))
      : 0.2));
      
  const maxPolarAngle = surfaceEditorOpen ? 0 : (freeRoamCamera
    ? Math.PI - 0.1
    : (screenMode === 'playing'
      ? (isCameraFollowing ? Math.PI - 0.1 : (isAltPressed ? PLAY_MODE_MAX_POLAR_ANGLE : lockedPolarAngle))
      : Math.PI / 2.1));

  // Force Top Down View for Editor
  useEffect(() => {
    if (surfaceEditorOpen && controlsRef.current) {
      // Look down
      controlsRef.current.object.position.set(0, 200, 150); // High up, centered Z
      controlsRef.current.target.set(0, 0, 150);
      controlsRef.current.update();
    }
  }, [surfaceEditorOpen]);

  const minAzimuthAngle = !surfaceEditorOpen && !freeRoamCamera && screenMode === 'playing' && centerAzimuthAngle !== null && !isCameraFollowing
    ? centerAzimuthAngle - PLAY_MODE_AZIMUTH_RANGE
    : -Infinity;
    
  const maxAzimuthAngle = !surfaceEditorOpen && !freeRoamCamera && screenMode === 'playing' && centerAzimuthAngle !== null && !isCameraFollowing
    ? centerAzimuthAngle + PLAY_MODE_AZIMUTH_RANGE
    : Infinity;

  const minDistance = surfaceEditorOpen ? 50 : (screenMode === 'playing' && isVideoCharacter(selectedCharacter) ? 2 : 3);
  const maxDistance = surfaceEditorOpen ? 500 : (freeRoamCamera ? 500 : (screenMode === 'playing' ? 10 : 50));

  const enableCameraInSelection = screenMode === 'selection' && isCtrlPressed;
  
  const enableRotate = !surfaceEditorOpen && (freeRoamCamera || (!isCameraFollowing && (screenMode !== 'selection' || enableCameraInSelection)));
  const enableZoom = freeRoamCamera || surfaceEditorOpen || (!isCameraFollowing && (screenMode !== 'selection' || enableCameraInSelection));
  const enablePan = freeRoamCamera || surfaceEditorOpen || (!isCameraFollowing && (screenMode === 'selection' ? enableCameraInSelection : isAltPressed));

  return (
    <>
      <CameraController
        controlsRef={controlsRef}
        onFollowStateChange={setIsCameraFollowing}
        onCenterAzimuthChange={setCenterAzimuthAngle}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableRotate={enableRotate}
        enableZoom={enableZoom}
        enablePan={enablePan}
        minPolarAngle={minPolarAngle}
        maxPolarAngle={maxPolarAngle}
        minAzimuthAngle={minAzimuthAngle}
        maxAzimuthAngle={maxAzimuthAngle}
        minDistance={minDistance}
        maxDistance={maxDistance}
        target={[0, 1, 0]}
      />

      <ambientLight intensity={0.8} />
      <directionalLight
        position={[8, 15, 8]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0001}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <hemisphereLight
        color="#ffffff"
        groundColor="#88cc88"
        intensity={0.6}
      />

      <Environment preset="sunset" background={false} />

      {/* Old Terrain Disabled - Handled by GolfCourseRenderer */}
      {/* {terrainConfig.visible && (
        <group
          position={[terrainConfig.position.x, terrainConfig.position.y, terrainConfig.position.z]}
          scale={terrainConfig.scale ?? 1}
          rotation={[
            (terrainConfig.rotation.x * Math.PI) / 180,
            (terrainConfig.rotation.y * Math.PI) / 180,
            (terrainConfig.rotation.z * Math.PI) / 180,
          ]}
        >
          <Suspense fallback={null}>
            <Terrain
              url={terrainConfig.url}
              position={[0, 0, 0]}
              worldPosition={[terrainConfig.position.x, terrainConfig.position.y, terrainConfig.position.z]}
              terrainScale={terrainConfig.scale ?? 1}
            />
          </Suspense>
        </group>
      )} */}
      
      {showWireframe && <CollisionWireframe />}
      {showVoxels && <VoxelDebug />}

      {/* TeeBox Disabled - Handled by GolfCourseRenderer or check overlap */}
      {/* {teeBoxConfig.visible && (
        <Suspense fallback={null}>
          <TeeBox config={teeBoxConfig} />
        </Suspense>
      )} */}

      <GolfCourseRenderer />
      <DynamicCharacter />
      <DynamicGolfTee />
      <DynamicGolfBall />
      <GolfHole />
      <AimController controlsRef={controlsRef} />
      <TargetZones />
      <SceneProps props={props} />
      <SurfaceEditor />
    </>
  );
}
