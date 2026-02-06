/**
 * Terrain component for rendering .terrain files
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import type { TerrainData, TerrainDimensions, TextureLayer, DetailSettings, MacroNoiseSettings } from '../types/terrain';
import { DEFAULT_TEXTURE_LAYERS, DEFAULT_DETAIL_SETTINGS } from '../types/terrain';
import { loadTerrainFromUrl, getHeightmapSize } from '../utils/terrainLoader';
import {
  terrainVertexPars,
  terrainVertexMain,
  terrainFragmentPars,
  terrainFragmentMain,
} from '../shaders/terrainShaders';
import { useTerrainStore } from '../stores/terrainStore';
import { useDebugStore } from '../stores/debugStore';

interface TerrainProps {
  url: string;
  /** Override heightScale from file. If undefined, uses value from terrain file. */
  heightScale?: number;
  /** Mesh position (local coordinates) */
  position?: [number, number, number];
  /** World position for physics calculations (if different from mesh position due to parent transforms) */
  worldPosition?: [number, number, number];
  /** Uniform scale from parent group (for physics calculations) */
  terrainScale?: number;
  onLoad?: (data: TerrainData) => void;
}

interface ShaderWithUniforms {
  uniforms: Record<string, THREE.IUniform>;
  vertexShader: string;
  fragmentShader: string;
}

interface MaterialWithShader extends THREE.MeshStandardMaterial {
  userData: { shader?: ShaderWithUniforms };
}

/**
 * Create DataTexture for splatmap
 */
function createSplatMapTexture(
  splatData: Uint8Array,
  dimensions: TerrainDimensions
): THREE.DataTexture {
  const { cols, rows } = getHeightmapSize(dimensions);

  const texture = new THREE.DataTexture(
    splatData,
    cols,
    rows,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );

  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}

interface DetailTextureSet {
  detail: THREE.Texture | null;
  detailNormal: THREE.Texture | null;
  settings: DetailSettings;
}

/**
 * Create terrain material with texture splatting
 */
function createTerrainMaterialWithUniform(options: {
  splatMap: THREE.DataTexture;
  textures: THREE.Texture[];
  normalMaps: (THREE.Texture | null)[];
  tileScale: number;
  terrainSize: THREE.Vector2;
  detailTextures?: DetailTextureSet[];
  macroNoise?: {
    texture: THREE.Texture;
    settings: MacroNoiseSettings;
  };
  photoTexture?: THREE.Texture;
}): THREE.MeshStandardMaterial {
  const {
    splatMap,
    textures,
    normalMaps,
    tileScale,
    terrainSize,
    detailTextures,
    macroNoise,
    photoTexture,
  } = options;

  const material = new THREE.MeshStandardMaterial({
    roughness: 0.8,
    metalness: 0.0,
  }) as MaterialWithShader;

  const usePhotoTexture = !!photoTexture;

  // Determine which features are enabled (only relevant in splatmap mode)
  const useDetailMaps = !usePhotoTexture && detailTextures && detailTextures.some(d => d.detail !== null);
  const useMacroNoise = !usePhotoTexture && macroNoise && macroNoise.texture;

  material.onBeforeCompile = (shader) => {
    // uTerrainSize is declared in vertex shader (unconditionally), so always bind it
    shader.uniforms.uTerrainSize = { value: terrainSize };

    if (usePhotoTexture) {
      shader.uniforms.uPhotoTexture = { value: photoTexture };
    } else {
      shader.uniforms.uSplatMap = { value: splatMap };
      shader.uniforms.uTexture0 = { value: textures[0] || null };
      shader.uniforms.uTexture1 = { value: textures[1] || null };
      shader.uniforms.uTexture2 = { value: textures[2] || null };
      shader.uniforms.uTexture3 = { value: textures[3] || null };
      shader.uniforms.uNormal0 = { value: normalMaps[0] || null };
      shader.uniforms.uNormal1 = { value: normalMaps[1] || null };
      shader.uniforms.uNormal2 = { value: normalMaps[2] || null };
      shader.uniforms.uNormal3 = { value: normalMaps[3] || null };
      shader.uniforms.uTileScale = { value: tileScale };

      // Add detail map uniforms if enabled
      if (useDetailMaps && detailTextures) {
        for (let i = 0; i < 4; i++) {
          const dt = detailTextures[i];
          shader.uniforms[`uDetail${i}`] = { value: dt?.detail || null };
          shader.uniforms[`uDetailNormal${i}`] = { value: dt?.detailNormal || null };
          shader.uniforms[`uDetailSettings${i}`] = {
            value: dt ? new THREE.Vector4(
              dt.settings.tileScale,
              dt.settings.strength,
              dt.settings.fadeStart,
              dt.settings.fadeEnd
            ) : new THREE.Vector4(2, 0, 20, 50)
          };
        }
      }

      // Add macro noise uniforms if enabled
      if (useMacroNoise && macroNoise) {
        shader.uniforms.uMacroNoise = { value: macroNoise.texture };
        shader.uniforms.uMacroScale = { value: macroNoise.settings.scale };
        shader.uniforms.uMacroStrength = { value: macroNoise.settings.strength };
      }
    }

    // Build shader defines
    let defines = '';
    if (usePhotoTexture) {
      defines += '#define USE_PHOTO_TEXTURE\n';
    } else {
      defines += '#define USE_STOCHASTIC_TILING\n'; // Break texture repetition
      if (useDetailMaps) {
        defines += '#define USE_DETAIL_MAPS\n';
      }
      if (useMacroNoise) {
        defines += '#define USE_MACRO_NOISE\n';
      }
    }

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      ${terrainVertexPars}`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      ${terrainVertexMain}`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `${defines}
      #include <common>
      ${terrainFragmentPars}`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      terrainFragmentMain
    );

    material.userData.shader = shader as ShaderWithUniforms;
  };

  material.needsUpdate = true;

  return material;
}

