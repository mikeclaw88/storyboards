# Terrain System

## Overview

The terrain system loads `.terrain` files created by the Terrain Editor and renders them with multi-texture splatting support. Terrain is used for golf course visualization and ball physics collision.

## Architecture

```
src/
├── components/
│   └── Terrain.tsx           # Terrain mesh rendering
├── stores/
│   └── terrainStore.ts       # Global terrain state for physics
├── types/
│   └── terrain.ts            # Type definitions
├── utils/
│   └── terrainLoader.ts      # File loading and parsing
└── shaders/
    └── terrainShaders.ts     # GLSL shaders for rendering
```

## Terrain File Format

Terrain files (`.terrain`) are JSON files containing (version 1.1.0):

```typescript
interface TerrainFileData {
  version: string;              // "1.1.0"
  dimensions: {
    width: number;              // Width in meters
    depth: number;              // Depth in meters
    resolution: number;         // Vertices per meter
  };
  heightScale?: number;         // Vertical scale multiplier (default: 20)
  textures: {
    layers: TextureLayer[];
    tileScale: number;
    macroNoise?: MacroNoiseSettings;  // v1.1.0: Large-scale noise
  };
  data: {
    heightmap: string;          // Base64-encoded Float32Array
    splatmap: string;           // Base64-encoded RGBA Uint8Array
  };
}

interface TextureLayer {
  id: string;
  name: string;
  colorMap: string;
  normalMap: string;
  detail?: DetailSettings;      // v1.1.0: Per-layer detail map
}

interface DetailSettings {
  detailMap: string;            // High-frequency detail texture path
  detailNormalMap: string;      // Detail normal map (optional)
  tileScale: number;            // UV repeat scale (default: 0.25 = 400 tiles/100m)
  strength: number;             // Blend strength 0-1 (default: 0.5)
  fadeStart: number;            // Distance to start fading (default: 20m)
  fadeEnd: number;              // Distance to fully fade out (default: 50m)
}

interface MacroNoiseSettings {
  noiseMap: string;             // Noise texture path
  scale: number;                // UV scale (default: 0.02)
  strength: number;             // Blend strength 0-1 (default: 0.3)
}
```

## Height Scale

The `heightScale` value controls vertical terrain scale:

| Source | Priority | Description |
|--------|----------|-------------|
| Terrain file | 1 (highest) | Value stored in `.terrain` file |
| Default | 2 | Fallback value of 20 |

**Note:** Config override via `config.json` is no longer supported. Height scale is always read from the terrain file.

## Texture Path Resolution

Texture paths in `.terrain` files are resolved relative to the terrain file's directory. This allows terrain files and their textures to be organized together.

### Path Resolution Rules

1. Paths starting with `./` are relative to the terrain file directory
2. Paths are normalized by removing the leading `./` if present
3. The terrain loader concatenates the base URL with the normalized path

### Example

```
public/
  terrains/
    terrain.terrain
    textures/
      grass/
        fairway.png
        rough.png
```

In `terrain.terrain`:
```json
{
  "textures": {
    "layers": [
      {
        "colorMap": "./textures/grass/fairway.png"
      }
    ]
  }
}
```

Resolved path: `/terrains/textures/grass/fairway.png`

## Usage

### Basic Usage

```tsx
import { Terrain } from '../components/Terrain';

<Terrain
  url="/terrains/terrain.terrain"
  position={[0, 0, 100]}
/>
```

### With Load Callback

```tsx
<Terrain
  url="/terrains/terrain.terrain"
  position={[0, 0, 100]}
  onLoad={(data) => console.log('Terrain loaded:', data.dimensions)}
/>
```

## Configuration

Terrain settings in `config.json`:

```json
{
  "terrain": {
    "url": "/terrains/terrain.terrain",
    "position": { "x": 0, "y": 0, "z": 100 },
    "visible": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Path to `.terrain` file |
| `position` | Vector3 | World position offset |
| `visible` | boolean | Whether terrain is rendered |

## Physics Integration

The terrain store provides height queries for ball physics:

```typescript
import { useTerrainStore } from '../stores/terrainStore';

