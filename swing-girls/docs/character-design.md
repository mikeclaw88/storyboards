# Swing Girls - Character Design Guide

## Art Style

### Visual Direction
- **Style:** Stylized anime-inspired 3D
- **Proportions:** Semi-realistic with slightly exaggerated features
- **Color Palette:** Bright, vibrant colors with soft shading
- **Mood:** Cheerful, energetic, approachable

### Character Specifications
- **Polygon Count:** 5,000 - 15,000 tris per character
- **Texture Resolution:** 1024x1024 (diffuse, normal, emission)
- **Rig:** Humanoid rig compatible with Mixamo animations
- **Format:** FBX (rigged model only, no embedded animations)
- **Animations:** Loaded separately from `/animations/` folder (retargeted at runtime)

## Current Characters

### 1. Kai
- **Status:** Implemented
- **File:** `/models/characters/Kai.fbx`

### 2. Malia
- **Status:** Implemented
- **File:** `/models/characters/Malia.fbx`

### 3. Zara
- **Status:** Implemented
- **File:** `/models/characters/Zara.fbx`

## Planned Characters (Future)

### Hana (Beginner Trainer)
- **Role:** Tutorial guide, basics instructor
- **Personality:** Cheerful, patient, encouraging
- **Specialty:** Fundamentals and putting
- **Visual:** Bright outfit, ponytail, approachable smile
- **Color Theme:** Pink/White

### Yuki (Intermediate Trainer)
- **Role:** Advanced techniques instructor
- **Personality:** Cool, analytical, precise
- **Specialty:** Iron play and course strategy
- **Visual:** Sporty attire, short hair, focused expression
- **Color Theme:** Blue/Silver

### Sakura (Pro Trainer)
- **Role:** Master-level instructor
- **Personality:** Confident, elegant, inspiring
- **Specialty:** Driving and competition mindset
- **Visual:** Premium golf wear, flowing hair, graceful poses
- **Color Theme:** Red/Gold

## Animation Requirements

### Core Animations
- Idle (breathing, weight shift)
- Walk/Run cycles
- Golf swing (full, chip, putt)
- Celebration poses
- Instruction gestures
- Reactions (happy, thinking, encouraging)

### Facial Expressions
- Neutral
- Happy/Smile
- Thinking/Focused
- Surprised
- Encouraging nod

## 3D Model Pipeline

### Character Model (Rigged, No Animation)

1. **Concept Art** - 2D character design sheets
2. **Modeling** - Base mesh in Blender/Maya
3. **Rigging** - Humanoid skeleton (Mixamo-compatible bone names)
4. **Texturing** - PBR textures (Substance Painter)
5. **Export** - FBX format (rig + mesh only, no animation)
6. **Integration** - Load via `useFBX` in React Three Fiber

### Animation Files (Separate)

1. **Source** - Mixamo or custom mocap
2. **Retarget** - Ensure bone name compatibility
3. **Export** - FBX format (animation only, or with placeholder mesh)
4. **Integration** - Load and apply via `AnimationMixer`

## Asset Structure

```
public/
├── models/
│   └── characters/
│       ├── Kai.fbx           # Rigged character
│       ├── Malia.fbx         # Rigged character
│       └── Zara.fbx          # Rigged character
└── animations/
    ├── Idle.fbx              # Idle loop
    └── Golf_Drive.fbx        # Full swing (one-shot)
```

### Dynamic Asset Discovery

Characters and animations are discovered automatically at build time using Vite's `import.meta.glob`:

```typescript
// Scans /public/models/characters/*.fbx
const characterFiles = import.meta.glob('/public/models/characters/*.fbx');

// Scans /public/animations/*.fbx
const animationFiles = import.meta.glob('/public/animations/*.fbx');
```

To add new characters/animations, simply add FBX files to the appropriate folder.

## Asset Naming Convention

```
# Character models
{CharacterName}.fbx
Examples: Kai.fbx, Hana.fbx, Yuki.fbx

# Animation files
{ActionName}.fbx
Examples: Idle.fbx, Golf_Drive.fbx, Walk.fbx
```

## Skeleton Requirements

For animation retargeting to work, characters must use **Mixamo-compatible bone names**:

| Bone | Name |
|------|------|
| Root | mixamorigHips |
| Spine | mixamorigSpine, mixamorigSpine1, mixamorigSpine2 |
| Arms | mixamorigLeftArm, mixamorigLeftForeArm, mixamorigLeftHand |
| Legs | mixamorigLeftUpLeg, mixamorigLeftLeg, mixamorigLeftFoot |
| Head | mixamorigNeck, mixamorigHead |

See [Animation System](./animation-system.md) for full bone hierarchy.
