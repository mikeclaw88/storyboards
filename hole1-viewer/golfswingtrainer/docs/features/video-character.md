# Video Character System

## Overview

Video characters use pre-recorded green screen videos instead of 3D models. This allows for realistic character rendering with minimal performance overhead.

## Characters

| ID | Name | Swing Video | Idle Video |
|----|------|-------------|------------|
| ksenia | Ksenia | `./videos/Ksenia.mp4` | `./videos/Ksenia_idle.mp4` |
| sandra | Sandra | `./videos/Sandra.mp4` | `./videos/Sandra_idle.mp4` |

## Configuration

Video character settings are stored in `config.json` under the `video` key:

```json
{
  "video": {
    "ksenia": {
      "url": "./videos/Ksenia.mp4",
      "offset": { "x": 0, "y": 0, "z": 0 },
      "pivot": { "x": 0.59, "y": -0.83 },
      "scale": 1.94,
      "chromaKey": {
        "color": "#00ff00",
        "threshold": 0.4,
        "smoothing": 0.1
      },
      "backswingTopTime": 1.68,
      "impactTime": 2.03
    }
  }
}
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `url` | Path to the video file |
| `offset` | Position offset (currently unused, pivot is at tee) |
| `pivot` | Local pivot point (-1 to 1, 0,0 = center) |
| `scale` | Character scale |
| `chromaKey.color` | Green screen color to remove |
| `chromaKey.threshold` | Color matching threshold |
| `chromaKey.smoothing` | Edge smoothing amount |
| `backswingTopTime` | Time in video when backswing reaches top |
| `impactTime` | Time in video when club hits ball |

## Pivot System

The pivot point defines which point on the video stays at the tee position:

- `pivot.x = 0, pivot.y = 0` - Video center at tee
- `pivot.x = 0.5` - Point 50% right of center at tee
- `pivot.y = -1` - Bottom edge at tee (feet on ground)

The pivot point is the origin for all transforms:
- **Position**: Pivot stays at tee world position
- **Scale**: Scales around pivot point
- **Rotation**: Billboard rotation around pivot point

## Billboard Effect

Video characters always face the camera (billboard effect). The pivot point stays fixed in world space while the video rotates to face the camera.

## Chroma Key Shader

The video uses a custom shader to remove the green screen background:

```glsl
float diff = length(texColor.rgb - keyColor);
float alpha = smoothstep(threshold - smoothing, threshold + smoothing, diff);
gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
```

## Editor Integration

The Character tab in `golf_editor.html` provides controls for:

1. **Video Source** - Select which video character to edit
2. **Video Pivot** - X/Y pivot point sliders
3. **Scale** - Character scale slider
4. **Chroma Key** - Color picker, threshold, smoothing
5. **Timing** - Backswing top time, impact time

Changes are broadcast to the game in real-time via BroadcastChannel.

## Implementation Files

| File | Responsibility |
|------|----------------|
| `src/components/VideoCharacter.tsx` | Video rendering with chroma key shader |
| `src/components/StageCharacter.tsx` | Character mode switching (selection/play), swing sync |
| `src/stores/gameStore.ts` | VIDEO_CHARACTERS, VIDEO_CHARACTERS_IDLE constants |
| `src/hooks/useMotionConfig.ts` | Video config loading (pivot, scale, timing) |
| `src/utils/golfShotAudio.ts` | Golf shot sound effect on impact |
| `public/golf_editor.html` | Character tab UI for editing |

## Character Components

### StageCharacter.tsx

Contains mode-specific character components:

| Component | Mode | Description |
|-----------|------|-------------|
| `SelectionCharacter` | Selection | Shows idle video loop at tee position |
| `PlayVideoCharacter` | Play | Syncs video with swing phases (pulling/swinging/finished) |
| `PlayCharacter` | Play | Wrapper that filters non-video characters |
| `DynamicCharacter` | Both | Switches between selection and play components |

### Swing Phase Sync

Video playback syncs with swing phases:

1. **Ready**: Video paused at frame 0
2. **Pulling**: Play video when `pullProgress >= 0.9`, pause at `backswingTopTime`
3. **Swinging**: Resume video, trigger ball launch at `impactTime`
4. **Finished**: Reset video to frame 0
