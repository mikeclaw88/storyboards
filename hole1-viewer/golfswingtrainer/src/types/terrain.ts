/**
 * Terrain file format types
 */

export interface TerrainDimensions {
  width: number;
  depth: number;
  resolution: number;
}

export interface DetailSettings {
  detailMap: string;
  detailNormalMap: string;
  tileScale: number;
  strength: number;
  fadeStart: number;
  fadeEnd: number;
}

export interface MacroNoiseSettings {
  noiseMap: string;
  scale: number;
  strength: number;
}

export interface TextureLayer {
  id: string;
  name: string;
  colorMap: string;
  normalMap: string;
  detail?: DetailSettings;
}

export interface TerrainTextures {
  layers: TextureLayer[];
  tileScale: number;
  macroNoise?: MacroNoiseSettings;
  photoTexture?: string;
}

export interface TerrainFileData {
  version: string;
  dimensions: TerrainDimensions;
  heightScale?: number;
  textures: TerrainTextures;
  data: {
    heightmap?: string;
    heightmapImage?: string;
    splatmap: string;
  };
}

export interface TerrainData {
  dimensions: TerrainDimensions;
  heightData: Float32Array;
  splatData: Uint8Array;
  heightScale: number;
  textureLayers: TextureLayer[];
  tileScale: number;
  macroNoise?: MacroNoiseSettings;
  photoTexture?: string;
  heightmapImage?: string;
}

export const DEFAULT_TEXTURE_LAYERS: TextureLayer[] = [
  {
    id: 'fairway',
    name: 'Fairway',
    colorMap: './terrains/textures/grass/fairway.png',
    normalMap: '',
  },
  {
    id: 'rough',
    name: 'Rough',
    colorMap: './terrains/textures/grass/rough.png',
    normalMap: '',
  },
  {
    id: 'putting_green',
    name: 'Putting Green',
    colorMap: './terrains/textures/grass/green.png',
    normalMap: '',
  },
  {
    id: 'beach',
    name: 'Beach Sand',
    colorMap: './terrains/textures/sand/beach_color.jpg',
    normalMap: './terrains/textures/sand/beach_normal.jpg',
  },
];

export const DEFAULT_DETAIL_SETTINGS: DetailSettings = {
  detailMap: '',
  detailNormalMap: '',
  tileScale: 0.25,  // Detail tiles 400 times on 100m terrain
  strength: 0.5,
  fadeStart: 20,
  fadeEnd: 50,
};

export const DEFAULT_MACRO_NOISE_SETTINGS: MacroNoiseSettings = {
  noiseMap: './terrains/textures/noise/macro_noise.png',
  scale: 0.02,
  strength: 0.3,
};
