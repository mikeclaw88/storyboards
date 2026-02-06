import { useEffect, useRef, useState, useMemo } from 'react';
import { useThree, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader, CubeTextureLoader } from 'three';

// === CONFIGURATION ===
// Default config matching hole1_viewer.html
const DEFAULT_CONFIG = {
  terrainSize: 512,
  segments: 256,
  heightScale: 50,
  treeWidth: 10,
  stripeWidth: 8,
  crosshatchDensity: 12,
  ringSpacing: 3,
  upperSquish: 1.0,
  lowerSquish: 1.0,
  horizonStretch: 1.0,
};

// === SHADERS ===

const terrainVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const terrainFragmentShader = `
  uniform sampler2D surfaceMap;
  uniform vec2 teePos;
  uniform vec2 holePos;
  uniform float terrainSize;
  uniform float stripeFreq;
  uniform float crosshatchFreq;
  uniform float ringFreq;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  // Cartoon green color palette
  const vec3 fairwayLight = vec3(0.45, 0.75, 0.35);
  const vec3 fairwayDark = vec3(0.35, 0.65, 0.28);
  const vec3 roughLight = vec3(0.35, 0.55, 0.25);
  const vec3 roughDark = vec3(0.28, 0.45, 0.20);
  const vec3 greenLight = vec3(0.40, 0.70, 0.35);
  const vec3 greenDark = vec3(0.32, 0.62, 0.28);
  const vec3 teeColor = vec3(0.42, 0.72, 0.38);
  const vec3 forestColor = vec3(0.20, 0.35, 0.15);
  const vec3 sandLight = vec3(0.96, 0.87, 0.70);   
  const vec3 sandDark = vec3(0.85, 0.75, 0.55);    

  bool isColorMatch(vec3 c1, vec3 c2, float tolerance) {
      return distance(c1, c2) < tolerance;
  }

  void main() {
      vec4 surfaceColor = texture2D(surfaceMap, vUv);
      vec3 sc = surfaceColor.rgb;

      vec3 color = forestColor; 

      bool isFairway = isColorMatch(sc, vec3(1.0, 1.0, 0.0), 0.2);       
      bool isRough = isColorMatch(sc, vec3(0.5, 0.5, 0.5), 0.2);          
      bool isGreen = isColorMatch(sc, vec3(0.0, 1.0, 1.0), 0.2);          
      bool isTee = isColorMatch(sc, vec3(1.0, 0.0, 1.0), 0.2);            
      bool isSand = isColorMatch(sc, vec3(0.0, 0.0, 1.0), 0.2);           

      vec2 worldXZ = vWorldPos.xz;

      if (isFairway) {
          vec2 teeWorld = (teePos - 0.5) * terrainSize;
          vec2 holeWorld = (holePos - 0.5) * terrainSize;
          vec2 dir = normalize(holeWorld - teeWorld);
          vec2 perp = vec2(-dir.y, dir.x); 
          float stripe = sin(dot(worldXZ, perp) * stripeFreq);
          color = mix(fairwayDark, fairwayLight, step(0.0, stripe));
      }
      else if (isRough) {
          float hatch1 = sin((worldXZ.x + worldXZ.y) * crosshatchFreq);
          float hatch2 = sin((worldXZ.x - worldXZ.y) * crosshatchFreq);
          float pattern = hatch1 * hatch2;
          color = mix(roughDark, roughLight, step(0.0, pattern));
      }
      else if (isGreen) {
          vec2 holeWorld = (holePos - 0.5) * terrainSize;
          float dist = distance(worldXZ, holeWorld);
          float ring = sin(dist * ringFreq);
          color = mix(greenDark, greenLight, step(0.0, ring));
      }
      else if (isTee) {
          vec2 teeWorld = (teePos - 0.5) * terrainSize;
          vec2 holeWorld = (holePos - 0.5) * terrainSize;
          vec2 dir = normalize(holeWorld - teeWorld);
          vec2 perp = vec2(-dir.y, dir.x);
          float stripe = sin(dot(worldXZ, perp) * stripeFreq * 2.0);
          color = mix(teeColor * 0.95, teeColor, step(0.0, stripe));
      }
      else if (isSand) {
          float wave1 = sin(worldXZ.x * 0.8 + worldXZ.y * 0.3);
          float wave2 = sin(worldXZ.x * 0.3 - worldXZ.y * 0.8);
          float pattern = wave1 * wave2;
          color = mix(sandDark, sandLight, smoothstep(-0.5, 0.5, pattern));
      }

      gl_FragColor = vec4(color, 1.0);
  }
`;