// Get height at world position (accounts for position offset and heightScale)
const getTerrainHeight = useTerrainStore((s) => s.getHeightAtWorldPosition);
const height = getTerrainHeight(worldX, worldZ);
```

### Height Calculation

1. Convert world position to terrain-local coordinates
2. Sample heightmap using bilinear interpolation
3. Multiply by `heightScale` from terrain file
4. Add terrain Y position offset

## Rendering

### Shader Pipeline

**Vertex Shader:**
- Samples heightmap texture at UV coordinate
- Displaces vertex Y position by `height * heightScale`
- Calculates `vViewDistance` for detail fade (v1.1.0)

**Fragment Shader:**
- Samples splatmap for texture blend weights
- Blends up to 4 texture layers based on weights
- Applies normal mapping for surface detail
- (v1.1.0) Applies detail maps with distance-based fade
- (v1.1.0) Applies macro noise overlay blend

**Shader Defines:**
- `USE_DETAIL_MAPS` - Enabled when any layer has detail textures
- `USE_MACRO_NOISE` - Enabled when macro noise is configured

### Texture Layers

| Channel | Default Texture |
|---------|-----------------|
| R | Fairway grass |
| G | Rough grass |
| B | Putting green |
| A | Beach sand |

## Detail Maps (v1.1.0)

Detail maps add high-frequency texture detail visible at close range, creating Mario Golf-style visual quality.

### How It Works

1. **Per-layer detail textures** - Each texture layer can have its own detail map
2. **Distance-based fade** - Detail fades out smoothly between `fadeStart` and `fadeEnd` distances
3. **Multiply 2x blend** - Detail is blended using `color * detail * 2` for enhanced contrast

### UV Tiling

Detail maps tile much more frequently than base textures:

| tileScale | Tiles per 100m | Use Case |
|-----------|----------------|----------|
| 0.1 | 1000 | Very fine grass blades |
| 0.25 (default) | 400 | Standard detail |
| 0.5 | 200 | Medium detail |
| 1.0 | 100 | Coarse detail |

### Default Detail Textures

| Layer | Detail Texture Path |
|-------|---------------------|
| Fairway | `/textures/grass/fairway_detail.png` |
| Rough | `/textures/grass/rough_detail.png` |
| Putting Green | `/textures/grass/green_detail.png` |
| Beach Sand | `/textures/sand/beach_detail.png` |

## Macro Noise (v1.1.0)

Macro noise breaks up texture repetition patterns visible at medium distances using a large-scale noise overlay.

### How It Works

1. **Overlay blend** - Noise is applied using Photoshop-style overlay blending
2. **Large UV scale** - Noise tiles very infrequently (e.g., `scale: 0.02` = 2 tiles per 100m)
3. **Subtle strength** - Typically 0.2-0.4 to avoid obvious patterns

### Configuration

```json
{
  "macroNoise": {
    "noiseMap": "/textures/noise/macro_noise.png",
    "scale": 0.02,
    "strength": 0.3
  }
}
```

### Noise Texture

The default noise texture is a 256x256 Perlin noise grayscale image located at `/textures/noise/macro_noise.png`.

## Stochastic Tiling

Stochastic tiling eliminates visible texture repetition patterns by randomly rotating and offsetting texture samples across the terrain. This creates a more natural-looking surface even with small tileable textures.

### How It Works

Based on Deliot & Heitz 2019, the algorithm:

1. **Triangular Grid**: Divides the terrain into a simplex (triangular) grid
2. **Vertex Hashing**: Each grid vertex gets a deterministic random value
3. **Random Rotation**: Textures are rotated in 90-degree steps (0, 90, 180, 270) per vertex
4. **Barycentric Blending**: Samples from 3 vertices are blended using barycentric coordinates with x^4 weighting for sharp transitions

### Shader Define

`USE_STOCHASTIC_TILING` - Enabled by default for all terrain textures

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| GRID_SCALE | 3.5 | Grid cells per texture tile (higher = more variation) |
| Rotation Steps | 90 degrees | Discrete rotation angles (better for grass patterns) |
| Weight Power | 4 | Barycentric weight exponent (sharper transitions) |

### Performance

Stochastic tiling samples each texture 3 times per fragment, but the visual improvement is significant. The technique applies to both base textures and detail maps.

## Golf Editor

The Golf Editor's Terrain tab allows adjusting:
- **Position** (X, Y, Z) - World position offset
- **Visibility** - Toggle terrain rendering

Height scale is read-only from the terrain file. Use the Terrain Editor to modify height scale.

## Terrain Editor Save System

The Terrain Editor uses a shared `useSaveTerrain` hook for both keyboard shortcuts (Ctrl+S) and menu save to ensure consistent behavior.

**Key files:**
- `terrain-editor/src/hooks/useSaveTerrain.ts` - Shared save logic
- `terrain-editor/src/components/ui/FileMenu.tsx` - File menu UI
- `terrain-editor/src/App.tsx` - Keyboard shortcuts

**Saved data includes:**
- Heightmap data (base64 encoded)
- Splatmap data (base64 encoded)
- Texture layer settings (including detail maps)
- Macro noise settings
- Tile scale and height scale

**Dirty flag:**
Changes to the following mark the file as dirty:
- Height editing (raise, lower, smooth, flatten)
- Texture painting
- Detail map settings
- Macro noise settings
- Tile scale

## Related Files

| File | Purpose |
|------|---------|
| `dev-daniel/terrain-editor/` | Terrain Editor for creating/editing `.terrain` files |
| `public/terrains/terrain.terrain` | Default terrain file |
| `public/terrains/textures/` | Terrain textures (relative to terrain file) |
| `public/terrains/textures/grass/*.png` | Grass layer textures and detail maps |
| `public/terrains/textures/sand/*.png` | Sand layer textures |
| `public/terrains/textures/noise/macro_noise.png` | Macro noise texture |
| `public/config.json` | Runtime terrain configuration |
| `src/utils/terrainLoader.ts` | Terrain file loading and path resolution |
| `src/shaders/terrainShaders.ts` | GLSL shaders (stochastic tiling, detail maps) |