// 1x1 transparent pixel for placeholder textures
const PLACEHOLDER_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
// 1x1 gray pixel for placeholder detail/noise textures (neutral for multiply blend)
const PLACEHOLDER_DETAIL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/**
 * Load textures for terrain layers
 */
function useTerrainTextures(layers: TextureLayer[], macroNoise?: MacroNoiseSettings, photoTexturePath?: string) {
  const hasPhotoTexture = !!photoTexturePath;

  // In photo texture mode, skip loading splatmap layer textures — use placeholders
  const colorMaps = hasPhotoTexture
    ? [PLACEHOLDER_TEXTURE]
    : layers.map(l => l.colorMap);

  // Filter out empty normalMap paths
  const validNormalMapPaths = hasPhotoTexture
    ? []
    : layers.map(l => l.normalMap).filter(path => path && path.length > 0);

  // Collect detail map paths
  const validDetailMapPaths = hasPhotoTexture
    ? []
    : layers.map(l => l.detail?.detailMap).filter((path): path is string => !!path && path.length > 0);

  const validDetailNormalPaths = hasPhotoTexture
    ? []
    : layers.map(l => l.detail?.detailNormalMap).filter((path): path is string => !!path && path.length > 0);

  // Macro noise path
  const macroNoisePath = !hasPhotoTexture && macroNoise?.noiseMap && macroNoise.noiseMap.length > 0
    ? macroNoise.noiseMap
    : null;

  const textures = useLoader(TextureLoader, colorMaps);
  const loadedNormalMaps = useLoader(
    TextureLoader,
    validNormalMapPaths.length > 0 ? validNormalMapPaths : [PLACEHOLDER_TEXTURE]
  );
  const loadedDetailMaps = useLoader(
    TextureLoader,
    validDetailMapPaths.length > 0 ? validDetailMapPaths : [PLACEHOLDER_DETAIL]
  );
  const loadedDetailNormalMaps = useLoader(
    TextureLoader,
    validDetailNormalPaths.length > 0 ? validDetailNormalPaths : [PLACEHOLDER_TEXTURE]
  );
  const loadedMacroNoise = useLoader(
    TextureLoader,
    macroNoisePath ? [macroNoisePath] : [PLACEHOLDER_DETAIL]
  );
  const loadedPhotoTexture = useLoader(
    TextureLoader,
    photoTexturePath ? [photoTexturePath] : [PLACEHOLDER_TEXTURE]
  );

  // Build normalMaps array matching layer indices (null for empty paths)
  const normalMaps = useMemo(() => {
    if (hasPhotoTexture) return [];
    let loadedIndex = 0;
    return layers.map(l => {
      if (l.normalMap && l.normalMap.length > 0) {
        return loadedNormalMaps[loadedIndex++];
      }
      return null;
    });
  }, [layers, loadedNormalMaps, hasPhotoTexture]);

  // Build detail textures array
  const detailTextures = useMemo(() => {
    if (hasPhotoTexture) return [];
    let detailIndex = 0;
    let detailNormalIndex = 0;
    return layers.map(l => {
      const detail = l.detail;
      const hasDetailMap = detail?.detailMap && detail.detailMap.length > 0;
      const hasDetailNormal = detail?.detailNormalMap && detail.detailNormalMap.length > 0;

      return {
        detail: hasDetailMap ? loadedDetailMaps[detailIndex++] : null,
        detailNormal: hasDetailNormal ? loadedDetailNormalMaps[detailNormalIndex++] : null,
        settings: detail || DEFAULT_DETAIL_SETTINGS,
      };
    });
  }, [layers, loadedDetailMaps, loadedDetailNormalMaps, hasPhotoTexture]);

  // Macro noise texture
  const macroNoiseTexture = useMemo(() => {
    if (!macroNoisePath) return null;
    return loadedMacroNoise[0];
  }, [macroNoisePath, loadedMacroNoise]);

  // Photo texture
  const photoTexture = useMemo(() => {
    if (!photoTexturePath) return null;
    return loadedPhotoTexture[0];
  }, [photoTexturePath, loadedPhotoTexture]);

  // Configure texture wrapping and color space
  useEffect(() => {
    if (!hasPhotoTexture) {
      textures.forEach(tex => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace; // Important for correct lighting
        tex.needsUpdate = true;
      });
      normalMaps.forEach(tex => {
        if (tex) {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          // Normal maps should stay in linear color space (default)
          tex.needsUpdate = true;
        }
      });
      detailTextures.forEach(dt => {
        if (dt.detail) {
          dt.detail.wrapS = THREE.RepeatWrapping;
          dt.detail.wrapT = THREE.RepeatWrapping;
          dt.detail.colorSpace = THREE.SRGBColorSpace;
          dt.detail.needsUpdate = true;
        }
        if (dt.detailNormal) {
          dt.detailNormal.wrapS = THREE.RepeatWrapping;
          dt.detailNormal.wrapT = THREE.RepeatWrapping;
          dt.detailNormal.needsUpdate = true;
        }
      });
      if (macroNoiseTexture) {
        macroNoiseTexture.wrapS = THREE.RepeatWrapping;
        macroNoiseTexture.wrapT = THREE.RepeatWrapping;
        macroNoiseTexture.needsUpdate = true;
      }
    }
    if (photoTexture) {
      photoTexture.colorSpace = THREE.SRGBColorSpace;
      photoTexture.wrapS = THREE.ClampToEdgeWrapping;
      photoTexture.wrapT = THREE.ClampToEdgeWrapping;
      photoTexture.needsUpdate = true;
    }
  }, [textures, normalMaps, detailTextures, macroNoiseTexture, photoTexture, hasPhotoTexture]);

  return { textures, normalMaps, detailTextures, macroNoiseTexture, photoTexture };
}

