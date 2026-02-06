import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useTerrainStore } from '../stores/terrainStore';
import { useDebugStore } from '../stores/debugStore';

export function DebugOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const ballPos = useGameStore((s) => s.ball.position);
  const ballPhase = useGameStore((s) => s.ball.isFlying ? 'Flying' : 'Ground');
  const getHeight = useTerrainStore((s) => s.getHeightAtWorldPosition);

  const {
    showWireframe,
    toggleWireframe,
    freeRoamCamera,
    toggleFreeRoamCamera,
    surfaceEditorOpen,
    setSurfaceEditorOpen,
    terrainYOffset,
    setTerrainYOffset,
    renderYOffset,
    setRenderYOffset,
    heightMultiplier,
    setHeightMultiplier,
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
    setFogFar
  } = useDebugStore();

  const groundHeight = getHeight(ballPos[0], ballPos[2]);

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
        <strong>Terrain Height:</strong> {groundHeight.toFixed(2)}<br/>
        <strong>Delta Y:</strong> {(ballPos[1] - groundHeight).toFixed(2)}
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
        {renderSlider('Render Y Offset', renderYOffset, setRenderYOffset, -20, 20)}
        {renderSlider('Height Multiplier', heightMultiplier, setHeightMultiplier, 0.5, 1.5, 0.01)}
        {renderSlider('Fog Distance', fogFar, setFogFar, 100, 5000)}
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
