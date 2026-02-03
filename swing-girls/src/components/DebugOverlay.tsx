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
    splatSwitchDistance, 
    setSplatSwitchDistance,
    teeSplatOffset,
    setTeeSplatOffset,
    greenSplatOffset,
    setGreenSplatOffset
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

  const renderSlider = (label: string, value: number, onChange: (val: number) => void, min = -200, max = 200) => (
    <div style={{ marginBottom: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
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
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showWireframe} 
            onChange={toggleWireframe}
            style={{ marginRight: '5px' }}
          />
          Show Collision Mesh
        </label>
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>
        <strong>Settings</strong>
        {renderSlider('Add Green Dist', splatSwitchDistance, setSplatSwitchDistance, 0, 300)}
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>
        <strong>Tee Splat Offset</strong>
        {renderSlider('X', teeSplatOffset.x, (v) => setTeeSplatOffset('x', v))}
        {renderSlider('Y', teeSplatOffset.y, (v) => setTeeSplatOffset('y', v))}
        {renderSlider('Z', teeSplatOffset.z, (v) => setTeeSplatOffset('z', v))}
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>
        <strong>Green Splat Offset</strong>
        {renderSlider('X', greenSplatOffset.x, (v) => setGreenSplatOffset('x', v))}
        {renderSlider('Y', greenSplatOffset.y, (v) => setGreenSplatOffset('y', v))}
        {renderSlider('Z', greenSplatOffset.z, (v) => setGreenSplatOffset('z', v))}
      </div>
    </div>
  );
}
