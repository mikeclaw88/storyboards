import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useTerrainStore } from '../stores/terrainStore';
import { useDebugStore } from '../stores/debugStore';

export function DebugOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const ballPos = useGameStore((s) => s.ball.position);
  const ballPhase = useGameStore((s) => s.ball.isFlying ? 'Flying' : 'Ground');
  const getHeight = useTerrainStore((s) => s.getHeightAtWorldPosition);

  // Raw terrain data for render height calculation
  const rawHeightData = useTerrainStore((s) => s.rawHeightData);
  const rawDimensions = useTerrainStore((s) => s.rawDimensions);
  const terrainSize = useTerrainStore((s) => s.terrainSize);
  const heightScale = useTerrainStore((s) => s.heightScale);

  const {
    showWireframe,
    toggleWireframe,
    freeRoamCamera,
    toggleFreeRoamCamera,
    surfaceEditorOpen,
    setSurfaceEditorOpen,
    terrainYOffset,
    setTerrainYOffset,
    showVoxels,
    toggleShowVoxels,
    voxelWidth,
    setVoxelWidth,
    voxelHeight,
    setVoxelHeight,
    voxelLength,
    setVoxelLength,
    voxelScale,
    setVoxelScale,
    fogFar,
    setFogFar,
    showSkybox,
    setShowSkybox,
    skyboxUpperSquish,
    setSkyboxUpperSquish,
    skyboxLowerSquish,
    setSkyboxLowerSquish,
    skyboxHorizonStretch,
    setSkyboxHorizonStretch,
    skyboxHorizonBias,
    setSkyboxHorizonBias,
    skyboxRotation,
    setSkyboxRotation,
    droneDelay,
    setDroneDelay,
  } = useDebugStore();

  // Collision height (includes terrainYOffset)
  const collisionHeight = getHeight(ballPos[0], ballPos[2]);

  // Render height (raw heightmap, no offset) — same sampling as GolfCourseRenderer
  let renderHeight = 0;
  if (rawHeightData && rawDimensions.width > 0) {
    const halfSize = terrainSize / 2;
    const u = (ballPos[0] + halfSize) / terrainSize;
    const v = (ballPos[2] + halfSize) / terrainSize;
    const sampleU = Math.max(0, Math.min(1, u));
    const sampleV = Math.max(0, Math.min(1, v));
    const px = Math.floor(sampleU * (rawDimensions.width - 1));
    const py = Math.floor(sampleV * (rawDimensions.height - 1));
    const idx = (py * rawDimensions.width + px) * 4;
    renderHeight = (rawHeightData[idx] / 255) * heightScale;
  }

  const heightOffset = collisionHeight - renderHeight;

  // Toggle with backtick
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '`') setIsVisible(v => !v);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!isVisible) return null;

  const renderSlider = (label: string, value: number, onChange: (val: number) => void, min = -200, max = 200, step = 1) => (
    <div style={{ marginBottom: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span>{step < 1 ? value.toFixed(2) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      background: 'rgba(0, 0, 0, 0.8)',
      color: '#0f0',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      pointerEvents: 'auto',
      zIndex: 9999,
      border: '1px solid #0f0',
      borderRadius: '4px',
      width: '300px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #0f0' }}>DEBUG MODE (`)</h3>

      <div>
        <strong>Ball Pos:</strong><br/>
        X: {ballPos[0].toFixed(2)}<br/>
        Y: {ballPos[1].toFixed(2)}<br/>
        Z: {ballPos[2].toFixed(2)}
      </div>

      <div style={{ marginTop: '5px' }}>
        <strong>Render Height:</strong> {renderHeight.toFixed(2)}<br/>
        <strong>Collision Height:</strong> {collisionHeight.toFixed(2)}<br/>
        <strong>Offset:</strong> {heightOffset.toFixed(2)}<br/>
        <strong>Ball Delta Y:</strong> {(ballPos[1] - collisionHeight).toFixed(2)}
      </div>

      <div style={{ marginTop: '5px' }}>
        <strong>State:</strong> {ballPhase}
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '5px' }}>
          <input
            type="checkbox"
            checked={showWireframe}
            onChange={toggleWireframe}
            style={{ marginRight: '5px' }}
          />
          Show Collision Mesh
        </label>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '5px' }}>
          <input
            type="checkbox"
            checked={freeRoamCamera}
            onChange={toggleFreeRoamCamera}
            style={{ marginRight: '5px' }}
          />
          Freeroam Camera
        </label>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={surfaceEditorOpen}
            onChange={(e) => setSurfaceEditorOpen(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Open Surface Editor (Paint)
        </label>
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>
        <strong>Terrain</strong>
        {renderSlider('Y Offset', terrainYOffset, setTerrainYOffset, -20, 20)}
        {renderSlider('Fog Distance', fogFar, setFogFar, 100, 5000)}
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>
        <strong>Camera</strong>
        {renderSlider('Drone Delay', droneDelay, setDroneDelay, 0, 5, 0.1)}
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>
        <strong>Skybox</strong>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '5px', marginTop: '5px' }}>
          <input
            type="checkbox"
            checked={showSkybox}
            onChange={(e) => setShowSkybox(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Show Skybox
        </label>
        {renderSlider('Upper Squish', skyboxUpperSquish, setSkyboxUpperSquish, 0.1, 5.0, 0.1)}
        {renderSlider('Lower Squish', skyboxLowerSquish, setSkyboxLowerSquish, 0.1, 5.0, 0.1)}
        {renderSlider('Horizon Stretch', skyboxHorizonStretch, setSkyboxHorizonStretch, 0.1, 5.0, 0.1)}
        {renderSlider('Horizon Bias', skyboxHorizonBias, setSkyboxHorizonBias, -0.9, 0.9, 0.01)}
        {renderSlider('Rotation', skyboxRotation, setSkyboxRotation, -3.14, 3.14, 0.01)}
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '5px' }}>
          <input
            type="checkbox"
            checked={showVoxels}
            onChange={toggleShowVoxels}
            style={{ marginRight: '5px' }}
          />
          Show Voxel Grid
        </label>
        {showVoxels && (
          <>
            {renderSlider('Width', voxelWidth, setVoxelWidth, 10, 300)}
            {renderSlider('Height', voxelHeight, setVoxelHeight, 1, 50)}
            {renderSlider('Length', voxelLength, setVoxelLength, 10, 400)}
            {renderSlider('Voxel Scale', voxelScale, (v) => setVoxelScale(Math.round(v)), 1, 20)}
          </>
        )}
      </div>

    </div>
  );
}
