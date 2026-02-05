import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useTexture, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

// === SHADER FRAGMENTS ===

// Helper to detect edges in texture (Surface Borders)
const edgeDetection = `
  float edgeFactor() {
    vec2 size = vec2(512.0, 512.0); // Texture size
    vec4 c = texture2D(uDetailMap, vUv);
    vec4 n = texture2D(uDetailMap, vUv + vec2(0.0, 1.0)/size);
    vec4 e = texture2D(uDetailMap, vUv + vec2(1.0, 0.0)/size);
    vec4 s = texture2D(uDetailMap, vUv + vec2(0.0, -1.0)/size);
    vec4 w = texture2D(uDetailMap, vUv + vec2(-1.0, 0.0)/size);
    
    // Check difference in color
    float diff = length(c - n) + length(c - e) + length(c - s) + length(c - w);
    return smoothstep(0.0, 0.1, diff);
  }
`;

function TerrainRenderer({ mode, heightMap, detailMap }: { mode: string, heightMap: THREE.Texture, detailMap: THREE.Texture }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Geometry: High resolution for vertex displacement
  const geometry = useMemo(() => new THREE.PlaneGeometry(300, 400, 512, 512), []);
  // Point Geometry: Much higher density
  const pointGeometry = useMemo(() => new THREE.PlaneGeometry(300, 400, 512, 512), []);

  useFrame((state) => {
    if (materialRef.current) {
      if (materialRef.current.uniforms.uTime) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
  });

  const commonProps = {
    displacementMap: heightMap,
    displacementScale: 50,
  };

  const uniforms = {
    uHeightMap: { value: heightMap },
    uDetailMap: { value: detailMap },
    uTime: { value: 0 }
  };

  // === POINTS VARIANTS ===
  if (mode.startsWith('Points')) {
    let vert = `
      uniform sampler2D uHeightMap;
      uniform sampler2D uDetailMap;
      uniform float uTime;
      varying float vH;
      varying vec2 vUv;
      varying vec4 vSurface;
      
      void main() {
        vUv = uv;
        vec4 hData = texture2D(uHeightMap, uv);
        vSurface = texture2D(uDetailMap, uv);
        vH = hData.r;
        vec3 pos = position + normal * vH * 50.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 2.0;
      }
    `;
    let frag = `
      varying float vH;
      varying vec2 vUv;
      varying vec4 vSurface;
      uniform sampler2D uDetailMap;
      uniform float uTime;
      ${edgeDetection}

      void main() {
        gl_FragColor = vec4(1.0);
      }
    `;

    // Modify shaders based on specific Points variant
    switch (mode) {
      case 'Points Base':
        frag = `
          varying float vH;
          void main() {
            gl_FragColor = vec4(vH, 0.5, 1.0-vH, 1.0);
          }
        `;
        break;
      case 'Points Border': // Black line border
        frag = `
          varying float vH;
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor();
            vec3 color = vec3(vH, 0.6, 1.0-vH); // Base gradient
            if (edge > 0.5) color = vec3(0.0); // Black border
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'Points Surface Color':
        frag = `
          varying vec4 vSurface;
          void main() {
            gl_FragColor = vec4(vSurface.rgb, 1.0);
          }
        `;
        break;
      case 'Points Neon Borders':
        frag = `
          varying vec2 vUv;
          varying vec4 vSurface;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor();
            vec3 base = vSurface.rgb * 0.2; // Dim base
            vec3 border = vec3(0.0, 1.0, 1.0); // Cyan border
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
            vec4 hData = texture2D(uHeightMap, uv);
            vH = hData.r;
            vec3 pos = position + normal * vH * 50.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            
            // Size based on height (larger at peaks)
            float dist = length(gl_Position.xyz);
            gl_PointSize = (100.0 / dist) * (1.0 + vH * 5.0);
          }
        `;
        frag = `
          varying float vH;
          void main() {
            if (length(gl_PointCoord - 0.5) > 0.5) discard; // Circle points
            gl_FragColor = vec4(vH, vH, vH, 1.0);
          }
        `;
        break;
       case 'Points Subdivide': // Fake subdivision by discarding non-border points
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor();
            // Discard points not near edge
            if (edge < 0.2 && mod(gl_FragCoord.x, 2.0) > 0.5) discard; 
            
            vec3 color = vec3(0.5);
            if (edge > 0.2) color = vec3(1.0, 0.0, 0.0); // Red dense border
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
       case 'Points Rain':
         vert = `
          uniform sampler2D uHeightMap;
          uniform float uTime;
          varying float vH;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 hData = texture2D(uHeightMap, uv);
            vH = hData.r;
            
            // Rain drop effect
            float drop = fract(uv.y * 20.0 + uTime * 0.5);
            float h = vH * 50.0;
            
            // Lift points slightly
            vec3 pos = position + normal * (h + drop * 2.0);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = 2.0;
          }
         `;
         frag = `
           void main() { gl_FragColor = vec4(0.5, 0.8, 1.0, 1.0); }
         `;
         break;
       case 'Points Scan':
         frag = `
          varying float vH;
          varying vec2 vUv;
          uniform float uTime;
          void main() {
             float scan = abs(sin(vUv.y * 10.0 - uTime));
             float val = step(0.9, scan);
             if (val < 0.1) discard;
             gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
          }
         `;
         break;
        case 'Points Glitch':
          vert = `
            uniform sampler2D uHeightMap;
            uniform float uTime;
            varying float vH;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vec4 hData = texture2D(uHeightMap, uv);
              vH = hData.r;
              
              vec3 pos = position;
              pos += normal * vH * 50.0;
              
              // Jitter x/z based on time
              float jitter = sin(uTime * 50.0 + position.y) * 0.5;
              if (vH > 0.8) pos.x += jitter;
              
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
      <points rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
        <bufferGeometry attach="geometry" {...pointGeometry} />
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
  // Using ShaderMaterial to mimic Standard but add custom effects
  
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
      varying float vH;
      uniform sampler2D uDetailMap;
      uniform float uTime;
      ${edgeDetection}

      void main() {
        vec4 surface = texture2D(uDetailMap, vUv);
        gl_FragColor = surface;
      }
    `;

    switch (mode) {
      case 'Standard Base':
        // Default (already set above)
        break;
      case 'Standard Border':
        frag = `
          varying vec2 vUv;
          varying float vH;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            vec4 surface = texture2D(uDetailMap, vUv);
            float edge = edgeFactor();
            vec3 color = surface.rgb;
            if (edge > 0.3) color = vec3(0.0); // Thick black border
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'Standard Cell':
        frag = `
          varying vec2 vUv;
          varying float vH;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            vec4 surface = texture2D(uDetailMap, vUv);
            // Quantize colors
            vec3 color = floor(surface.rgb * 4.0) / 4.0;
            float edge = edgeFactor();
            if (edge > 0.5) color *= 0.5; // Darken edges
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'Standard Wire Border':
        // Draws wireframe ONLY at borders
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor();
            if (edge < 0.2) discard; // Transparent except borders
            gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // Yellow wire borders
          }
        `;
        break;
      case 'Standard Glass':
        // Opaque borders, glass elsewhere
        frag = `
          varying vec2 vUv;
          uniform sampler2D uDetailMap;
          ${edgeDetection}
          void main() {
            float edge = edgeFactor();
            vec4 surface = texture2D(uDetailMap, vUv);
            float alpha = 0.3;
            if (edge > 0.4) alpha = 1.0;
            gl_FragColor = vec4(surface.rgb, alpha);
          }
        `;
        // Needs transparent prop
        break;
      case 'Standard Topo':
        frag = `
          varying vec2 vUv;
          varying float vH;
          uniform sampler2D uDetailMap;
          void main() {
            vec4 surface = texture2D(uDetailMap, vUv);
            float topo = step(0.9, fract(vH * 20.0));
            vec3 color = mix(surface.rgb, vec3(1.0), topo);
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'Standard Grid':
        frag = `
          varying vec2 vUv;
          varying float vH;
          uniform sampler2D uDetailMap;
          void main() {
            vec4 surface = texture2D(uDetailMap, vUv);
            float grid = step(0.98, fract(vUv.x * 20.0)) + step(0.98, fract(vUv.y * 20.0));
            vec3 color = mix(surface.rgb, vec3(0.0), clamp(grid, 0.0, 1.0));
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'Standard Patchwork':
         // Overlay a fabric pattern
         frag = `
           varying vec2 vUv;
           uniform sampler2D uDetailMap;
           void main() {
             vec4 surface = texture2D(uDetailMap, vUv);
             float pattern = sin((vUv.x + vUv.y) * 200.0);
             vec3 color = surface.rgb * (0.9 + 0.1 * pattern);
             gl_FragColor = vec4(color, 1.0);
           }
         `;
         break;
       case 'Standard Lidar':
         frag = `
           varying vec2 vUv;
           uniform sampler2D uDetailMap;
           ${edgeDetection}
           void main() {
             float edge = edgeFactor();
             vec3 color = vec3(0.0, 0.0, 0.1); // Dark bg
             if (edge > 0.2) color = vec3(0.0, 1.0, 0.5); // Lidar edge
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
    'Standard Glass', 'Standard Topo', 'Standard Grid', 'Standard Patchwork', 'Standard Lidar'
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
