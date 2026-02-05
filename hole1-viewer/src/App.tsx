import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

// === SHADER FRAGMENTS ===

const diffuseLighting = `
  float getDiffuse(vec3 normal) {
    vec3 lightDir = normalize(vec3(1.0, 2.0, 1.0));
    return max(dot(normal, lightDir), 0.0);
  }
`;

const edgeFragment = `
  float getEdge(vec2 uv) {
    vec2 size = vec2(512.0);
    vec4 c = texture2D(uDetailMap, uv);
    vec4 n = texture2D(uDetailMap, uv + vec2(0.0, 1.0)/size);
    vec4 e = texture2D(uDetailMap, uv + vec2(1.0, 0.0)/size);
    return smoothstep(0.1, 0.2, length(c-n) + length(c-e));
  }
`;

function TerrainRenderer({ mode, heightMap, detailMap, heightScale }: { mode: string, heightMap: THREE.Texture, detailMap: THREE.Texture, heightScale: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Geometry: High resolution
  const geometry = useMemo(() => new THREE.PlaneGeometry(300, 400, 512, 512), []);

  useFrame((state) => {
    if (materialRef.current) {
      if (materialRef.current.uniforms.uTime) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      }
      if (materialRef.current.uniforms.uHeightScale) {
        materialRef.current.uniforms.uHeightScale.value = heightScale;
      }
    }
  });

  const uniforms = useMemo(() => ({
    uHeightMap: { value: heightMap },
    uDetailMap: { value: detailMap },
    uHeightScale: { value: heightScale },
    uTime: { value: 0 }
  }), [heightMap, detailMap]);

  const baseVertex = `
    uniform sampler2D uHeightMap;
    uniform float uHeightScale;
    varying vec2 vUv;
    varying float vH;
    varying vec3 vViewPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      float h = texture2D(uHeightMap, uv).r;
      vH = h;
      
      float off = 1.0 / 512.0;
      float hL = texture2D(uHeightMap, uv + vec2(-off, 0)).r;
      float hR = texture2D(uHeightMap, uv + vec2(off, 0)).r;
      float hD = texture2D(uHeightMap, uv + vec2(0, -off)).r;
      float hU = texture2D(uHeightMap, uv + vec2(0, off)).r;
      
      float scale = uHeightScale;
      vec3 n = normalize(vec3(hL - hR, 2.0 / scale, hD - hU));
      vNormal = normalMatrix * n;

      vec3 pos = position + vec3(0, 0, h * scale);
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
      
      gl_PointSize = (300.0 / length(mvPosition.xyz));
    }
  `;

  if (mode === 'Points Colored') {
    return (
      <points rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={baseVertex}
          fragmentShader={`
            uniform sampler2D uDetailMap;
            varying vec2 vUv;
            void main() {
              if (length(gl_PointCoord - 0.5) > 0.5) discard;
              vec3 color = texture2D(uDetailMap, vUv).rgb;
              gl_FragColor = vec4(color, 1.0);
            }
          `}
        />
      </points>
    );
  }

  if (mode === 'Standard Base') {
    return (
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={baseVertex}
          fragmentShader={`
            uniform sampler2D uDetailMap;
            varying vec2 vUv;
            ${diffuseLighting}
            varying vec3 vNormal;
            void main() {
              vec3 color = texture2D(uDetailMap, vUv).rgb;
              float light = getDiffuse(vNormal);
              gl_FragColor = vec4(color * (0.5 + 0.5 * light), 1.0);
            }
          `}
        />
      </mesh>
    );
  }

  if (mode === 'Toon Shaded') {
    return (
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={baseVertex}
          fragmentShader={`
            uniform sampler2D uDetailMap;
            varying vec2 vUv;
            varying vec3 vNormal;
            ${diffuseLighting}
            void main() {
              vec3 color = texture2D(uDetailMap, vUv).rgb;
              float light = getDiffuse(vNormal);
              float cuts = 3.0;
              light = floor(light * cuts) / cuts;
              gl_FragColor = vec4(color * (0.6 + 0.4 * light), 1.0);
            }
          `}
        />
      </mesh>
    );
  }

  if (mode === 'Anime Outline') {
    return (
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={baseVertex}
          fragmentShader={`
            uniform sampler2D uDetailMap;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            ${diffuseLighting}
            ${edgeFragment}
            
            void main() {
              vec3 color = texture2D(uDetailMap, vUv).rgb;
              float light = getDiffuse(vNormal);
              light = smoothstep(0.4, 0.5, light) * 0.5 + 0.5;
              float edge = getEdge(vUv);
              vec3 viewDir = normalize(vViewPosition);
              float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
              rim = smoothstep(0.6, 1.0, rim);
              
              vec3 finalColor = color * light;
              if (rim > 0.8) finalColor += vec3(0.2);
              if (edge > 0.5) finalColor = vec3(0.0);
              
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `}
        />
      </mesh>
    );
  }

  if (mode === 'Comic Halftone') {
    return (
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={baseVertex}
          fragmentShader={`
            uniform sampler2D uDetailMap;
            varying vec2 vUv;
            varying vec3 vNormal;
            ${diffuseLighting}
            
            void main() {
              vec3 color = texture2D(uDetailMap, vUv).rgb;
              float light = getDiffuse(vNormal);
              vec2 uv = gl_FragCoord.xy / 4.0;
              float dot = length(fract(uv) - 0.5) * 2.0;
              float radius = sqrt(1.0 - light);
              vec3 finalColor = color;
              if (dot < radius) finalColor *= 0.5;
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `}
        />
      </mesh>
    );
  }

  if (mode === 'Sketch') {
    return (
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={baseVertex}
          fragmentShader={`
            uniform sampler2D uDetailMap;
            varying vec2 vUv;
            varying vec3 vNormal;
            ${diffuseLighting}
            
            void main() {
              float light = getDiffuse(vNormal);
              vec3 color = texture2D(uDetailMap, vUv).rgb;
              float hatch = 1.0;
              if (light < 0.8) {
                  if (mod(gl_FragCoord.x + gl_FragCoord.y, 10.0) < 2.0) hatch = 0.0;
              }
              if (light < 0.4) {
                  if (mod(gl_FragCoord.x - gl_FragCoord.y, 10.0) < 2.0) hatch = 0.0;
              }
              vec3 paper = vec3(0.95, 0.95, 0.9);
              gl_FragColor = vec4(mix(vec3(0.0), color, hatch), 1.0);
            }
          `}
        />
      </mesh>
    );
  }

  return null;
}

