# Scene Props System

## Overview

Scene props are GLB/GLTF models that can be placed in the scene via the Golf Editor. They are used for environmental objects like trees, rocks, buildings, and other decorations.

## Configuration

Props are stored in the `scene.json` file under the `props` array:

```json
{
  "props": [
    {
      "id": "tree_001",
      "name": "Palm Tree",
      "type": "mesh",
      "url": "./assets/trees/palm.glb",
      "position": { "x": 10, "y": 0, "z": 15 },
      "rotation": { "x": 0, "y": 45, "z": 0 },
      "scale": { "x": 1, "y": 1, "z": 1 },
      "visible": true
    }
  ]
}
```

### PropNode Interface

```typescript
interface PropNode {
  id: string;           // Unique identifier
  name: string;         // Display name in editor
  type: 'mesh';         // Currently only mesh type supported
  url: string;          // Path to GLB/GLTF file
  position: Vector3;    // World position
  rotation: Vector3;    // Rotation in degrees (X, Y, Z)
  scale: Vector3;       // Scale (uniform or non-uniform)
  visible: boolean;     // Visibility toggle
}
```

## Implementation Files

| File | Responsibility |
|------|----------------|
| `src/components/SceneProp.tsx` | Prop rendering with GLB/GLTF loading |
| `src/types/scene.ts` | PropNode type definition |
| `src/hooks/useSceneConfig.ts` | Props loading via `getProps()` |
| `src/scenes/Stage.tsx` | Props rendering via `<SceneProps>` |

## Components

### SceneProp

Renders a single prop from a PropNode configuration:

```tsx
import { SceneProp } from '../components/SceneProp';

<SceneProp prop={propNode} />
```

Features:
- Suspense wrapper for async GLB loading
- Wireframe box fallback while loading
- Shadow casting and receiving enabled
- Visibility toggle support

### SceneProps

Renders multiple props from an array:

```tsx
import { SceneProps } from '../components/SceneProp';

const { getProps } = useSceneConfig();
const props = getProps();

<SceneProps props={props} />
```

## Golf Editor Integration

The Scene tab in `golf_editor.html` provides:

1. **Asset Library** - Browse available assets (terrain, splats, meshes)
2. **Prop List** - View and select existing props
3. **Transform Controls** - Position, rotation, scale sliders
4. **Add/Remove Props** - Create new props from asset library

### Asset Library

The asset library organizes available files by type:

| Type | Extensions | Location |
|------|------------|----------|
| Terrain | `.terrain` | `/terrains/` |
| Splat | `.ply` | `/splats/` |
| Mesh | `.glb`, `.gltf` | `/models/`, `/assets/` |

### Adding a Prop

1. Click "Add Prop" in the Props panel
2. Select a mesh from the Asset Library
3. The prop is added at position (0, 0, 0)
4. Adjust position, rotation, scale as needed

### Real-time Updates

Changes are broadcast to the game via BroadcastChannel:

```typescript
// Golf Editor sends
channel.postMessage({
  type: 'scene',
  scene: updatedSceneConfig
});

// Game receives via useSceneConfig hook
const { getProps } = useSceneConfig();
```

## Rendering

Props use Three.js GLTFLoader via `@react-three/drei`'s `useGLTF` hook:

1. **Model Loading**: GLB/GLTF files are loaded and cached
2. **Scene Cloning**: Models are cloned to avoid sharing issues
3. **Shadow Setup**: All meshes get `castShadow` and `receiveShadow` enabled
4. **Transform Application**: Position (meters), rotation (degrees), scale applied

## Best Practices

### File Organization

```
public/
  assets/
    trees/
      palm.glb
      oak.glb
    rocks/
      boulder.glb
    buildings/
      clubhouse.glb
```

### Performance Tips

- Use LOD (Level of Detail) for distant props
- Combine small props into single GLB files
- Optimize textures (compress, appropriate resolution)
- Use instancing for repeated objects (trees, rocks)

### Prop Guidelines

| Guideline | Description |
|-----------|-------------|
| Origin | Place at bottom center (feet on ground) |
| Scale | 1 unit = 1 meter |
| Up Axis | Y-up |
| Textures | Embed or use relative paths |
