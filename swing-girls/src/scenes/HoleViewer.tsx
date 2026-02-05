import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// === SHADER FRAGMENTS ===

// Robust edge detection with adjustable threshold
const edgeDetection = `
  float edgeFactor(float threshold) {
    vec2 size = vec2(512.0, 512.0);
    vec4 c = texture2D(uDetailMap, vUv);
    vec4 n = texture2D(uDetailMap, vUv + vec2(0.0, 1.0)/size);
    vec4 e = texture2D(uDetailMap, vUv + vec2(1.0, 0.0)/size);
    
    float diff = length(c - n) + length(c - e);
    return smoothstep(threshold, threshold + 0.1, diff);
  }
`;

function TerrainRenderer({ mode, heightMap, detailMap }: { mode: string, heightMap: THREE.Texture, detailMap: THREE.Texture }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Geometry: High resolution
  const geometry = useMemo(() => new THREE.PlaneGeometry(300, 400, 512, 512), []);

  useFrame((state) => {
    if (materialRef.current) {
      if (materialRef.current.uniforms.uTime) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
  });

  const uniforms = useMemo(() => ({
    uHeightMap: { value: heightMap },
    uDetailMap: { value: detailMap },
    uTime: { value: 0 }
  }), [heightMap, detailMap]);

  // === POINTS VARIANTS ===
  if (mode.startsWith('Points')) {
    let vert = `
      uniform sampler2D uHeightMap;
      varying float vH;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        float h = texture2D(uHeightMap, uv).r;
        vH = h;
        vec3 pos = position + normal * h * 50.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 2.0;
      }
    `;
    let frag = `
      varying float vH;
      varying vec2 vUv;
      uniform sampler2D uDetailMap;
      void main() {
        gl_FragColor = vec4(1.0);
      }
    `;

    switch (mode) {
      case 'Points Base':
        frag = `
          varying float vH;
          void main() {
            gl_FragColor = vec4(vH, 0.5, 1.0-vH, 1.0);
          }
        `;
        break;
      case 'Points Border':
        frag = `
          varying float vH;
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor(0.1);
            vec3 color = vec3(vH, 0.6, 1.0-vH);
            if (edge > 0.5) color = vec3(0.0); // Black border
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'Points Surface Color':
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          void main() {
            vec4 surface = texture2D(uDetailMap, vUv);
            gl_FragColor = vec4(surface.rgb, 1.0);
          }
        `;
        break;
      case 'Points Neon Borders':
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor(0.15);
            vec4 surface = texture2D(uDetailMap, vUv);
            vec3 base = surface.rgb * 0.2; 
            vec3 border = vec3(0.0, 1.0, 1.0);
            gl_FragColor = vec4(mix(base, border, edge), 1.0);
          }
        `;
        break;
      case 'Points Height Size':
        vert = `
          uniform sampler2D uHeightMap;
          varying float vH;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            float h = texture2D(uHeightMap, uv).r;
            vH = h;
            vec3 pos = position + normal * h * 50.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            
            float dist = gl_Position.w;
            gl_PointSize = (300.0 / dist) * (0.5 + h * 2.0);
          }
        `;
        frag = `
          varying float vH;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            if (dot(c, c) > 0.25) discard;
            gl_FragColor = vec4(vH, vH, vH, 1.0);
          }
        `;
        break;
       case 'Points Subdivide': 
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor(0.1);
            // If not edge, discard 75% of points for "low density" look
            if (edge < 0.2) {
               if (mod(gl_FragCoord.x + gl_FragCoord.y, 4.0) > 0.5) discard;
            }
            vec3 color = vec3(0.5);
            if (edge > 0.2) color = vec3(1.0, 0.0, 0.0); // Solid red border
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
       case 'Points Rain':
         vert = `
          uniform sampler2D uHeightMap;
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            float h = texture2D(uHeightMap, uv).r * 50.0;
            
            // Rain effect
            float drop = fract(uv.y * 20.0 + uTime * 0.5);
            vec3 pos = position + normal * (h + drop * 5.0);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = 2.0;
          }
         `;
         frag = `
           void main() { gl_FragColor = vec4(0.5, 0.8, 1.0, 0.8); }
         `;
         break;
       case 'Points Scan':
         frag = `
          varying vec2 vUv;
          uniform float uTime;
          void main() {
             float scan = abs(sin(vUv.y * 10.0 - uTime));
             if (scan < 0.9) discard;
             gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
          }
         `;
         break;
        case 'Points Glitch':
          vert = `
            uniform sampler2D uHeightMap;
            uniform float uTime;
            varying float vH;
            void main() {
              float h = texture2D(uHeightMap, uv).r;
              vH = h;
              vec3 pos = position + normal * h * 50.0;
              
              float jitter = sin(uTime * 20.0 + pos.y) * 2.0;
              if (h > 0.5) pos.x += jitter;
              
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = 3.0;
            }
          `;
          frag = `
            void main() { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); }
          `;
          break;
    }

    return (
      <points rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
        />
      </points>
    );
  }

  // === STANDARD VARIANTS ===
  
  if (mode.startsWith('Standard')) {
    let vert = `
      varying vec2 vUv;
      varying float vH;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform sampler2D uHeightMap;
      
      void main() {
        vUv = uv;
        vec4 hData = texture2D(uHeightMap, uv);
        vH = hData.r;
        
        vec3 pos = position + normal * vH * 50.0;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormal = normalMatrix * normal;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    let frag = `
      varying vec2 vUv;
      uniform sampler2D uDetailMap;
      void main() {
        gl_FragColor = texture2D(uDetailMap, vUv);
      }
    `;

    switch (mode) {
      case 'Standard Base':
        break;
      case 'Standard Border':
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            vec4 surface = texture2D(uDetailMap, vUv);
            float edge = edgeFactor(0.1);
            vec3 color = surface.rgb;
            if (edge > 0.5) color = vec3(0.0); // Thick black border
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'Standard Cell':
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            vec3 color = texture2D(uDetailMap, vUv).rgb;
            // Quantize
            color = floor(color * 4.0) / 4.0;
            float edge = edgeFactor(0.2);
            if (edge > 0.5) color *= 0.5;
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'Standard Wire Border':
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor(0.15);
            if (edge < 0.5) discard;
            gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
          }
        `;
        break;
      case 'Standard Glass':
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor(0.2);
            vec3 color = texture2D(uDetailMap, vUv).rgb;
            float alpha = 0.3;
            if (edge > 0.5) { alpha = 1.0; color = vec3(1.0); }
            gl_FragColor = vec4(color, alpha);
          }
        `;
        break;
      case 'Standard Topo':
        frag = `
          varying vec2 vUv;
          varying float vH;
          uniform sampler2D uDetailMap;
          void main() {
            vec3 color = texture2D(uDetailMap, vUv).rgb;
            float topo = step(0.9, fract(vH * 30.0));
            gl_FragColor = vec4(mix(color, vec3(1.0), topo), 1.0);
          }
        `;
        break;
      case 'Standard Grid':
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          void main() {
            vec3 color = texture2D(uDetailMap, vUv).rgb;
            float grid = step(0.98, fract(vUv.x * 20.0)) + step(0.98, fract(vUv.y * 20.0));
            gl_FragColor = vec4(mix(color, vec3(0.0), clamp(grid, 0.0, 1.0)), 1.0);
          }
        `;
        break;
       case 'Standard Lidar':
         frag = `
           varying vec2 vUv;
           uniform sampler2D uDetailMap;
           ${edgeDetection}
           void main() {
             float edge = edgeFactor(0.1);
             vec3 color = vec3(0.0, 0.0, 0.1);
             if (edge > 0.3) color = vec3(0.0, 1.0, 0.0);
             gl_FragColor = vec4(color, 1.0);
           }
         `;
         break;
    }

    return (
      <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
          transparent={mode === 'Standard Glass' || mode === 'Standard Wire Border'}
        />
      </mesh>
    );
  }

  return null;
}

// === MAIN VIEWER ===

export function HoleViewer() {
  const [mode, setMode] = useState('Points Base');
  
  const [heightMap, detailMap] = useLoader(THREE.TextureLoader, [
    '/hole1/hole1_height.png',
    '/hole1/hole1_detail.png'
  ]);

  const modes = [
    'Points Base', 'Points Border', 'Points Surface Color', 'Points Neon Borders', 
    'Points Height Size', 'Points Subdivide', 'Points Rain', 'Points Scan', 'Points Glitch',
    'Standard Base', 'Standard Border', 'Standard Cell', 'Standard Wire Border',
    'Standard Glass', 'Standard Topo', 'Standard Grid', 'Standard Lidar'
  ];

  return (
    <div className="w-full h-full bg-black relative">
      <Canvas camera={{ position: [0, 100, 100], fov: 60 }}>
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        
        <TerrainRenderer mode={mode} heightMap={heightMap} detailMap={detailMap} />
      </Canvas>

      {/* UI */}
      <div className="absolute top-4 right-4 bg-white/10 p-4 rounded backdrop-blur text-white max-h-[90vh] overflow-y-auto w-48 z-50">
        <h2 className="font-bold mb-4 border-b border-white/20 pb-2 text-center">STYLE SELECTOR</h2>
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