function App() {
  const [mode, setMode] = useState('Standard Base');
  const [heightScale, setHeightScale] = useState(50);
  
  const [heightMap, detailMap] = useLoader(THREE.TextureLoader, [
    '/assets/hole1_height.png',
    '/assets/hole1_detail.png'
  ]);

  const modes = [
    'Standard Base', 
    'Points Colored', 
    'Toon Shaded', 
    'Anime Outline', 
    'Comic Halftone', 
    'Sketch'
  ];

  return (
    <div className="w-full h-full bg-black relative">
      <Canvas camera={{ position: [0, 100, 100], fov: 60 }}>
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 50, 10]} intensity={1.5} />
        
        <TerrainRenderer 
           mode={mode} 
           heightMap={heightMap} 
           detailMap={detailMap} 
           heightScale={heightScale} 
        />
      </Canvas>

      <div className="absolute top-4 right-4 bg-white/10 p-4 rounded backdrop-blur text-white max-h-[90vh] overflow-y-auto w-64 z-50">
        <h2 className="font-bold mb-4 border-b border-white/20 pb-2 text-center">STYLE SELECTOR</h2>
        
        <div className="mb-6">
          <label className="block text-xs uppercase text-gray-400 mb-1">Height Scale</label>
          <div className="flex gap-2 items-center">
            <input 
              type="range" 
              min="0" max="200" 
              value={heightScale} 
              onChange={(e) => setHeightScale(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm w-8">{heightScale}</span>
          </div>
        </div>

        <div className="space-y-1">
          {modes.map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                mode === m 
                  ? 'bg-blue-600 font-bold shadow-lg shadow-blue-500/30' 
                  : 'hover:bg-white/10 text-gray-300 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
