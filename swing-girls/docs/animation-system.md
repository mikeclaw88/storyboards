# Swing Girls - Animation System Specification

> **DEPRECATED**: This document describes the 3D character animation system that was removed in commit `66b9a36a` (Jan 30, 2025). The game now uses video characters only. See [Video Character](./features/video-character.md) for the current character system.

## Overview (Historical)

The animation system uses **separated assets** architecture:
- **Character models**: Rigged FBX files without embedded animations
- **Animation clips**: Standalone FBX files with animation data
- **Retargeting**: Animations are applied to characters via skeleton mapping

## Asset Structure

```
public/
├── models/
│   └── characters/
│       ├── Kai.fbx          # Rigged character (no animations)
│       ├── Malia.fbx
│       └── Zara.fbx
└── animations/
    ├── Idle.fbx             # Idle loop animation
    └── Golf_Drive.fbx       # Full swing animation (one-shot)
```

### Current Animations

| Animation | File | Loop | Usage |
|-----------|------|------|-------|
| Idle | Idle.fbx | Yes | Selection mode default |
| Golf_Drive | Golf_Drive.fbx | No | Swing animation in play mode |
| Golf_Drive5 | Golf_Drive5.fbx | No | Alternative drive animation |

### Supported Formats

- **FBX**: Primary format for characters and animations
- **GLB/GLTF**: Supported for club models and assets

### Planned Animations

- Golf_Putt.fbx - Putting animation
- Walk.fbx - Walk cycle
- Celebrate.fbx - Victory pose

## Animation Retargeting

### Concept

Animation retargeting allows applying animations created for one skeleton to a different character skeleton. This enables:
- Reusing Mixamo/mocap animations across multiple characters
- Consistent animation library for all characters
- Smaller file sizes (animations not duplicated per character)

### Implementation Approach

```typescript
// 1. Load character model (rigged, no animations)
const character = useFBX('/models/characters/Kai.fbx');

// 2. Load animation separately
const idleAnim = useFBX('/animations/Idle.fbx');

// 3. Clone animation and retarget to character skeleton
const mixer = new AnimationMixer(character);
const clip = idleAnim.animations[0];
const action = mixer.clipAction(clip);
action.play();
```

### Current Implementation (Stage.tsx)

The `Character` component handles animation loading, playback, and club attachment:

```typescript
function Character({
  modelPath,
  animationPath,
  loop = true,
  stopAtTime,
  attachClub = false,
  characterId,
  animationId,
  scrubMode = false,
  scrubTime = 0,
}: Props) {
  const { getClubTransform, getClubScale, getClubModelConfig } = useMotionConfig();
  const characterOriginal = useFBX(modelPath);
  const animation = useFBX(animationPath);
  const clubFBX = useFBX(CLUB_MODEL_PATH);

  // Clone to avoid cache conflicts
  const character = useMemo(() => SkeletonUtils.clone(characterOriginal), []);

  useEffect(() => {
    const mixer = new AnimationMixer(character);
    const clip = animation.animations[0];
    const action = mixer.clipAction(clip);

    // Configure loop mode
    action.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
    if (!loop) action.clampWhenFinished = true;

    action.play();
  }, [character, animation, loop]);

  useFrame((_, delta) => {
    if (scrubMode) {
      mixer.setTime(scrubTime);
    } else {
      mixer.update(delta);
    }

    // Update club transform from keyframe interpolation
    if (club && characterId && animationId) {
      const transform = getClubTransform(characterId, animationId, currentTime);
      club.position.set(transform.position.x, transform.position.y, transform.position.z);
      club.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
    }
  });
}
```

**Key Features:**
- Uses `SkeletonUtils.clone()` to prevent cache conflicts
- Supports loop and one-shot animations
- `stopAtTime` prop allows freezing at specific frame (used for ready stance)
- **Club attachment** with keyframe-based animation
- **Scrub mode** for Golf Editor timeline control
- **Catmull-Rom interpolation** for smooth club motion

### Skeleton Compatibility

For successful retargeting, skeletons must have:
- **Matching bone names** (or name mapping required)
- **Similar hierarchy** (parent-child relationships)
- **Compatible rest poses** (T-pose recommended)

#### Standard Bone Naming (Mixamo-compatible)

```
mixamorigHips
├── mixamorigSpine
│   ├── mixamorigSpine1
│   │   └── mixamorigSpine2
│   │       ├── mixamorigNeck
│   │       │   └── mixamorigHead
│   │       ├── mixamorigLeftShoulder
│   │       │   └── mixamorigLeftArm
│   │       │       └── mixamorigLeftForeArm
│   │       │           └── mixamorigLeftHand
│   │       └── mixamorigRightShoulder
│   │           └── mixamorigRightArm
│   │               └── mixamorigRightForeArm
│   │                   └── mixamorigRightHand
├── mixamorigLeftUpLeg
│   └── mixamorigLeftLeg
│       └── mixamorigLeftFoot
│           └── mixamorigLeftToeBase
└── mixamorigRightUpLeg
    └── mixamorigRightLeg
        └── mixamorigRightFoot
            └── mixamorigRightToeBase
```

