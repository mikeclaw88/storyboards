import { useState, useRef, useMemo, useCallback, useEffect, Fragment } from 'react';
import { Canvas, useFrame, useLoader, useThree, createPortal } from '@react-three/fiber';
import { OrbitControls, useFBO } from '@react-three/drei';
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

function TerrainRenderer({ mode, heightMap, detailMap, heightScale, pointRadius }: { mode: string, heightMap: THREE.Texture, detailMap: THREE.Texture, heightScale: number, pointRadius: number }) {
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
      if (materialRef.current.uniforms.uPointRadius) {
        materialRef.current.uniforms.uPointRadius.value = pointRadius;
      }
    }
  });

  const uniforms = useMemo(() => ({
    uHeightMap: { value: heightMap },
    uDetailMap: { value: detailMap },
    uHeightScale: { value: heightScale },
    uPointRadius: { value: pointRadius },
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

  const pointsVertex = `
    uniform sampler2D uHeightMap;
    uniform float uHeightScale;
    uniform float uPointRadius;
    varying vec2 vUv;
    varying float vH;
    varying vec3 vViewPosition;
    varying vec3 vNormal;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

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

      vec3 pos = position;

      // Hex offset: shift odd rows by half column spacing
      float colSpacing = 300.0 / 512.0;
      float rowSpacing = 400.0 / 512.0;
      float rowIndex = floor(uv.y * 512.0 + 0.5);
      if (mod(rowIndex, 2.0) > 0.5) {
        pos.x += colSpacing * 0.5;
      }

      // Small jitter to break residual hex pattern
      float jitterStrength = 0.25;
      pos.x += (hash21(uv * 512.0) - 0.5) * colSpacing * jitterStrength;
      pos.y += (hash21(uv * 512.0 + vec2(7.0, 13.0)) - 0.5) * rowSpacing * jitterStrength;

      // Apply height displacement
      pos.z += h * scale;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;

      gl_PointSize = (uPointRadius / length(mvPosition.xyz));
    }
  `;

  if (mode === 'Points Colored') {
    return (
      <points rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={pointsVertex}
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

// === COMPOSITING SYSTEM ===

type BlendMode = 'OFF' | 'ADD' | 'MULT';
type LayerConfig = { blend: BlendMode; weight: number };

const MODE_NAMES = [
  'Standard Base',
  'Points Colored',
  'Toon Shaded',
  'Anime Outline',
  'Comic Halftone',
  'Sketch',
] as const;

const defaultLayers: Record<string, LayerConfig> = {
  'Standard Base':  { blend: 'ADD', weight: 1.0 },
  'Points Colored': { blend: 'OFF', weight: 0.0 },
  'Toon Shaded':    { blend: 'OFF', weight: 0.0 },
  'Anime Outline':  { blend: 'OFF', weight: 0.0 },
  'Comic Halftone': { blend: 'OFF', weight: 0.0 },
  'Sketch':         { blend: 'OFF', weight: 0.0 },
};

// Compositing shader
const compositeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const compositeFragmentShader = `
  uniform sampler2D uLayer0;
  uniform sampler2D uLayer1;
  uniform sampler2D uLayer2;
  uniform sampler2D uLayer3;
  uniform sampler2D uLayer4;
  uniform sampler2D uLayer5;

  uniform sampler2D uSkyLayer;
  uniform float uSkyWeight;

  // blend: 0 = OFF, 1 = ADD, 2 = MULT
  uniform int uBlend0;
  uniform int uBlend1;
  uniform int uBlend2;
  uniform int uBlend3;
  uniform int uBlend4;
  uniform int uBlend5;

  uniform float uWeight0;
  uniform float uWeight1;
  uniform float uWeight2;
  uniform float uWeight3;
  uniform float uWeight4;
  uniform float uWeight5;

  varying vec2 vUv;

  void applyLayer(inout vec3 result, inout float alpha, sampler2D tex, int blend, float weight) {
    if (blend == 0) return;
    vec4 s = texture2D(tex, vUv);
    vec3 color = s.rgb;
    if (blend == 1) {
      result += color * weight;
    } else if (blend == 2) {
      result *= mix(vec3(1.0), color, weight);
    }
    alpha = max(alpha, s.a);
  }

  void main() {
    vec3 sky = texture2D(uSkyLayer, vUv).rgb * uSkyWeight;

    vec3 terrain = vec3(0.0);
    float terrainAlpha = 0.0;
    applyLayer(terrain, terrainAlpha, uLayer0, uBlend0, uWeight0);
    applyLayer(terrain, terrainAlpha, uLayer1, uBlend1, uWeight1);
    applyLayer(terrain, terrainAlpha, uLayer2, uBlend2, uWeight2);
    applyLayer(terrain, terrainAlpha, uLayer3, uBlend3, uWeight3);
    applyLayer(terrain, terrainAlpha, uLayer4, uBlend4, uWeight4);
    applyLayer(terrain, terrainAlpha, uLayer5, uBlend5, uWeight5);

    vec3 result = mix(sky, terrain, terrainAlpha);
    gl_FragColor = vec4(result, 1.0);
  }
`;

function blendToInt(b: BlendMode): number {
  if (b === 'ADD') return 1;
  if (b === 'MULT') return 2;
  return 0;
}

function CompositeRenderer({
  layers,
  heightMap,
  detailMap,
  heightScale,
  pointRadius,
  skyEnabled,
  skyWeight,
  skySource,
  skyBlurriness,
  skyIntensity,
  skyRotation,
}: {
  layers: Record<string, LayerConfig>;
  heightMap: THREE.Texture;
  detailMap: THREE.Texture;
  heightScale: number;
  pointRadius: number;
  skyEnabled: boolean;
  skyWeight: number;
  skySource: string;
  skyBlurriness: number;
  skyIntensity: number;
  skyRotation: number;
}) {
  const { gl, camera } = useThree();

  // Create 6 separate scenes
  const scenes = useMemo(() => MODE_NAMES.map(() => new THREE.Scene()), []);

  // Create 6 FBOs
  const fbo0 = useFBO({ depth: true });
  const fbo1 = useFBO({ depth: true });
  const fbo2 = useFBO({ depth: true });
  const fbo3 = useFBO({ depth: true });
  const fbo4 = useFBO({ depth: true });
  const fbo5 = useFBO({ depth: true });
  const fbos = useMemo(() => [fbo0, fbo1, fbo2, fbo3, fbo4, fbo5], [fbo0, fbo1, fbo2, fbo3, fbo4, fbo5]);

  // Sky FBO + scene
  const fboSky = useFBO();
  const skymapScene = useMemo(() => new THREE.Scene(), []);

  // Load cubemap as scene.background
  useEffect(() => {
    const loader = new THREE.CubeTextureLoader();
    loader.setPath(`/assets/${skySource}/`);
    loader.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'], (cubeTexture) => {
      skymapScene.background = cubeTexture;
    });
    return () => {
      if (skymapScene.background instanceof THREE.CubeTexture) {
        skymapScene.background.dispose();
      }
      skymapScene.background = null;
    };
  }, [skymapScene, skySource]);

  // Refs for sky props
  const skyEnabledRef = useRef(skyEnabled);
  skyEnabledRef.current = skyEnabled;
  const skyWeightRef = useRef(skyWeight);
  skyWeightRef.current = skyWeight;
  const skyBlurrinessRef = useRef(skyBlurriness);
  skyBlurrinessRef.current = skyBlurriness;
  const skyIntensityRef = useRef(skyIntensity);
  skyIntensityRef.current = skyIntensity;
  const skyRotationRef = useRef(skyRotation);
  skyRotationRef.current = skyRotation;

  // Orthographic camera for the compositing quad
  const orthoCamera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return cam;
  }, []);

  // Full-screen quad for compositing
  const quadGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  // Compositing material
  const compositeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uLayer0: { value: null },
        uLayer1: { value: null },
        uLayer2: { value: null },
        uLayer3: { value: null },
        uLayer4: { value: null },
        uLayer5: { value: null },
        uSkyLayer: { value: null },
        uSkyWeight: { value: 0 },
        uBlend0: { value: 0 },
        uBlend1: { value: 0 },
        uBlend2: { value: 0 },
        uBlend3: { value: 0 },
        uBlend4: { value: 0 },
        uBlend5: { value: 0 },
        uWeight0: { value: 0 },
        uWeight1: { value: 0 },
        uWeight2: { value: 0 },
        uWeight3: { value: 0 },
        uWeight4: { value: 0 },
        uWeight5: { value: 0 },
      },
      vertexShader: compositeVertexShader,
      fragmentShader: compositeFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  // Compositing scene
  const compositeScene = useMemo(() => {
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(quadGeometry, compositeMaterial);
    scene.add(mesh);
    return scene;
  }, [quadGeometry, compositeMaterial]);

  // Store layers ref for use in useFrame without causing re-renders
  const layersRef = useRef(layers);
  layersRef.current = layers;

  // Take over rendering
  useFrame(() => {
    const currentLayers = layersRef.current;

    // Render sky to its FBO
    gl.setRenderTarget(fboSky);
    gl.setClearColor(0x000000, 1);
    gl.clear();
    if (skyEnabledRef.current && skymapScene.background) {
      skymapScene.backgroundBlurriness = skyBlurrinessRef.current;
      skymapScene.backgroundIntensity = skyIntensityRef.current;
      skymapScene.backgroundRotation.set(0, skyRotationRef.current * Math.PI / 180, 0);
      gl.render(skymapScene, camera);
    }

    // Render each active layer to its FBO (alpha=0 clear so sky shows through gaps)
    MODE_NAMES.forEach((name, i) => {
      const cfg = currentLayers[name];
      if (cfg.blend !== 'OFF') {
        gl.setRenderTarget(fbos[i]);
        gl.setClearColor(0x000000, 0);
        gl.clear();
        gl.render(scenes[i], camera);
      }
    });

    // Update compositing uniforms
    compositeMaterial.uniforms.uSkyLayer.value = fboSky.texture;
    compositeMaterial.uniforms.uSkyWeight.value = skyEnabledRef.current ? skyWeightRef.current : 0;

    MODE_NAMES.forEach((name, i) => {
      const cfg = currentLayers[name];
      compositeMaterial.uniforms[`uLayer${i}` as keyof typeof compositeMaterial.uniforms].value = fbos[i].texture;
      compositeMaterial.uniforms[`uBlend${i}` as keyof typeof compositeMaterial.uniforms].value = blendToInt(cfg.blend);
      compositeMaterial.uniforms[`uWeight${i}` as keyof typeof compositeMaterial.uniforms].value = cfg.weight;
    });

    // Render composite to screen
    gl.setRenderTarget(null);
    gl.setClearColor(0x000000, 1);
    gl.clear();
    gl.render(compositeScene, orthoCamera);
  }, 1);

  return (
    <>
      {MODE_NAMES.map((name, i) => (
        <Fragment key={name}>
          {createPortal(
            <TerrainRenderer
              mode={name}
              heightMap={heightMap}
              detailMap={detailMap}
              heightScale={heightScale}
              pointRadius={pointRadius}
            />,
            scenes[i]
          )}
        </Fragment>
      ))}
    </>
  );
}

