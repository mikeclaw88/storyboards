# Swing Girls - Technical Architecture

## Tech Stack

### Core Framework
- **React 18+** - UI framework and component architecture
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server

### 3D Graphics
- **Three.js** - WebGL 3D rendering engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers and abstractions

### UI/Styling
- **Tailwind CSS** - Utility-first CSS framework

### State Management
- **Zustand** - Lightweight state management

### Real-time Configuration
- **BroadcastChannel API** - Cross-tab communication for config updates from Golf Editor
- **config.json** - Single source of truth for all configuration (no localStorage)

## Project Structure

```
swing-girls/
├── public/
│   ├── models/
│   │   └── teebox/               # Tee box model
│   │       └── Teebox.glb
│   ├── videos/                   # Video characters (green screen)
│   │   ├── Ksenia.mp4            # Ksenia golf swing
│   │   ├── Ksenia_idle.mp4       # Ksenia idle loop
│   │   ├── Sandra.mp4            # Sandra golf swing
│   │   └── Sandra_idle.mp4       # Sandra idle loop
│   ├── terrains/                 # Terrain files
│   │   └── terrain.terrain       # Golf course terrain
│   ├── splats/                   # Gaussian splat files
│   │   └── Urban-Golf-Range.ply  # Background splat
│   ├── scenes/                   # Scene configuration files
│   │   └── urban-golf-range.scene.json
│   ├── config.json               # Video character configuration
│   └── golf_editor.html          # Scene/character/terrain/splat editor
├── src/
│   ├── components/               # React 3D/UI components
│   │   ├── CameraController.tsx  # Camera follow logic (ball tracking, mode switching)
│   │   ├── GolfBall.tsx          # Ball with flight/bounce/roll physics
│   │   ├── GolfTee.tsx           # Golf tee mesh (LatheGeometry)
│   │   ├── StageCharacter.tsx    # Character components (selection/play modes)
│   │   ├── StageGolfObjects.tsx  # Dynamic golf tee and ball components
│   │   ├── TeeBox.tsx            # 3D tee box model
│   │   ├── Terrain.tsx           # Terrain mesh from .terrain files
│   │   ├── Splat.tsx             # Gaussian splat renderer
│   │   ├── VideoCharacter.tsx    # Video character with chroma key
│   │   ├── SelectionPanel.tsx    # Character selector
│   │   ├── SwingButton.tsx       # Gesture-based swing control
│   │   └── SwingResult.tsx       # Score display overlay
│   ├── config/
│   │   ├── golf.ts               # Golf config types and defaults
│   │   ├── motionConfig.ts       # Motion config types and interpolation
│   │   └── sceneConfig.ts        # Scene config types and defaults
│   ├── scenes/
│   │   └── Stage.tsx             # 3D stage composition (lighting/environment)
│   ├── hooks/
│   │   ├── useBroadcastChannel.ts # Shared BroadcastChannel subscription hook
│   │   ├── useGolfConfig.ts      # Golf config loading
│   │   ├── useMotionConfig.ts    # Motion config loading
│   │   └── useSceneConfig.ts     # Scene config loading
│   ├── stores/
│   │   ├── gameStore.ts          # Zustand store (state + asset discovery)
│   │   └── terrainStore.ts       # Terrain state for physics queries
│   ├── utils/
│   │   ├── ballPhysics.ts        # Projectile physics calculations
│   │   ├── golfShotAudio.ts      # Golf shot sound effect (Web Audio API)
│   │   └── terrainLoader.ts      # Terrain file loading and parsing
│   ├── App.tsx                   # Main app with screen mode routing
│   └── main.tsx                  # Entry point
├── docs/                         # Documentation
│   ├── features/
│   │   ├── camera-system.md
│   │   ├── golf-ball-physics.md
│   │   ├── scene-props.md
│   │   ├── terrain-system.md
│   │   └── video-character.md
│   ├── character-design.md
│   ├── game-design.md
│   ├── gameplay.md
│   └── tech-stack.md
└── package.json
```

## Character System

Uses **video characters** approach:

1. **Green screen videos** - Pre-recorded swing/idle MP4 videos
2. **Chroma key shader** - Real-time green screen removal
3. **Billboard rendering** - Characters always face the camera

See [Video Character](./features/video-character.md) for detailed specification.

## Configuration System

Configuration is managed via `config.json`, `scene.json`, and the Golf Editor (`golf_editor.html`):