## Animation State Machine

### States

| State | Animation | Loop | Transitions To |
|-------|-----------|------|----------------|
| idle | Idle.fbx | Yes | swing, walk |
| swing | Golf_Drive.fbx | No | followthrough |
| followthrough | (end of swing) | No | idle |
| walk | Walk.fbx | Yes | idle |
| celebrate | Celebrate.fbx | No | idle |

### Transition Rules

```typescript
type AnimationState = 'idle' | 'swing' | 'walk' | 'celebrate';

interface AnimationTransition {
  from: AnimationState;
  to: AnimationState;
  duration: number; // crossfade duration in seconds
  condition?: () => boolean;
}

const transitions: AnimationTransition[] = [
  { from: 'idle', to: 'swing', duration: 0.1 },
  { from: 'swing', to: 'idle', duration: 0.3 },
  { from: 'idle', to: 'walk', duration: 0.2 },
  { from: 'walk', to: 'idle', duration: 0.2 },
  { from: 'idle', to: 'celebrate', duration: 0.2 },
  { from: 'celebrate', to: 'idle', duration: 0.3 },
];
```

## Animation Blending

### Crossfade

Smooth transitions between animations using linear crossfade:

```typescript
function crossfade(fromAction: AnimationAction, toAction: AnimationAction, duration: number) {
  fromAction.fadeOut(duration);
  toAction.reset().fadeIn(duration).play();
}
```

### Additive Blending (Future)

For layered animations (e.g., upper body swing + lower body walk):

```typescript
// Base layer: full body
const walkAction = mixer.clipAction(walkClip);
walkAction.play();

// Additive layer: upper body only
const swingAction = mixer.clipAction(swingClip);
swingAction.setEffectiveWeight(0.8);
swingAction.blendMode = THREE.AdditiveAnimationBlendMode;
swingAction.play();
```

## Animation Events

### Sync Points

Key moments in animations for game logic synchronization:

| Animation | Event | Frame | Description |
|-----------|-------|-------|-------------|
| Golf_Drive | impact | configurable | Ball contact moment (impactTime in config.json) |
| Golf_Drive | followthrough | ~80% | End of power phase |
| Golf_Putt | impact | ~50% | Ball contact |
| Celebrate | peak | ~50% | Jump/pose apex |

### Impact Time Configuration

The ball impact time is configurable per character/animation in `config.json`:

```json
{
  "characters": {
    "kai": {
      "golf_drive": {
        "keyframes": [...],
        "ball": { "position": { "x": 0, "y": 0, "z": 0 } },
        "impactTime": 1.168
      }
    }
  }
}
```

The Golf Editor (`/golf_editor.html`) provides a "Set from Timeline" button to easily set the impact time at the current scrub position.

### Implementation

```typescript
// Impact time from config (or fallback to ratio)
const impactTime = getImpactTime(characterId, animationId);
const contactTime = impactTime !== undefined
  ? impactTime
  : clip.duration * CONTACT_RATIO;

useFrame(() => {
  if (mixer.time >= contactTime && !contactFired) {
    onBallImpact();
    contactFired = true;
  }
});
```

## Club Animation System

### Overview

The golf club attached to the character's hand has its own keyframe-based animation system, separate from the character's skeletal animation.

### Golf Editor Tool

Access at `/golf_editor.html` - provides:

| Feature | Description |
|---------|-------------|
| Timeline Scrubbing | Precise frame-by-frame control |
| Keyframe Management | Add/update/delete keyframes |
| Real-time Preview | Changes sync to game instantly |
| Catmull-Rom Interpolation | Smooth curves through keyframes |
| Undo Support | Ctrl+Z with 50-state history |

### Keyframe Interpolation

Uses Catmull-Rom splines for smooth motion:

```typescript
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

Benefits:
- Continuous velocity through keyframes
- Natural, flowing motion
- No abrupt direction changes

### Configuration Hierarchy

```
1. Global defaults (config.defaults.club)
   ↓
2. Per-character defaults (config.characters[id].club)
   ↓
3. Per-animation keyframes (config.characters[id][animId].keyframes)
```

## Performance Considerations

- **Preload animations** during loading screen
- **Share animation clips** across character instances
- **Limit active mixers** (one per visible character)
- **Use LOD** for distant characters (simplified or no animation)

## File Naming Convention

```
Animation files: {ActionName}.fbx
Examples:
- Idle.fbx
- Golf_Drive.fbx
- Golf_Putt.fbx
- Golf_Chip.fbx
- Walk_Forward.fbx
- Run_Forward.fbx
- Celebrate_01.fbx
```
