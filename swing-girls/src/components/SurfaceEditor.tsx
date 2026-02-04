import { useRef, useEffect, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDebugStore } from '../stores/debugStore';

// Surface Colors
const COLORS = {
  Rough: '#2d5a27', // Dark Green
  Fairway: '#4ade80', // Light Green
  Green: '#22c55e', // Bright Green
  Sand: '#f59e0b', // Yellow/Orange
  OB: '#ef4444', // Red
};

const SURFACE_TYPES = ['Rough', 'Fairway', 'Green', 'Sand', 'OB'] as const;
type SurfaceType = typeof SURFACE_TYPES[number];

const MAP_SIZE = 512;
const WORLD_WIDTH = 300; // Meters width (X: -150 to 150)
const WORLD_DEPTH = 400; // Meters depth (Z: -50 to 350)
const WORLD_OFFSET_Z = 150; // Center Z

export function SurfaceEditor() {
  const { surfaceEditorOpen } = useDebugStore();
  const { camera, raycaster, pointer, scene } = useThree();
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>('Fairway');
  const [brushSize, setBrushSize] = useState(10);
  const [isPainting, setIsPainting] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = MAP_SIZE;
    canvas.height = MAP_SIZE;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = COLORS.Rough; // Default background
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    textureRef.current = tex;
  }, []);

  // Painting Logic
  const paint = (point: THREE.Vector3) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !textureRef.current) return;

    // Map World (X, Z) to Canvas (0..SIZE)
    // X: -150 to 150 -> 0 to 512
    const u = (point.x + WORLD_WIDTH / 2) / WORLD_WIDTH;
    // Z: -50 to 350 -> 0 to 512 (Inverted Z typically for maps?)
    // Let's assume Z increases downwards on map
    const v = (point.z + 50) / WORLD_DEPTH;

    if (u < 0 || u > 1 || v < 0 || v > 1) return;

    const px = Math.floor(u * MAP_SIZE);
    const py = Math.floor(v * MAP_SIZE);
    
    // Scale brush size
    const brushPx = (brushSize / WORLD_WIDTH) * MAP_SIZE;

    ctx.fillStyle = COLORS[selectedSurface];
    ctx.beginPath();
    ctx.arc(px, py, brushPx, 0, Math.PI * 2);
    ctx.fill();

    textureRef.current.needsUpdate = true;
  };

  useFrame(() => {
    if (!surfaceEditorOpen || !isPainting) return;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Find ground intersection (usually the mesh named 'Terrain' or just lowest plane)
    // We'll intersect a virtual plane at Y=0 for stability
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    
    if (target) {
      paint(target);
    }
  });

  if (!surfaceEditorOpen) return null;

  return (
    <>
      {/* Editor UI Overlay */}
      <group>
        {/* Paintable Surface Overlay - Slightly above ground to see it */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0.5, WORLD_OFFSET_Z - 50]} // Center of our mapped area
          onPointerDown={() => setIsPainting(true)}
          onPointerUp={() => setIsPainting(false)}
          onPointerLeave={() => setIsPainting(false)}
        >
          <planeGeometry args={[WORLD_WIDTH, WORLD_DEPTH]} />
          <meshBasicMaterial 
            transparent={true} 
            opacity={0.6} 
            map={textureRef.current} 
            alphaMap={textureRef.current} // Use color as alpha proxy? No, just semi-transparent
          />
        </mesh>
      </group>

      {/* HTML UI for Tool Selection */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1a1a1a',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #fff',
        display: 'flex',
        gap: '10px',
        zIndex: 20000,
        pointerEvents: 'auto'
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
              textShadow: '0 1px 2px black'
            }}
          >
            {type}
          </button>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '10px' }}>
          <label style={{color: 'white', fontSize: '10px'}}>Brush Size</label>
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={brushSize} 
            onChange={(e) => setBrushSize(Number(e.target.value))} 
          />
        </div>
        <button
          onClick={() => {
             // Save logic (download image)
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
            cursor: 'pointer'
          }}
        >
          Save Map
        </button>
      </div>
    </>
  );
}
