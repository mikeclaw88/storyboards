import { useRef, useEffect, useState, Suspense } from 'react';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore, isVideoCharacter } from '../stores/gameStore';
import { useDebugStore } from '../stores/debugStore';
import { AimController } from '../components/AimController';
import { TeeBox } from '../components/TeeBox';
import { TargetZones } from '../components/TargetZone';
import { Terrain } from '../components/Terrain';
import { Splat } from '../components/Splat';
import { CollisionWireframe } from '../components/CollisionWireframe';
import { useMotionConfig } from '../hooks/useMotionConfig';
import { useSceneConfig } from '../hooks/useSceneConfig';
import { SceneProps } from '../components/SceneProp';
import { CameraController } from '../components/CameraController';
import { DynamicCharacter } from '../components/StageCharacter';
import { DynamicGolfTee, DynamicGolfBall } from '../components/StageGolfObjects';

// Polar angle limits for play mode
const PLAY_MODE_FIXED_POLAR_ANGLE = 1.45; // ~83 degrees from vertical (nearly level)
const PLAY_MODE_MIN_POLAR_ANGLE = 0.3; // ~17 degrees from vertical (looking down)
const PLAY_MODE_MAX_POLAR_ANGLE = Math.PI / 2; // 90 degrees (horizontal)

// Azimuth angle limits for play mode (left-right rotation for aiming)
const PLAY_MODE_AZIMUTH_RANGE = (12 * Math.PI) / 180; // +/-12 degrees from center

// Secondary Green Splat URL
const GREEN_SPLAT_URL = './splats/hole1green.spz';

/**
 * Training stage with floor and character
 */
