import { useEffect, useRef, useState, useMemo } from 'react';
import { useThree, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { useTerrainStore } from '../stores/terrainStore'; // Import Store

// === CONFIGURATION ===
const DEFAULT_CONFIG = {
  terrainSize: 512,
  segments: 256,
  heightScale: 50,
  treeWidth: 10,
  stripeWidth: 8,
  crosshatchDensity: 12,
  ringSpacing: 3,
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
  bool isColorMatch(vec3 c1, vec3 c2, float tolerance) { return distance(c1, c2) < tolerance; }
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
      } else if (isRough) {
          float hatch1 = sin((worldXZ.x + worldXZ.y) * crosshatchFreq);
          float hatch2 = sin((worldXZ.x - worldXZ.y) * crosshatchFreq);
          float pattern = hatch1 * hatch2;
          color = mix(roughDark, roughLight, step(0.0, pattern));
      } else if (isGreen) {
          vec2 holeWorld = (holePos - 0.5) * terrainSize;
          float dist = distance(worldXZ, holeWorld);
          float ring = sin(dist * ringFreq);
          color = mix(greenDark, greenLight, step(0.0, ring));
      } else if (isTee) {
          vec2 teeWorld = (teePos - 0.5) * terrainSize;
          vec2 holeWorld = (holePos - 0.5) * terrainSize;
          vec2 dir = normalize(holeWorld - teeWorld);
          vec2 perp = vec2(-dir.y, dir.x);
          float stripe = sin(dot(worldXZ, perp) * stripeFreq * 2.0);
          color = mix(teeColor * 0.95, teeColor, step(0.0, stripe));
      } else if (isSand) {
          float wave1 = sin(worldXZ.x * 0.8 + worldXZ.y * 0.3);
          float wave2 = sin(worldXZ.x * 0.3 - worldXZ.y * 0.8);
          float pattern = wave1 * wave2;
          color = mix(sandDark, sandLight, smoothstep(-0.5, 0.5, pattern));
      }
      gl_FragColor = vec4(color, 1.0);
  }
`;

const ASSETS_PATH = '/assets/hole1';

export function GolfCourseRenderer() {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  const [forestData, setForestData] = useState<any>(null);
  const [heightData, setHeightData] = useState<Uint8ClampedArray | null>(null);
  const [surfaceData, setSurfaceData] = useState<Uint8ClampedArray | null>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const surfaceMap = useLoader(TextureLoader, `${ASSETS_PATH}/surface.png`);
  surfaceMap.colorSpace = THREE.SRGBColorSpace;
  
  const treeTextures = useLoader(TextureLoader, [
    `${ASSETS_PATH}/trees/1.png`,
    `${ASSETS_PATH}/trees/2.png`,
    `${ASSETS_PATH}/trees/3.png`,
    `${ASSETS_PATH}/trees/4.png`
  ]);
  
  // Access Store
  const setRawData = useTerrainStore(s => s.setRawData);

  // Load Height Map
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
        setDimensions({ w: img.width, h: img.height });
      }
    };
    img.src = `${ASSETS_PATH}/height.png`;
  }, []);
  
  // Load Surface Map (Data)
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
            setSurfaceData(data);
        }
    };
    img.src = `${ASSETS_PATH}/surface.png`;
  }, []);

  // Sync to Store when both ready
  useEffect(() => {
    if (heightData && surfaceData && dimensions.w > 0) {
        console.log("GolfCourseRenderer: Syncing to TerrainStore", {
            width: dimensions.w, height: dimensions.h, 
            terrainSize: config.terrainSize, heightScale: config.heightScale
        });
        setRawData(
            heightData, 
            surfaceData, 
            dimensions.w, 
            dimensions.h, 
            config.terrainSize, 
            config.heightScale
        );
    }
  }, [heightData, surfaceData, dimensions, config, setRawData]);

  // Load Forest Data
  useEffect(() => {
    fetch(`${ASSETS_PATH}/forest_data.json`)
      .then(res => res.json())
      .then(data => {
        setForestData(data);
        if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
      })
      .catch(err => console.error("Failed to load forest data", err));
  }, []);

  const sampleHeight = (u: number, v: number) => {
    if (!heightData) return 0;
    const px = Math.floor(u * dimensions.w);
    const py = Math.floor(v * dimensions.h);
    if (px < 0 || px >= dimensions.w || py < 0 || py >= dimensions.h) return 0;
    const idx = (py * dimensions.w + px) * 4;
    return heightData[idx] / 255;
  };

  const getHeightAt = (x: number, z: number) => {
    if (!heightData) return 0;
    const u = (x / config.terrainSize + 0.5);
    const v = (z / config.terrainSize + 0.5);
    const px = Math.floor(u * dimensions.w);
    const py = Math.floor(v * dimensions.h);
    if (px < 0 || px >= dimensions.w || py < 0 || py >= dimensions.h) return 0;
    const idx = (py * dimensions.w + px) * 4;
    return (heightData[idx] / 255) * config.heightScale;
  };

  useEffect(() => {
    if (!groupRef.current || !heightData || !forestData) return;

    const group = groupRef.current;
    group.clear();

    // Terrain
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

    // Trees
    const cx = -forestData.width / 2;
    const cz = -forestData.height / 2;
    const treeHeight = config.treeWidth * (832 / 588);
    const treeGeo = new THREE.PlaneGeometry(config.treeWidth, treeHeight);
    const treeInstances = treeTextures.map(() => ({ matrices: [] as THREE.Matrix4[] }));
    
    // Use full tree list
    forestData.trees.forEach((t: any) => {
        const texIndex = Math.floor(Math.random() * treeTextures.length);
        const worldX = t.x + cx;
        const worldZ = t.y + cz;
        const groundY = getHeightAt(worldX, worldZ);
        const matrix = new THREE.Matrix4();
        matrix.setPosition(worldX, groundY + treeHeight / 2, worldZ);
        treeInstances[texIndex].matrices.push(matrix);
    });

    treeInstances.forEach((data, index) => {
        if (data.matrices.length === 0) return;
        const mat = new THREE.MeshBasicMaterial({
            map: treeTextures[index],
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const mesh = new THREE.InstancedMesh(treeGeo, mat, data.matrices.length);
        data.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.userData.isTree = true;
        group.add(mesh);
    });

    // Hole/Flag
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
    
    // Tee Marker
    if (forestData.tee) {
        const tx = forestData.tee.x + cx;
        const tz = forestData.tee.y + cz;
        const ty = getHeightAt(tx, tz);
        
        const marker = new THREE.Mesh(
            new THREE.BoxGeometry(1, 4, 1),
            new THREE.MeshBasicMaterial({ color: 0xff00ff })
        );
        marker.position.set(tx, ty + 2, tz);
        group.add(marker);
    }

  }, [heightData, forestData, config, surfaceMap, treeTextures]);

  return <group ref={groupRef} />;
}