```
config.json (motion/video config)
    │
    ├─ Game loads on startup via fetch()
    │
    └─ golf_editor.html (for editing)
           │
           └─ BroadcastChannel('swing-girls-motion-config')
                  │
                  └─ useMotionConfig() hook receives real-time updates

scene.json (scene config)
    │
    ├─ Game loads from ./scenes/*.scene.json
    │
    └─ golf_editor.html Scene tab (for editing)
           │
           └─ BroadcastChannel('swing-girls-scene-config')
                  │
                  └─ useSceneConfig() hook receives real-time updates
```

### Golf Editor Tabs

1. **Scene** - Scene elements (terrain, splat, tee box, props)
2. **Character** - Video character settings (pivot, scale, timing, chroma key)
3. **Terrain** - Terrain position and visibility
4. **Splat** - Gaussian splat position, rotation, scale

**Video Character Configuration:**
- Video pivot point (local coordinates, 0,0 = center)
- Scale
- Chroma key settings (color, threshold, smoothing)
- Timing (backswingTopTime, impactTime)

**Scene Configuration:**
- Terrain (url, position, rotation, scale, visible)
- Splat (url, position, rotation, scale, visible)
- Tee Box (url, position, rotation, scale, visible)
- Tee (position relative to tee box)
- Props (dynamic list of GLB models)

**Terrain Configuration:**
- Terrain file URL
- World position offset
- Visibility toggle
- Height scale (read from `.terrain` file, not configurable in config.json)

## Hooks Architecture

### useBroadcastChannel

Shared hook for BroadcastChannel subscriptions used by all config hooks:

```typescript
useBroadcastChannel<T>({
  channelName: string,      // Channel name to subscribe
  messageType: string,      // Expected message type (e.g., 'scene', 'motion', 'golf')
  payloadKey: string,       // Key in event.data containing payload
  onMessage: (payload: T) => void,  // Callback when valid message received
  validator?: (payload: unknown) => payload is T  // Optional type guard
});
```

### Config Hooks

| Hook | Channel | Purpose |
|------|---------|---------|
| `useSceneConfig` | `swing-girls-scene-config` | Scene elements (terrain, splat, teeBox, props) |
| `useMotionConfig` | `swing-girls-motion-config` | Character motion, camera positions, video config |
| `useGolfConfig` | `swing-girls-golf-config` | Golf game settings |

All hooks:
1. Load initial config from JSON file on mount
2. Subscribe to BroadcastChannel for real-time updates from golf_editor.html
3. Use `useBroadcastChannel` hook to avoid duplicate channel setup code

## Camera System

### Configuration (config.json)
```json
{
  "defaults": {
    "selectionCamera": {
      "position": { "x": 0.0789, "y": 1.9303, "z": -2.8023 },
      "target": { "x": -0.0560, "y": 1.5018, "z": 0.1801 }
    },
    "playCamera": {
      "position": { "x": 0.6032, "y": 1.7462, "z": -2.9766 },
      "target": { "x": 0.5719, "y": 1.3670, "z": -0.1377 }
    }
  }
}
```

### Camera Modes
- **Selection Mode**: Fixed camera, controls disabled (Ctrl to temporarily enable)
- **Play Mode**: Fixed vertical angle, horizontal rotation enabled (Alt to unlock vertical)
- **Ball Following**: Gimbal-smoothed camera with 2-layer interpolation

### Keyboard Shortcuts
| Key | Mode | Function |
|-----|------|----------|
| `Ctrl` | Selection | Enable camera controls temporarily |
| `Alt` | Play | Unlock vertical camera rotation |

## Ball Physics

### Collision Algorithm
- **Anti-tunneling**: Binary search to find exact collision point
- **Terrain Normal**: Finite difference calculation for surface normal
- **Bounce**: Velocity reflection off surface normal with restitution
- **Rolling**: Slope-aware with gravity acceleration

### Physics Constants
- Gravity: 9.81 m/s²
- Bounce coefficient: 0.38
- Rolling friction: 1.5
- Min bounce velocity: 1.5 m/s

## Debug Tools

- **GizmoHelper** - Axes indicator (top-left corner)
- **AxesHelper on club** - Local coordinate visualization
- **golf_editor.html** - Real-time parameter tuning for scene, character, terrain, splat

## Performance Considerations

- Use instancing for repeated objects (grass, trees)
- LOD (Level of Detail) for distant objects
- Texture atlasing for UI elements
- Object pooling for physics objects
- Progressive loading for assets

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with WebGL2 support