export function Stage() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const screenMode = useGameStore((s) => s.screenMode);
  const ballPos = useGameStore((s) => s.ball.position);
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  
  // Debug state
  const { showWireframe, splatSwitchDistance, teeSplatOffset, greenSplatOffset } = useDebugStore();

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

  const { getTerrainNode, getSplatNode, getTeeBoxNode, getProps } = useSceneConfig();
  const terrainConfig = getTerrainNode();
  const splatConfig = getSplatNode();
  const teeBoxConfig = getTeeBoxNode();
  const props = getProps();

  // Determine which splat to show
  // Assuming ball travels along +Z (or whatever direction fairway is)
  // Distance from origin along Z axis
  const distZ = ballPos[2];
  // Since we rotated 180, forward might be negative Z or positive depending on world space.
  // Actually, usually golf games align tee at 0 and green at +Z.
  // Let's assume switch distance is magnitude from tee.
  // Or just check if Z > switchDistance (if green is positive Z)
  
  // Simple check: use distance from (0,0,0)
  const distFromTee = Math.sqrt(ballPos[0]*ballPos[0] + ballPos[2]*ballPos[2]);
  
  // Logic: Show Green Splat if further than switch distance
  const useGreenSplat = distFromTee > splatSwitchDistance;

  // Track modifier keys for camera control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(true);
      if (e.key === 'Control') setIsCtrlPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        // Capture current polar angle before releasing Alt
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

  // In play mode, lock vertical rotation by default. Alt key unlocks it.
  // When Alt is released, camera stays at the rotated position (lockedPolarAngle).
  // When camera is following ball, allow any polar angle to prevent snapping
  const minPolarAngle = screenMode === 'playing'
    ? (isCameraFollowing ? 0.1 : (isAltPressed ? PLAY_MODE_MIN_POLAR_ANGLE : lockedPolarAngle))
    : 0.2;
  const maxPolarAngle = screenMode === 'playing'
    ? (isCameraFollowing ? Math.PI - 0.1 : (isAltPressed ? PLAY_MODE_MAX_POLAR_ANGLE : lockedPolarAngle))
    : Math.PI / 2.1;

  // In play mode, limit horizontal rotation (aiming) to +/-10 degrees from initial position
  // When camera is following ball, allow free rotation
  const minAzimuthAngle = screenMode === 'playing' && centerAzimuthAngle !== null && !isCameraFollowing
    ? centerAzimuthAngle - PLAY_MODE_AZIMUTH_RANGE
    : -Infinity;
  const maxAzimuthAngle = screenMode === 'playing' && centerAzimuthAngle !== null && !isCameraFollowing
    ? centerAzimuthAngle + PLAY_MODE_AZIMUTH_RANGE
    : Infinity;

  // Closer min distance for video characters
  const minDistance = screenMode === 'playing' && isVideoCharacter(selectedCharacter) ? 2 : 3;

  // In selection mode, enable camera controls only when Ctrl is pressed
  const enableCameraInSelection = screenMode === 'selection' && isCtrlPressed;

  return (
    <>
      {/* Camera Controller */}
      <CameraController
        controlsRef={controlsRef}
        onFollowStateChange={setIsCameraFollowing}
        onCenterAzimuthChange={setCenterAzimuthAngle}
      />

      {/* Camera Controls - disabled during follow camera mode */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableRotate={!isCameraFollowing && (screenMode !== 'selection' || enableCameraInSelection)}
        enableZoom={!isCameraFollowing && (screenMode !== 'selection' || enableCameraInSelection)}
        enablePan={!isCameraFollowing && (screenMode === 'selection' ? enableCameraInSelection : isAltPressed)}
        minPolarAngle={minPolarAngle}
        maxPolarAngle={maxPolarAngle}
        minAzimuthAngle={minAzimuthAngle}
        maxAzimuthAngle={maxAzimuthAngle}
        minDistance={minDistance}
        maxDistance={screenMode === 'playing' ? 10 : 50}
        target={[0, 1, 0]}
      />

      {/* Lighting - bright and vibrant */}
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

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* Terrain - loaded from .terrain file, using scene config */}
      {terrainConfig.visible && (
        <group
          position={[terrainConfig.position.x, terrainConfig.position.y, terrainConfig.position.z]}
          scale={terrainConfig.scale ?? 1}
          rotation={[
            (terrainConfig.rotation.x * Math.PI) / 180,
            (terrainConfig.rotation.y * Math.PI) / 180,
            (terrainConfig.rotation.z * Math.PI) / 180,
          ]}
        >
          <Suspense fallback={
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[150, 200]} />
              <meshStandardMaterial color="#6abf69" roughness={0.7} />
            </mesh>
          }>
            <Terrain
              url={terrainConfig.url}
              position={[0, 0, 0]}
              worldPosition={[terrainConfig.position.x, terrainConfig.position.y, terrainConfig.position.z]}
              terrainScale={terrainConfig.scale ?? 1}
            />
          </Suspense>
        </group>
      )}
      
      {/* Collision Wireframe Debug View */}
      {showWireframe && <CollisionWireframe />}

      {/* Gaussian Splats */}
      {/* Tee Splat */}
      <Splat
        url={splatConfig.url}
        position={[
          splatConfig.position.x + teeSplatOffset.x, 
          splatConfig.position.y + teeSplatOffset.y, 
          splatConfig.position.z + teeSplatOffset.z
        ]}
        rotation={[splatConfig.rotation.x, splatConfig.rotation.y, splatConfig.rotation.z]}
        scale={splatConfig.scale}
        visible={splatConfig.visible && !useGreenSplat}
      />
      
      {/* Green Splat (uses same transform as Tee Splat for now, plus offset) */}
      <Splat
        url={GREEN_SPLAT_URL}
        position={[
          splatConfig.position.x + greenSplatOffset.x, 
          splatConfig.position.y + greenSplatOffset.y, 
          splatConfig.position.z + greenSplatOffset.z
        ]}
        rotation={[splatConfig.rotation.x, splatConfig.rotation.y, splatConfig.rotation.z]}
        scale={splatConfig.scale}
        visible={splatConfig.visible && useGreenSplat}
      />

      {/* Grid overlay - optional, can be removed */}
      {/* <Grid
        args={[150, 200]}
        cellSize={5}
        cellThickness={0.3}
        cellColor="#7dd87d"
        sectionSize={25}
        sectionThickness={0.5}
        sectionColor="#5cb85c"
        fadeDistance={150}
        fadeStrength={1}
        followCamera={false}
        position={[terrainConfig.position.x, terrainConfig.position.y + 0.05, terrainConfig.position.z]}
      /> */}

      {/* Tee Box - GLB model from scene config */}
      {teeBoxConfig.visible && (
        <Suspense fallback={null}>
          <TeeBox config={teeBoxConfig} />
        </Suspense>
      )}

      {/* Character */}
      <DynamicCharacter />

      {/* Golf Tee - always visible */}
      <DynamicGolfTee />

      {/* Golf Ball - only in play mode */}
      <DynamicGolfBall />

      {/* Aim Controller - syncs camera angle to store for ball physics */}
      <AimController controlsRef={controlsRef} />

      {/* Topgolf Target Zones - only in topgolf mode */}
      <TargetZones />

      {/* Scene Props - from scene config */}
      <SceneProps props={props} />
    </>
  );
}