const skyboxVertexShader = `
  varying vec3 vWorldDirection;
  void main() {
      vWorldDirection = position;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_Position.z = gl_Position.w; // Push to far plane
  }
`;

const skyboxFragmentShader = `
  uniform samplerCube cubemap;
  uniform float upperSquish;
  uniform float lowerSquish;
  uniform float horizonStretch;
  varying vec3 vWorldDirection;

  void main() {
      vec3 viewDir = normalize(vWorldDirection);
      float y = viewDir.y;

      if (y > 0.0) {
          y = pow(y, upperSquish);
      } else {
          y = -pow(abs(y), lowerSquish);
      }

      y = y * horizonStretch;
      y = clamp(y, -1.0, 1.0);

      float xzLen = length(viewDir.xz);
      vec2 xz = (xzLen > 0.001) ? (viewDir.xz / xzLen) * sqrt(1.0 - y * y) : vec2(0.0, 0.0);
      vec3 newDir = normalize(vec3(xz.x, y, xz.y));

      gl_FragColor = textureCube(cubemap, newDir);
  }
`;

const ASSETS_PATH = '/assets/hole1';
const CUBEMAP_PATH = '/assets/nycriver';

export function GolfCourseRenderer() {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  // State for loaded data
  const [forestData, setForestData] = useState<any>(null);
  const [heightData, setHeightData] = useState<Uint8ClampedArray | null>(null);
  const [heightDimensions, setHeightDimensions] = useState({ w: 0, h: 0 });
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Load Textures via R3F Loader (Suspense handled by parent)
  const surfaceMap = useLoader(TextureLoader, `${ASSETS_PATH}/surface.png`);
  surfaceMap.colorSpace = THREE.SRGBColorSpace;
  
  const treeTextures = useLoader(TextureLoader, [
    `${ASSETS_PATH}/trees/1.png`,
    `${ASSETS_PATH}/trees/2.png`,
    `${ASSETS_PATH}/trees/3.png`,
    `${ASSETS_PATH}/trees/4.png`
  ]);

  const skyboxTexture = useLoader(CubeTextureLoader, [
    `${CUBEMAP_PATH}/px.jpg`, `${CUBEMAP_PATH}/nx.jpg`,
    `${CUBEMAP_PATH}/py.jpg`, `${CUBEMAP_PATH}/ny.jpg`,
    `${CUBEMAP_PATH}/pz.jpg`, `${CUBEMAP_PATH}/nz.jpg`
  ]);

  // Load Height Data (Manual fetch because we need pixel data)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        setHeightData(data);
        setHeightDimensions({ w: img.width, h: img.height });
      }
    };
    img.src = `${ASSETS_PATH}/height.png`;
  }, []);

  // Load Forest Data
  useEffect(() => {
    // In production, this might come from API or static file
    fetch(`${ASSETS_PATH}/forest_data.json`)
      .then(res => res.json())
      .then(data => {
        setForestData(data);
        if (data.config) {
            setConfig(prev => ({ ...prev, ...data.config }));
        }
      })
      .catch(err => console.error("Failed to load forest data", err));
  }, []);

  // Height sampling function
  const sampleHeight = (u: number, v: number) => {
    if (!heightData) return 0;
    const px = Math.floor(u * heightDimensions.w);
    const py = Math.floor(v * heightDimensions.h);
    if (px < 0 || px >= heightDimensions.w || py < 0 || py >= heightDimensions.h) return 0;
    const idx = (py * heightDimensions.w + px) * 4;
    return heightData[idx] / 255;
  };

  const getHeightAt = (x: number, z: number) => {
    if (!heightData) return 0;
    const u = (x / config.terrainSize + 0.5);
    const v = (z / config.terrainSize + 0.5);
    const px = Math.floor(u * heightDimensions.w);
    const py = Math.floor(v * heightDimensions.h);
    
    if (px < 0 || px >= heightDimensions.w || py < 0 || py >= heightDimensions.h) return 0;

    const idx = (py * heightDimensions.w + px) * 4;
    return (heightData[idx] / 255) * config.heightScale;
  };

  // Build Scene Content
  useEffect(() => {
    if (!groupRef.current || !heightData || !forestData) return;

    const group = groupRef.current;
    group.clear();

    // --- SKYBOX ---
    const skyMat = new THREE.ShaderMaterial({
        uniforms: {
            cubemap: { value: skyboxTexture },
            upperSquish: { value: config.upperSquish },
            lowerSquish: { value: config.lowerSquish },
            horizonStretch: { value: config.horizonStretch },
        },
        vertexShader: skyboxVertexShader,
        fragmentShader: skyboxFragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
    });
    const skyGeo = new THREE.SphereGeometry(5000, 32, 32);
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    skyMesh.renderOrder = -1000;
    group.add(skyMesh);

    // --- TERRAIN ---
    const terrainGeo = new THREE.PlaneGeometry(
        config.terrainSize,
        config.terrainSize,
        config.segments,
        config.segments
    );
    
    const pos = terrainGeo.attributes.position;
    const uv = terrainGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const u = uv.getX(i);
        const v = uv.getY(i);
        // sampleHeight uses (u, 1-v) for texture mapping orientation? 
        // hole1_viewer uses sampleHeight(u, 1-v).
        const h = sampleHeight(u, 1 - v) * config.heightScale;
        pos.setZ(i, h);
    }
    pos.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.ShaderMaterial({
        uniforms: {
            surfaceMap: { value: surfaceMap },
            teePos: { value: new THREE.Vector2(0.5, 0.5) },
            holePos: { value: new THREE.Vector2(0.5, 0.5) },
            terrainSize: { value: config.terrainSize },
            stripeFreq: { value: 2.0 * Math.PI / config.stripeWidth },
            crosshatchFreq: { value: 2.0 * Math.PI / config.crosshatchDensity },
            ringFreq: { value: 2.0 * Math.PI / config.ringSpacing },
        },
        vertexShader: terrainVertexShader,
        fragmentShader: terrainFragmentShader,
    });

    // Update uniforms with tee/hole
    if (forestData.tee) {
        terrainMat.uniforms.teePos.value.set(
            forestData.tee.x / forestData.width,
            1.0 - (forestData.tee.y / forestData.height)
        );
    }
    if (forestData.hole) {
        terrainMat.uniforms.holePos.value.set(
            forestData.hole.x / forestData.width,
            1.0 - (forestData.hole.y / forestData.height)
        );
    }

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.receiveShadow = true;
    group.add(terrainMesh);

    // --- TREES & OBJECTS ---
    const cx = -forestData.width / 2;
    const cz = -forestData.height / 2;
    const treeHeight = config.treeWidth * (832 / 588);
    const treeGeo = new THREE.PlaneGeometry(config.treeWidth, treeHeight);

    // Create shared materials for trees
    const treeMaterials = treeTextures.map(tex => new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
    }));

    forestData.trees.forEach((t: any) => {
        // Reuse material
        const mat = treeMaterials[Math.floor(Math.random() * treeMaterials.length)];

        const worldX = t.x + cx;
        const worldZ = t.y + cz;
        const groundY = getHeightAt(worldX, worldZ);

        const mesh = new THREE.Mesh(treeGeo, mat);
        mesh.position.set(worldX, groundY + treeHeight / 2, worldZ);
        mesh.userData.isTree = true;
        group.add(mesh);
    });

    // Hole
    if (forestData.hole) {
        const hx = forestData.hole.x + cx;
        const hz = forestData.hole.y + cz;
        const hy = getHeightAt(hx, hz);
        
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 15, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        pole.position.set(hx, hy + 7.5, hz);
        group.add(pole);

        const flag = new THREE.Mesh(
            new THREE.ShapeGeometry(new THREE.Shape().moveTo(0,0).lineTo(6,-2).lineTo(0,-4).lineTo(0,0)),
            new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
        );
        flag.position.set(hx, hy + 14, hz);
        flag.rotation.y = Math.PI/4;
        group.add(flag);
    }
    
    // Tee
    if (forestData.tee) {
        const tx = forestData.tee.x + cx;
        const tz = forestData.tee.y + cz;
        const ty = getHeightAt(tx, tz);
        
        // Marker
        const marker = new THREE.Mesh(
            new THREE.BoxGeometry(1, 4, 1),
            new THREE.MeshBasicMaterial({ color: 0xff00ff })
        );
        marker.position.set(tx, ty + 2, tz);
        group.add(marker);
    }

  }, [heightData, forestData, config, surfaceMap, treeTextures, skyboxTexture]);

  // Billboard Logic
  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    
    // Rotate trees to face camera (Y-axis locked)
    groupRef.current.children.forEach(child => {
        if (child.userData.isTree) {
            const camXZ = new THREE.Vector3(camera.position.x, child.position.y, camera.position.z);
            child.lookAt(camXZ);
        }
    });
  });

  return <group ref={groupRef} />;
}
