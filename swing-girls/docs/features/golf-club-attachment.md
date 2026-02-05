# Golf Club Attachment System

> **DEPRECATED**: This document describes the 3D character club attachment system that was removed in commit `66b9a36a` (Jan 30, 2025). The game now uses video characters only. See [Video Character](./video-character.md) for the current character system.

## Overview (Historical)

Attach a golf club to the character's hand bone with keyframe-based animation. Includes a comprehensive Golf Editor for real-time configuration.

## Architecture

### Bone Attachment

Characters use Mixamo-compatible skeletons with standard bone naming:

```
mixamorigHips
├── mixamorigSpine
│   └── ...
│       └── mixamorigRightShoulder
│           └── mixamorigRightArm
│               └── mixamorigRightForeArm
│                   └── mixamorigRightHand  <- Attachment point
```

### Component Structure

```
src/
├── components/
│   └── GolfClub.tsx           # Club mesh component (FBX loader)
├── config/
│   └── motionConfig.ts        # Types, defaults, interpolation
├── hooks/
│   └── useMotionConfig.ts     # BroadcastChannel listener hook
├── scenes/
│   └── Stage.tsx              # Integration point
public/
├── config.json                # Persisted configuration
├── golf_editor.html           # Golf/Club Editor UI
└── models/clubs/
    ├── ironclub5.fbx          # Iron club FBX model
    └── driver.glb             # Driver club GLB model
```

## Supported Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| FBX | .fbx | Primary format for clubs |
| GLB | .glb | Alternative format (driver, etc.) |

## Configuration System

### Config Structure (`public/config.json`)

```json
{
  "clubs": {
    "ironclub5": {
      "pivot": { "x": 0, "y": 0, "z": 0 },
      "scale": 1,
      "rotation": { "x": 0, "y": 0, "z": 0 }
    }
  },
  "defaults": {
    "club": {
      "position": { "x": 0, "y": 0.05, "z": 0 },
      "rotation": { "x": -1.5708, "y": -1.5708, "z": -1.5708 },
      "scale": 1
    },
    "ball": {
      "position": { "x": -0.5, "y": 0.02, "z": 0.3 }
    }
  },
  "characters": {
    "kai": {
      "club": { ... },
      "golf_drive": {
        "keyframes": [
          { "time": 0.0, "position": {...}, "rotation": {...} },
          { "time": 0.5, "position": {...}, "rotation": {...} }
        ],
        "ball": { "position": {...} }
      }
    }
  }
}
```

### Keyframe System

Each animation can have keyframes that override the character's club default:

| Field | Type | Description |
|-------|------|-------------|
| time | number | Time in seconds |
| position | Vector3 | Local position (meters) |
| rotation | Vector3 | Local rotation (radians) |

### Interpolation

Keyframes use **Catmull-Rom spline interpolation** for smooth curves:

```typescript
// Uses 4 keyframes for smooth curve through all points
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}
```

This provides:
- Continuous velocity through keyframes
- Natural, flowing motion
- No abrupt direction changes

## Golf Editor

Access at `/golf_editor.html` while running the dev server.

### Features

| Feature | Description |
|---------|-------------|
| **Dual Mode** | Golf Editor + Club Editor tabs |
| **Timeline Scrubbing** | Drag timeline or use keyboard shortcuts |
| **Keyframe Management** | Add, update, delete keyframes |
| **Real-time Preview** | Changes broadcast to game instantly |
| **Direct Value Input** | Click values to type precise numbers |
| **Fine Adjustment** | +/- buttons for 0.001 precision |
| **Undo Support** | Ctrl+Z to undo (50 history states) |
| **Persistence** | Saves to localStorage, export to JSON |
| **Custom Camera Zoom** | Zoom along view direction |
| **Orbit Target Lock** | Camera orbit locks to hand bone position |
| **GLB Support** | Load GLB format club models |
| **Multiple Animations** | Switch between Golf_Drive, Golf_Drive5, etc. |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause animation |
| Left/Right | Step frame by frame |
| Home/End | Skip to start/end |
| Ctrl+Z | Undo last change |

### Club Editor

Configure club model properties (applies to all characters):

| Setting | Description |
|---------|-------------|
| Pivot Point | Offset for rotation center |
| Rotation | Model orientation (degrees) |
| Scale | Model size multiplier |

## Implementation

### Loading FBX Club Model

```typescript
export function createGolfClubFromFBX(
  fbx: THREE.Group,
  modelConfig?: ClubModelConfig
): THREE.Group {
  const club = new THREE.Group();
  const modelContainer = new THREE.Group();

  const cloned = fbx.clone();

  // Apply club model config
  if (modelConfig) {
    cloned.position.set(-modelConfig.pivot.x, -modelConfig.pivot.y, -modelConfig.pivot.z);
    cloned.rotation.set(modelConfig.rotation.x, modelConfig.rotation.y, modelConfig.rotation.z);
    cloned.scale.setScalar(modelConfig.scale);
  }

  modelContainer.add(cloned);
  club.add(modelContainer);
  return club;
}
```

### Using Motion Config Hook

```typescript
function Character({ characterId, animationId }) {
  const { getClubTransform, getClubScale, getClubModelConfig } = useMotionConfig();

  useFrame(() => {
    const transform = getClubTransform(characterId, animationId, currentTime);
    const scale = getClubScale(characterId);

    club.position.set(transform.position.x, transform.position.y, transform.position.z);
    club.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
    club.scale.setScalar(scale);
  });
}
```

## Hierarchy

The club has a layered hierarchy for separate control:

```
club (outer group) - Golf editor transform (position, rotation, scale)
└── modelContainer - Club model settings (pivot, rotation, scale)
    └── cloned FBX - The actual club mesh
```

## Debug Visualization

The golf editor shows:
- **Hand bone coordinate system** - RGB axes (X=red, Y=green, Z=blue)
- **Grip handle** - Green sphere for position dragging
- **Head handle** - Blue sphere for rotation dragging

## Default Values

| Parameter | Value | Description |
|-----------|-------|-------------|
| position.x | 0 | Lateral offset |
| position.y | 0.05 | Up offset |
| position.z | 0 | Forward offset |
| rotation.x | -90 deg | Pitch |
| rotation.y | -90 deg | Yaw |
| rotation.z | -90 deg | Roll |
| scale | 1 | Size multiplier |
