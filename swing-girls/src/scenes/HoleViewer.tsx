import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useTexture, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

function TerrainRenderer({ mode, heightMap, detailMap }: { mode: string, heightMap: THREE.Texture, detailMap: THREE.Texture }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Geometry: 300x400 size, 512 segs for detail
  const geometry = useMemo(() => new THREE.PlaneGeometry(300, 400, 512, 512), []);

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

  switch (mode) {
    case 'Standard':
      return <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}><meshStandardMaterial {...commonProps} map={detailMap} color="white" /></mesh>;
    case 'Wireframe':
      return <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}><meshBasicMaterial {...commonProps} color="#0f0" wireframe /></mesh>;
    case 'Normal':
      return <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}><meshNormalMaterial {...commonProps} /></mesh>;
    case 'Distort':
      return <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}><MeshDistortMaterial {...commonProps} color="#00ff00" speed={2} distort={0.4} /></mesh>;
    case 'Wobble':
      return <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}><MeshWobbleMaterial {...commonProps} color="#ff0000" factor={1} speed={1} /></mesh>;
    
    // CUSTOM SHADERS
    case 'Topo':
      return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            vertexShader={`
              varying float vH;
              uniform sampler2D uHeightMap;
              void main() {
                vec4 hData = texture2D(uHeightMap, uv);
                vH = hData.r;
                vec3 pos = position + normal * vH * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying float vH;
              void main() {
                float lines = step(0.95, fract(vH * 30.0));
                gl_FragColor = vec4(mix(vec3(0.0), vec3(1.0), lines), 1.0);
              }
            `}
          />
        </mesh>
      );

    case 'Plasma':
      return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            vertexShader={`
              varying vec2 vUv;
              varying float vH;
              uniform sampler2D uHeightMap;
              void main() {
                vUv = uv;
                vec4 hData = texture2D(uHeightMap, uv);
                vH = hData.r;
                vec3 pos = position + normal * vH * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              varying float vH;
              uniform float uTime;
              void main() {
                vec3 color = 0.5 + 0.5 * cos(uTime + vUv.xyx + vec3(0, 2, 4));
                color *= vH;
                gl_FragColor = vec4(color, 1.0);
              }
            `}
          />
        </mesh>
      );
      
    case 'Cyber Grid':
      return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            transparent
            vertexShader={`
              varying vec2 vUv;
              varying float vH;
              uniform sampler2D uHeightMap;
              void main() {
                vUv = uv;
                vec4 hData = texture2D(uHeightMap, uv);
                vH = hData.r;
                vec3 pos = position + normal * vH * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              uniform float uTime;
              void main() {
                float grid = step(0.98, fract(vUv.x * 50.0)) + step(0.98, fract(vUv.y * 50.0));
                float sweep = step(0.95, fract(vUv.y - uTime * 0.2));
                vec3 color = vec3(0.0, 1.0, 1.0) * grid + vec3(1.0, 0.0, 1.0) * sweep;
                gl_FragColor = vec4(color, max(grid, sweep));
              }
            `}
          />
        </mesh>
      );

    case 'Points':
       return (
        <points rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <planeGeometry args={[300, 400, 200, 200]} />
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            vertexShader={`
              uniform sampler2D uHeightMap;
              varying float vH;
              void main() {
                vec4 hData = texture2D(uHeightMap, uv);
                vH = hData.r;
                vec3 pos = position + normal * vH * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = 3.0;
              }
            `}
            fragmentShader={`
              varying float vH;
              void main() {
                gl_FragColor = vec4(vH, 0.5, 1.0-vH, 1.0);
              }
            `}
          />
        </points>
      );

    case 'Glitch':
       return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            vertexShader={`
              uniform sampler2D uHeightMap;
              uniform float uTime;
              varying vec2 vUv;
              
              float random (vec2 st) {
                  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
              }

              void main() {
                vUv = uv;
                vec4 hData = texture2D(uHeightMap, uv);
                float h = hData.r;
                
                // Glitch displacement
                float noise = random(vec2(uTime * 10.0, uv.y));
                if (noise > 0.95) {
                   h += random(uv) * 10.0;
                }
                
                vec3 pos = position + normal * h * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              void main() {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
              }
            `}
            wireframe
          />
        </mesh>
      );

    case 'Rain':
        return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            vertexShader={`
              varying vec2 vUv;
              uniform sampler2D uHeightMap;
              void main() {
                vUv = uv;
                vec4 hData = texture2D(uHeightMap, uv);
                vec3 pos = position + normal * hData.r * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              uniform float uTime;
              
              float random (vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123); }

              void main() {
                vec2 st = vUv * vec2(50.0, 100.0); // Columns, Rows
                vec2 ipos = floor(st);
                float speed = random(vec2(ipos.x, 0.0));
                float y = fract(st.y + uTime * speed + random(vec2(ipos.x, 1.0)));
                float trail = smoothstep(0.0, 1.0, y);
                
                vec3 color = vec3(0.0, 1.0, 0.5) * trail;
                if (y > 0.98) color = vec3(0.8, 1.0, 0.8);
                
                gl_FragColor = vec4(color, 1.0);
              }
            `}
          />
        </mesh>
      );

     case 'Thermal':
        return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
            }}
            vertexShader={`
              varying float vH;
              uniform sampler2D uHeightMap;
              void main() {
                vec4 hData = texture2D(uHeightMap, uv);
                vH = hData.r;
                vec3 pos = position + normal * vH * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying float vH;
              void main() {
                // Simple heatmap: Blue -> Green -> Red
                vec3 color;
                if (vH < 0.5) {
                   color = mix(vec3(0,0,1), vec3(0,1,0), vH * 2.0);
                } else {
                   color = mix(vec3(0,1,0), vec3(1,0,0), (vH - 0.5) * 2.0);
                }
                gl_FragColor = vec4(color, 1.0);
              }
            `}
          />
        </mesh>
      );

     case 'X-Ray':
        return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            transparent
            vertexShader={`
              varying vec3 vNormal;
              varying vec3 vViewPosition;
              uniform sampler2D uHeightMap;
              void main() {
                vec4 hData = texture2D(uHeightMap, uv);
                vec3 pos = position + normal * hData.r * 50.0;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                vViewPosition = -mvPosition.xyz;
                vNormal = normalMatrix * normal;
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              varying vec3 vNormal;
              varying vec3 vViewPosition;
              void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                float dotProduct = dot(normal, viewDir);
                float rim = 1.0 - abs(dotProduct);
                rim = pow(rim, 4.0); // Sharpen rim
                gl_FragColor = vec4(0.0, 0.5, 1.0, rim);
              }
            `}
          />
        </mesh>
      );
      
      case 'Minecraft':
          return (
          <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
            <shaderMaterial
              ref={materialRef}
              uniforms={{
                uHeightMap: { value: heightMap },
              }}
              vertexShader={`
                varying float vH;
                uniform sampler2D uHeightMap;
                void main() {
                  vec4 hData = texture2D(uHeightMap, uv);
                  // Snap height to steps
                  float steps = 20.0;
                  vH = floor(hData.r * steps) / steps;
                  vec3 pos = position + normal * vH * 50.0;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
              `}
              fragmentShader={`
                varying float vH;
                void main() {
                  // Banded color
                  float steps = 10.0;
                  float band = floor(vH * steps) / steps;
                  gl_FragColor = vec4(band, band * 0.8, 0.2, 1.0);
                }
              `}
            />
          </mesh>
        );
        
    case 'Liquid Metal':
      return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            vertexShader={`
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vViewPosition;
              uniform sampler2D uHeightMap;
              uniform float uTime;
              void main() {
                vUv = uv;
                vec4 hData = texture2D(uHeightMap, uv);
                
                // Add ripple
                float ripple = sin(length(uv - 0.5) * 50.0 - uTime * 2.0) * 0.5;
                float h = hData.r * 50.0 + ripple;
                
                vec3 pos = position + normal * h;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                vViewPosition = -mvPosition.xyz;
                vNormal = normalMatrix * normal;
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              varying vec3 vNormal;
              varying vec3 vViewPosition;
              void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                // Fake reflection
                vec3 ref = reflect(-viewDir, normal);
                float spec = pow(max(dot(ref, vec3(0,1,0)), 0.0), 30.0);
                
                vec3 chrome = vec3(0.8, 0.9, 1.0) * (0.5 + 0.5 * ref.y);
                gl_FragColor = vec4(chrome + spec, 1.0);
              }
            `}
          />
        </mesh>
      );

    case 'Sonar':
      return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            transparent
            vertexShader={`
              varying vec2 vUv;
              varying float vH;
              uniform sampler2D uHeightMap;
              void main() {
                vUv = uv;
                vec4 hData = texture2D(uHeightMap, uv);
                vH = hData.r;
                vec3 pos = position + normal * vH * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              varying float vH;
              uniform float uTime;
              void main() {
                // Circular pulse from center
                float dist = length(vUv - 0.5);
                float pulse = fract(dist * 5.0 - uTime * 0.5);
                float ring = smoothstep(0.9, 0.95, pulse);
                
                // Grid overlay
                float grid = step(0.98, fract(vUv.x * 50.0)) + step(0.98, fract(vUv.y * 50.0));
                
                vec3 color = vec3(0.0, 1.0, 0.2); // Radar Green
                float alpha = (ring + grid * 0.2) * (1.0 - dist); // Fade at edges
                
                gl_FragColor = vec4(color, alpha);
              }
            `}
          />
        </mesh>
      );
      
    case 'Neon City':
      return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            vertexShader={`
              varying vec2 vUv;
              varying float vH;
              uniform sampler2D uHeightMap;
              void main() {
                vUv = uv;
                vec4 hData = texture2D(uHeightMap, uv);
                // Step height to create buildings
                float steps = 50.0; // Building grid resolution
                vec2 gridUV = floor(uv * steps) / steps;
                float h = texture2D(uHeightMap, gridUV).r;
                
                // Extrude only high areas
                if(h < 0.2) h = 0.0;
                else h = h * 1.5; // Taller buildings
                
                vH = h;
                vec3 pos = position + normal * h * 50.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              varying float vH;
              uniform float uTime;
              void main() {
                // Windows pattern
                float windows = step(0.7, fract(vUv.y * 200.0)) * step(0.7, fract(vUv.x * 200.0));
                // Neon glow at base
                vec3 baseColor = vec3(0.5, 0.0, 0.5);
                vec3 topColor = vec3(0.0, 0.5, 1.0);
                
                vec3 color = mix(baseColor, topColor, vH);
                if (vH > 0.01 && windows > 0.5) color += vec3(1.0, 1.0, 0.8); // Lit windows
                
                gl_FragColor = vec4(color, 1.0);
              }
            `}
          />
        </mesh>
      );
      
    case 'Paper':
      return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
            }}
            vertexShader={`
              varying vec3 vPos;
              uniform sampler2D uHeightMap;
              void main() {
                vec4 hData = texture2D(uHeightMap, uv);
                vec3 pos = position + normal * hData.r * 50.0;
                vPos = pos;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `}
            fragmentShader={`
              varying vec3 vPos;
              void main() {
                // Calculate facet normal using derivatives
                vec3 dx = dFdx(vPos);
                vec3 dy = dFdy(vPos);
                vec3 N = normalize(cross(dx, dy));
                
                // Simple lighting
                vec3 L = normalize(vec3(1.0, 1.0, 0.5));
                float diff = max(dot(N, L), 0.0);
                
                vec3 paperColor = vec3(0.95, 0.95, 0.9);
                gl_FragColor = vec4(paperColor * (0.5 + 0.5 * diff), 1.0);
              }
            `}
          />
        </mesh>
      );

    case 'ASCII':
      return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              uHeightMap: { value: heightMap },
              uTime: { value: 0 }
            }}
            vertexShader={`
              varying vec2 vUv;
              varying float vH;
              uniform sampler2D uHeightMap;
              void main() {
                vUv = uv;
                vH = texture2D(uHeightMap, uv).r;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              varying float vH;
              void main() {
                // Pixelate UVs
                float pixels = 80.0;
                vec2 pUv = floor(vUv * pixels) / pixels;
                float val = texture2D(uHeightMap, pUv).r;
                
                // Simulate characters (circles/dots of different sizes)
                vec2 cell = fract(vUv * pixels); // 0-1 within cell
                float dist = length(cell - 0.5);
                float char = step(dist, val * 0.4); // Radius depends on height
                
                gl_FragColor = vec4(vec3(0.0, 1.0, 0.0) * char, 1.0);
              }
            `}
          />
        </mesh>
      );

    default:
      return null;
  }
}

// === MAIN VIEWER ===

export function HoleViewer() {
  const [mode, setMode] = useState('Standard');
  
  const [heightMap, detailMap] = useLoader(THREE.TextureLoader, [
    '/hole1/hole1_height.png',
    '/hole1/hole1_detail.png'
  ]);

  const modes = [
    'Standard', 'Wireframe', 'Normal', 'Distort', 'Wobble', 
    'Topo', 'Plasma', 'Cyber Grid', 'Points', 'Glitch', 
    'Rain', 'Thermal', 'X-Ray', 'Minecraft',
    'Liquid Metal', 'Sonar', 'Neon City', 'Paper', 'ASCII'
  ];

  return (
    <div className="w-full h-full bg-black relative">
      <Canvas camera={{ position: [0, 100, 100], fov: 60 }}>
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        <pointLight position={[-10, 10, -10]} color="blue" intensity={2} />
        
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
