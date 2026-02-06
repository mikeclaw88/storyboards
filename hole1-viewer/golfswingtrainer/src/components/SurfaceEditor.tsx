import { useRef, useEffect, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useDebugStore } from '../stores/debugStore';

// Surface Colors
const COLORS = {
  Rough: '#80807f',
  Fairway: '#fefa05',
  Green: '#00ffff',   // cyan (putting green)
  Sand: '#0607f5',
  OB: '#077907',
};

const SURFACE_TYPES = ['Rough', 'Fairway', 'Green', 'Sand', 'OB'] as const;
type SurfaceType = typeof SURFACE_TYPES[number];

const MAP_SIZE = 512;
const WORLD_WIDTH = 300; // Meters width (X: -150 to 150)
const WORLD_DEPTH = 400; // Meters depth (Z: -50 to 350)
const WORLD_OFFSET_Z = 150; // Center Z

// Reusable clipping plane — clips everything above yCutoff
const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);

export function SurfaceEditor() {
  const { surfaceEditorOpen, yCutoff, setYCutoff } = useDebugStore();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>('Fairway');
  const [brushSize, setBrushSize] = useState(10);
  const isPaintingRef = useRef(false);

  const SURFACE_MAP_URL = './terrains/textures/hole1_surface.png';

  // Initialize Canvas + texture once
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = MAP_SIZE;
    canvas.height = MAP_SIZE;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    textureRef.current = tex;
  }, []);

  // Load existing surface map when editor opens
  useEffect(() => {
    if (!surfaceEditorOpen) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, MAP_SIZE, MAP_SIZE);
      if (textureRef.current) textureRef.current.needsUpdate = true;
    };
    // Cache-bust to get latest saved version
    img.src = `${SURFACE_MAP_URL}?t=${Date.now()}`;
  }, [surfaceEditorOpen]);

  // Toggle clipping planes when editor opens/closes and force material recompilation
  useEffect(() => {
    if (surfaceEditorOpen) {
      clipPlane.constant = yCutoff;
      gl.clippingPlanes = [clipPlane];
    } else {
      gl.clippingPlanes = [];
    }
    // Force all materials to recompile with/without clipping support
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => { mat.needsUpdate = true; });
      }
    });
    return () => {
      gl.clippingPlanes = [];
    };
  }, [surfaceEditorOpen, gl, scene]);

  // Update clip plane constant when yCutoff changes (no recompilation needed)
  useEffect(() => {
    if (surfaceEditorOpen) {
      clipPlane.constant = yCutoff;
    }
  }, [yCutoff, surfaceEditorOpen]);

  // Paint at UV coordinates from mesh intersection — no manual coordinate math needed
  const paint = useCallback((uv: { x: number; y: number }) => {
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || !textureRef.current) return;

    const px = Math.floor(uv.x * MAP_SIZE);
    const py = Math.floor((1 - uv.y) * MAP_SIZE); // Flip V: canvas Y is top-down, UV Y is bottom-up

    if (px < 0 || px >= MAP_SIZE || py < 0 || py >= MAP_SIZE) return;

    const brushPx = Math.max(1, (brushSize / WORLD_WIDTH) * MAP_SIZE);

    ctx.fillStyle = COLORS[selectedSurface];
    ctx.beginPath();
    ctx.arc(px, py, brushPx, 0, Math.PI * 2);
    ctx.fill();

    textureRef.current.needsUpdate = true;
  }, [selectedSurface, brushSize]);

  if (!surfaceEditorOpen) return null;

  return (
    <>
      {/* HTML UI — pinned left, vertical layout */}
      <Html fullscreen zIndexRange={[20000, 20001]}>
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: '#1a1a1a',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #fff',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 20000,
          pointerEvents: 'auto',
          width: '140px',
        }}>
          {SURFACE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedSurface(type)}
              style={{
                background: selectedSurface === type ? COLORS[type] : '#333',
                color: '#fff',
                border: `2px solid ${selectedSurface === type ? '#fff' : 'transparent'}`,
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textShadow: '0 1px 2px black',
                width: '100%',
              }}
            >
              {type}
            </button>
          ))}
          <div style={{ marginTop: '6px', borderTop: '1px solid #444', paddingTop: '6px' }}>
            <label style={{ color: 'white', fontSize: '10px' }}>Brush: {brushSize}m</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ color: 'white', fontSize: '10px' }}>Y Cutoff: {yCutoff}m</label>
            <input
              type="range"
              min="1"
              max="100"
              value={yCutoff}
              onChange={(e) => setYCutoff(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.download = 'surface-map.png';
              link.href = canvasRef.current.toDataURL();
              link.click();
            }}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '4px',
            }}
          >
            Save Map
          </button>
        </div>
      </Html>
    </>
  );
}