/**
 * Terrain mesh component
 */
export function Terrain({
  url,
  heightScale: heightScaleProp,
  position = [0, 0, 0],
  worldPosition,
  terrainScale = 1,
  onLoad,
}: TerrainProps) {
  const [terrainData, setTerrainData] = useState<TerrainData | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Get terrain store actions
  const setTerrainStoreData = useTerrainStore((s) => s.setTerrainData);
  const setTerrainPosition = useTerrainStore((s) => s.setTerrainPosition);
  const setTerrainHeightScale = useTerrainStore((s) => s.setHeightScale);
  const setTerrainScaleStore = useTerrainStore((s) => s.setTerrainScale);

  // Debug settings
  const heightMultiplier = useDebugStore((s) => s.heightMultiplier);
  const terrainYOffset = useDebugStore((s) => s.terrainYOffset);
  const renderYOffset = useDebugStore((s) => s.renderYOffset);

  // Effective heightScale: (prop override > file value > default 20) * debug multiplier
  const baseHeightScale = heightScaleProp ?? terrainData?.heightScale ?? 20;
  const effectiveHeightScale = baseHeightScale * heightMultiplier;

  // Load terrain file
  useEffect(() => {
    loadTerrainFromUrl(url)
      .then(data => {
        setTerrainData(data);
        setTerrainStoreData(data); // Store in global state for physics
        onLoad?.(data);
      })
      .catch(err => {
        console.error('Failed to load terrain:', err);
      });
  }, [url, onLoad, setTerrainStoreData]);

  // Update terrain position in store when position prop changes
  // Use worldPosition for physics if provided (when parent has transforms), otherwise use mesh position
  useEffect(() => {
    const physicsPos = worldPosition || position;
    setTerrainPosition({ x: physicsPos[0], y: physicsPos[1], z: physicsPos[2] });
  }, [position, worldPosition, setTerrainPosition]);

  // Update height scale in store when effective value changes
  useEffect(() => {
    setTerrainHeightScale(effectiveHeightScale);
  }, [effectiveHeightScale, setTerrainHeightScale]);

  // Update terrain scale in store when it changes
  useEffect(() => {
    setTerrainScaleStore(terrainScale);
  }, [terrainScale, setTerrainScaleStore]);

  // Use default layers while loading, then switch to loaded layers
  const layers = terrainData?.textureLayers || DEFAULT_TEXTURE_LAYERS;
  const macroNoise = terrainData?.macroNoise;
  const photoTexturePath = terrainData?.photoTexture;
  const { textures, normalMaps, detailTextures, macroNoiseTexture, photoTexture } = useTerrainTextures(layers, macroNoise, photoTexturePath);

  // Create geometry and material when terrain data is loaded
  // effectiveHeightScale is included in deps to ensure correct initial value
  const { geometry, material } = useMemo(() => {
    if (!terrainData) return { geometry: null, material: null };

    const { dimensions, heightData, splatData, tileScale } = terrainData;
    const { width, depth } = dimensions;
    const { cols, rows } = getHeightmapSize(dimensions);

    // Create plane geometry with proper segment count
    const geo = new THREE.PlaneGeometry(
      width,
      depth,
      cols - 1,
      rows - 1
    );

    // Rotate to horizontal (XZ plane)
    geo.rotateX(-Math.PI / 2);

    // Displace vertices on CPU (same algorithm as collision mesh)
    const posAttribute = geo.getAttribute('position');
    for (let i = 0; i < posAttribute.count; i++) {
      posAttribute.setY(i, (heightData[i] || 0) * effectiveHeightScale);
    }
    posAttribute.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    // Create data textures
    const splatMap = createSplatMapTexture(splatData, dimensions);

    // Build macro noise config if available
    const macroNoiseConfig = macroNoise && macroNoiseTexture ? {
      texture: macroNoiseTexture,
      settings: macroNoise,
    } : undefined;

    // Create material
    const mat = createTerrainMaterialWithUniform({
      splatMap,
      textures: textures as THREE.Texture[],
      normalMaps: normalMaps as (THREE.Texture | null)[],
      tileScale,
      terrainSize: new THREE.Vector2(width, depth),
      detailTextures,
      macroNoise: macroNoiseConfig,
      photoTexture: photoTexture || undefined,
    });

    return { geometry: geo, material: mat };
  }, [terrainData, textures, normalMaps, detailTextures, macroNoiseTexture, macroNoise, effectiveHeightScale, photoTexture]);

  if (!geometry || !material) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[position[0], position[1] + (terrainYOffset + renderYOffset) / terrainScale, position[2]]}
      receiveShadow
      castShadow
    />
  );
}

export default Terrain;
