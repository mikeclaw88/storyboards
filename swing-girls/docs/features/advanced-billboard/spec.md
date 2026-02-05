# Advanced Billboard for Video Characters

## Overview

Video characters use billboard rendering (2D plane always facing camera) with chroma key removal. This works well for horizontal camera angles but breaks down when the camera views from above.

## Problem Statement

### Current Behavior (Spherical Billboard)
- Billboard always faces camera completely
- When camera looks down from above, the character appears to "lie down"
- Loses the illusion of a standing character

### Visual Issue
```
Front view:              Top-down view (current):
┌─────────┐              Character appears
│  Head   │              flat/horizontal
│  Body   │              like lying on ground
│  Feet   │
└─────────┘
```

## Requirements

### Functional Requirements

1. **Cylindrical Billboard**
   - Character must always remain vertically upright
   - Only rotate around Y-axis to face camera horizontally
   - Ignore camera's vertical angle for rotation

2. **Perspective Correction**
   - When viewed from above, apply foreshortening effect
   - Top of character (head) should appear larger (closer to camera)
   - Bottom of character (feet) should appear smaller (further from camera)
   - Creates natural depth perception

### Visual Goal
```
Front view:              Top-down view (with correction):
┌─────────┐              ┌───────────────┐  ← Head (wider, closer)
│  Head   │       →      │               │
│  Body   │              │               │
│  Feet   │              └───────────┘    ← Feet (narrower, further)
└─────────┘
```

## Technical Approach

### 1. Cylindrical Billboard

Replace spherical billboard with cylindrical:

```javascript
// Current: Spherical (copies full camera quaternion)
group.quaternion.copy(camera.quaternion);

// New: Cylindrical (Y-axis rotation only)
const cameraDir = new Vector3();
camera.getWorldDirection(cameraDir);
cameraDir.y = 0;  // Ignore vertical component
cameraDir.normalize();
const angle = Math.atan2(cameraDir.x, cameraDir.z);
group.rotation.set(0, angle + Math.PI, 0);
```

### 2. Perspective Correction

Two implementation options:

#### Option A: Vertex Deformation
Modify mesh vertices based on camera angle:
- Calculate camera's vertical angle (polar angle)
- Scale top vertices wider, bottom vertices narrower
- Creates trapezoid shape

#### Option B: Shader-based UV Correction
Use W-coordinate for perspective-correct texture mapping:
- Multiply UV by W in vertex shader
- Divide by W in fragment shader (or use `texture2DProj`)
- GPU handles perspective interpolation

### 3. Combined Approach

```
Camera Angle → Cylindrical Rotation + Perspective Ratio → Trapezoid Billboard
     ↓                    ↓                                      ↓
  Vertical           Y-axis only                         Width varies by
  component          rotation                            camera elevation
```

## Acceptance Criteria

1. Character remains upright when camera rotates vertically
2. Character faces camera horizontally at all times
3. When viewed from above (>30 degrees), top of character appears proportionally larger
4. Transition between angles is smooth (no popping)
5. Works with existing chroma key shader
6. Performance: No significant frame rate impact

## References

- [Three.js Billboard Manual](https://threejs.org/manual/en/billboards.html)
- [GLSL Billboard Shader](https://www.geeks3d.com/20140807/billboarding-vertex-shader-glsl/)
- [Perspective Correction - LÖVE2D](https://love2d.org/forums/viewtopic.php?t=92376)
- [Godot Sprite Perspective Shader](https://godotshaders.com/shader/sprite-perspective-correection/)
- [Imposter Sprites - Unreal Engine](https://docs.unrealengine.com/4.27/en-US/RenderingAndGraphics/RenderToTextureTools/3)