function App() {
  const [layers, setLayers] = useState<Record<string, LayerConfig>>(defaultLayers);
  const [heightScale, setHeightScale] = useState(50);
  const [pointRadius, setPointRadius] = useState(300);
  const [skyEnabled, setSkyEnabled] = useState(true);
  const [skyWeight, setSkyWeight] = useState(1.0);
  const [skySource, setSkySource] = useState('mars');
  const [skyBlurriness, setSkyBlurriness] = useState(0);
  const [skyIntensity, setSkyIntensity] = useState(1.0);
  const [skyRotation, setSkyRotation] = useState(0);

  const [heightMap, detailMap] = useLoader(THREE.TextureLoader, [
    '/assets/hole1_height.png',
    '/assets/hole1_detail.png'
  ]);

  const setBlend = useCallback((name: string, blend: BlendMode) => {
    setLayers(prev => ({
      ...prev,
      [name]: { ...prev[name], blend },
    }));
  }, []);

  const setWeight = useCallback((name: string, weight: number) => {
    setLayers(prev => ({
      ...prev,
      [name]: { ...prev[name], weight },
    }));
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, overflow: 'hidden', background: 'black' }}>
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <Canvas camera={{ position: [0, 100, 100], fov: 60 }}>
          <OrbitControls />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 50, 10]} intensity={1.5} />
          <CompositeRenderer
            layers={layers}
            heightMap={heightMap}
            detailMap={detailMap}
            heightScale={heightScale}
            pointRadius={pointRadius}
            skyEnabled={skyEnabled}
            skyWeight={skyWeight}
            skySource={skySource}
            skyBlurriness={skyBlurriness}
            skyIntensity={skyIntensity}
            skyRotation={skyRotation}
          />
        </Canvas>
      </div>

      {/* UI */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 50,
        background: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 8,
        backdropFilter: 'blur(10px)',
        color: 'white',
        maxHeight: '90vh',
        overflowY: 'auto',
        width: 300,
        pointerEvents: 'auto',
      }}>
        <h2 style={{ fontWeight: 'bold', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 8, textAlign: 'center' }}>LAYER COMPOSITOR</h2>

            <div style={{
              marginBottom: 16,
              padding: '8px 10px',
              borderRadius: 6,
              background: skyEnabled ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: skyEnabled ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: skyEnabled ? 6 : 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: skyEnabled ? 'white' : '#9ca3af' }}>Sky</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <select
                    value={skySource}
                    onChange={(e) => setSkySource(e.target.value)}
                    style={{
                      padding: '2px 4px',
                      fontSize: 11,
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: 3,
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.15)',
                      color: '#d1d5db',
                      outline: 'none',
                    }}
                  >
                    <option value="mars">Mars</option>
                    <option value="nycriver">NYC River</option>
                  </select>
                  <button
                    onClick={() => setSkyEnabled(prev => !prev)}
                    style={{
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: 3,
                      cursor: 'pointer',
                      background: skyEnabled ? '#ca8a04' : 'rgba(255,255,255,0.1)',
                      color: skyEnabled ? 'white' : '#9ca3af',
                    }}
                  >
                    {skyEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              {skyEnabled && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="range"
                      min="0" max="1" step="0.01"
                      value={skyWeight}
                      onChange={(e) => setSkyWeight(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{
                      fontSize: 12,
                      width: 32,
                      textAlign: 'right',
                      color: '#d1d5db',
                      fontFamily: 'monospace',
                    }}>
                      {skyWeight.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>Intensity</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="range"
                        min="0" max="3" step="0.05"
                        value={skyIntensity}
                        onChange={(e) => setSkyIntensity(Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{
                        fontSize: 12,
                        width: 32,
                        textAlign: 'right',
                        color: '#d1d5db',
                        fontFamily: 'monospace',
                      }}>
                        {skyIntensity.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>Blurriness</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={skyBlurriness}
                        onChange={(e) => setSkyBlurriness(Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{
                        fontSize: 12,
                        width: 32,
                        textAlign: 'right',
                        color: '#d1d5db',
                        fontFamily: 'monospace',
                      }}>
                        {skyBlurriness.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>Rotation</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="range"
                        min="0" max="360" step="1"
                        value={skyRotation}
                        onChange={(e) => setSkyRotation(Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{
                        fontSize: 12,
                        width: 32,
                        textAlign: 'right',
                        color: '#d1d5db',
                        fontFamily: 'monospace',
                      }}>
                        {skyRotation}°
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Height Scale</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="range"
                  min="0" max="200"
                  value={heightScale}
                  onChange={(e) => setHeightScale(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: 14, width: 32 }}>{heightScale}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MODE_NAMES.map(name => {
                const cfg = layers[name];
                const isOff = cfg.blend === 'OFF';
                return (
                  <div key={name} style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: isOff ? 'transparent' : 'rgba(255,255,255,0.05)',
                    border: isOff ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(59,130,246,0.4)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: isOff ? '#9ca3af' : 'white' }}>
                      {name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {(['OFF', 'ADD', 'MULT'] as BlendMode[]).map(b => (
                        <button
                          key={b}
                          onClick={() => setBlend(name, b)}
                          style={{
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: cfg.blend === b ? 'bold' : 'normal',
                            border: 'none',
                            borderRadius: 3,
                            cursor: 'pointer',
                            background: cfg.blend === b
                              ? (b === 'OFF' ? '#6b7280' : b === 'ADD' ? '#2563eb' : '#9333ea')
                              : 'rgba(255,255,255,0.1)',
                            color: cfg.blend === b ? 'white' : '#9ca3af',
                          }}
                        >
                          {b}
                        </button>
                      ))}
                      <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={cfg.weight}
                        onChange={(e) => setWeight(name, Number(e.target.value))}
                        disabled={isOff}
                        style={{
                          flex: 1,
                          opacity: isOff ? 0.3 : 1,
                          cursor: isOff ? 'default' : 'pointer',
                        }}
                      />
                      <span style={{
                        fontSize: 12,
                        width: 32,
                        textAlign: 'right',
                        color: isOff ? '#6b7280' : '#d1d5db',
                        fontFamily: 'monospace',
                      }}>
                        {cfg.weight.toFixed(2)}
                      </span>
                    </div>
                    {name === 'Points Colored' && (
                      <div style={{ marginTop: 6 }}>
                        <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>Point Radius</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="50" max="800"
                            value={pointRadius}
                            onChange={(e) => setPointRadius(Number(e.target.value))}
                            style={{ flex: 1 }}
                          />
                          <span style={{ fontSize: 12, width: 32, textAlign: 'right', color: '#d1d5db', fontFamily: 'monospace' }}>
                            {pointRadius}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
      </div>
    </div>
  );
}

export default App;
