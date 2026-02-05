# Terrain Detail Mapping & Macro Noise Implementation Plan

## Summary

Improve golf game terrain quality to Mario Golf-style visuals by adding:
1. **Macro Noise Layer** - Large-scale noise to break repetition patterns
2. **Detail Map Layer** - Per-layer high-frequency textures for close-up detail

Both `terrain-editor` and `swing-girls` are updated together.

---

## New Texture Layer Stack

| Layer | Purpose | UV Tiling | Blend Mode |
|-------|---------|-----------|------------|
| Base (Splat) | Existing 4-channel blending | `terrainSize / tileScale` | Base |
| Macro Noise | Break repetition patterns | `terrainSize * 0.02` | Overlay |
| Detail Map | Close-up grass texture | `terrainSize / 0.25` (per-layer) | Multiply 2x |

---

## Implementation Phases

### Phase 1: Type Definitions
**Files:**
- `terrain-editor/src/types/terrain.ts`
- `swing-girls/src/types/terrain.ts`

Added interfaces:
```typescript
interface DetailSettings {
  detailMap: string;
  detailNormalMap: string;
  tileScale: number;      // default: 0.25
  strength: number;       // default: 0.5
  fadeStart: number;      // default: 20
  fadeEnd: number;        // default: 50
}

interface MacroNoiseSettings {
  noiseMap: string;
  scale: number;          // default: 0.02
  strength: number;       // default: 0.3
}
```

Extended `TextureLayer` with optional `detail?: DetailSettings`
Extended `TerrainTextures` with optional `macroNoise?: MacroNoiseSettings`
Bumped file version to `"1.1.0"`

---

### Phase 2: Shader Updates
**Files:**
- `terrain-editor/src/shaders/glsl/terrainVertex.ts`
- `terrain-editor/src/shaders/glsl/terrainFragment.ts`
- `swing-girls/src/shaders/terrainShaders.ts`

**Vertex shader additions:**
- Added `varying float vViewDistance;`
- Calculate view distance for detail fade

**Fragment shader additions:**
- New uniforms: `uMacroNoise`, `uMacroScale`, `uMacroStrength`
- New uniforms: `uDetail0-3`, `uDetailNormal0-3`, `uDetailSettings0-3`
- Helper: `calcDetailFade(distance, fadeStart, fadeEnd)`
- Helper: `overlayBlend(base, overlay)`
- Conditional detail sampling with `#ifdef USE_DETAIL_MAPS`
- Conditional macro noise with `#ifdef USE_MACRO_NOISE`

---

### Phase 3: Material System
**Files:**
- `terrain-editor/src/shaders/TerrainMaterial.ts`
- `swing-girls/src/components/Terrain.tsx`

- Accept new texture options and settings
- Set shader defines based on available textures
- Add uniform update methods for real-time preview

---

### Phase 4: File Format & Loading
**Files:**
- `terrain-editor/src/utils/terrainFile.ts`
- `swing-girls/src/utils/terrainLoader.ts`

- Version migration: `1.0.0` -> `1.1.0`
- Parse new `detail` and `macroNoise` fields
- Fallback to defaults for missing fields (backwards compatible)

---

### Phase 5: Editor UI (terrain-editor only)
**Files:**
- `terrain-editor/src/store/textureStore.ts`
- `terrain-editor/src/components/ui/TexturePanel.tsx`

**New UI sections:**
1. Per-layer detail settings (collapsible under each layer):
   - Detail Map file picker
   - Tile Scale slider (0.1 - 2)
   - Strength slider (0 - 1)
   - Fade Start/End sliders

2. Macro Noise panel (separate section):
   - Enable toggle
   - Noise Map file picker
   - Scale slider (0.005 - 0.1)
   - Strength slider (0 - 1)

---

### Phase 6: Asset Creation
**Location:** `public/textures/` in both projects

Created:
- `noise/macro_noise.png` - Pre-baked Perlin noise (256x256 grayscale)
- `grass/fairway_detail.png` - Fairway detail texture
- `grass/rough_detail.png` - Rough detail texture
- `grass/green_detail.png` - Putting green detail
- `sand/beach_detail.png` - Sand detail texture

---

## Critical Files Summary

| File | Changes |
|------|---------|
| `terrain-editor/src/types/terrain.ts` | Add DetailSettings, MacroNoiseSettings interfaces |
| `terrain-editor/src/shaders/glsl/terrainFragment.ts` | Add detail & noise sampling logic |
| `terrain-editor/src/shaders/glsl/terrainVertex.ts` | Add vViewDistance varying |
| `terrain-editor/src/shaders/TerrainMaterial.ts` | Accept new uniforms |
| `terrain-editor/src/utils/terrainFile.ts` | Version migration, save macroNoise |
| `terrain-editor/src/store/textureStore.ts` | Detail/noise state management |
| `terrain-editor/src/components/ui/TexturePanel.tsx` | New UI panels, setDirty on changes |
| `terrain-editor/src/components/ui/FileMenu.tsx` | Save/load macroNoise, use shared hook |
| `terrain-editor/src/components/TerrainMesh.tsx` | Pass detail/noise to material |
| `terrain-editor/src/hooks/useSaveTerrain.ts` | Shared save logic for Ctrl+S and menu |
| `terrain-editor/src/App.tsx` | Use shared save hook |
| `swing-girls/src/types/terrain.ts` | Mirror type changes |
| `swing-girls/src/shaders/terrainShaders.ts` | Mirror shader changes |
| `swing-girls/src/components/Terrain.tsx` | Accept new uniforms |
| `swing-girls/src/utils/terrainLoader.ts` | Version migration, cache-busting

---

## Verification Plan

1. **Backwards compatibility test:**
   - Load existing `.terrain` file in both projects
   - Verify renders correctly without detail/noise

2. **Feature test in terrain-editor:**
   - Create new terrain
   - Configure detail maps for each layer
   - Verify real-time preview updates
   - Enable macro noise and adjust settings
   - Save file and reload - verify settings persist

3. **Runtime test in swing-girls:**
   - Load terrain with detail/noise settings
   - Move camera close to ground - verify detail visible
   - Move camera far - verify detail fades out
   - Check no visible tiling patterns at mid-distance

4. **Performance test:**
   - Profile GPU with detail maps enabled/disabled
   - Ensure no shimmering at far distances

---

## Additional Improvements

### Stochastic Tiling

After implementing detail maps and macro noise, stochastic tiling was added to further eliminate texture repetition:

- **Algorithm**: Deliot & Heitz 2019 triangular grid sampling
- **Rotation**: 90-degree steps (0, 90, 180, 270) for grass patterns
- **Blending**: Barycentric coordinates with x^4 weighting
- **Coverage**: Applied to both base textures and detail maps

### Relative Texture Paths

Texture paths in `.terrain` files are now resolved relative to the terrain file's directory, allowing better asset organization:

```
terrains/
  terrain.terrain
  textures/
    grass/fairway.png
```

---

## Status: Completed

All phases implemented and verified, including stochastic tiling and relative path support.
