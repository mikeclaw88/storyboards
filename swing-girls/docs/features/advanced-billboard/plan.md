# Advanced Billboard Implementation Plan

## Phase 1: Cylindrical Billboard

### Files to Modify
- `src/components/VideoCharacter.tsx`
- `public/golf_editor.html` (video billboard section)

### Implementation

Replace current spherical billboard:

```typescript
// Current (VideoCharacter.tsx useFrame)
groupRef.current.quaternion.copy(camera.quaternion);
```

With cylindrical billboard:

```typescript
// New: Cylindrical billboard (Y-axis only)
useFrame(() => {
  if (!groupRef.current) return;

  const cameraDirection = new Vector3();
  camera.getWorldDirection(cameraDirection);

  // Project to horizontal plane (ignore Y)
  cameraDirection.y = 0;
  cameraDirection.normalize();

  // Calculate rotation angle around Y-axis
  const angle = Math.atan2(cameraDirection.x, cameraDirection.z);

  // Apply rotation (add PI to face toward camera)
  groupRef.current.rotation.set(0, angle + Math.PI, 0);
});
```

### Testing
- Verify character stays upright when camera orbits vertically
- Verify character faces camera when orbiting horizontally

---

## Phase 2: Perspective Correction

### Approach: Vertex Deformation

Modify PlaneGeometry vertices based on camera elevation angle.

### Implementation

```typescript
// In VideoCharacter.tsx useFrame
useFrame(() => {
  if (!groupRef.current || !meshRef.current) return;

  // Get camera elevation angle
  const cameraDirection = new Vector3();
  camera.getWorldDirection(cameraDirection);
  const elevationAngle = Math.asin(-cameraDirection.y); // 0 = horizontal, PI/2 = top-down

  // Calculate perspective ratio (0 at horizontal, max at top-down)
  const maxPerspective = 0.3; // 30% max distortion
  const perspectiveRatio = Math.abs(elevationAngle / (Math.PI / 2)) * maxPerspective;

  // Get geometry and modify vertices
  const geometry = meshRef.current.geometry;
  const positions = geometry.attributes.position;

  // PlaneGeometry vertices: 0,1 = top-left/right, 2,3 = bottom-left/right
  const topScale = 1 + perspectiveRatio;
  const bottomScale = 1 - perspectiveRatio;

  // Assuming standard PlaneGeometry vertex order
  // Top vertices (y > 0): scale X by topScale
  // Bottom vertices (y < 0): scale X by bottomScale

  // ... vertex manipulation code

  positions.needsUpdate = true;
});
```

### Alternative: Shader-based Approach

If vertex deformation causes issues, use shader:

```glsl
// Vertex Shader
uniform float perspectiveAmount;
varying vec3 vUvW;

void main() {
  // Calculate W based on vertex Y position
  float w = 1.0 + (position.y * perspectiveAmount);
  vUvW = vec3(uv * w, w);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
varying vec3 vUvW;
uniform sampler2D videoTexture;

void main() {
  vec2 correctedUV = vUvW.xy / vUvW.z;
  vec4 color = texture2D(videoTexture, correctedUV);
  gl_FragColor = color;
}
```

---

## Phase 3: Integration with Chroma Key

### Current Chroma Key Shader

```glsl
uniform sampler2D videoTexture;
uniform vec3 keyColor;
uniform float threshold;
uniform float smoothing;
varying vec2 vUv;

void main() {
  vec4 texColor = texture2D(videoTexture, vUv);
  float diff = length(texColor.rgb - keyColor);
  float alpha = smoothstep(threshold - smoothing, threshold + smoothing, diff);
  gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
}
```

### Combined Shader (Chroma Key + Perspective)

```glsl
uniform sampler2D videoTexture;
uniform vec3 keyColor;
uniform float threshold;
uniform float smoothing;
uniform float perspectiveAmount;
varying vec3 vUvW;

void main() {
  // Perspective-corrected UV
  vec2 correctedUV = vUvW.xy / vUvW.z;

  // Sample texture
  vec4 texColor = texture2D(videoTexture, correctedUV);

  // Chroma key
  float diff = length(texColor.rgb - keyColor);
  float alpha = smoothstep(threshold - smoothing, threshold + smoothing, diff);

  gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
}
```

---

## Task Breakdown

### Task 1: Cylindrical Billboard
- [ ] Modify `VideoCharacter.tsx` useFrame for Y-axis only rotation
- [ ] Update `golf_editor.html` video billboard
- [ ] Test with various camera angles

### Task 2: Perspective Correction
- [ ] Calculate camera elevation angle
- [ ] Implement vertex deformation or shader approach
- [ ] Add `perspectiveAmount` uniform to shader

### Task 3: Shader Integration
- [ ] Merge perspective correction with chroma key shader
- [ ] Add vUvW varying for perspective-correct UV
- [ ] Test combined effect

### Task 4: Golf Editor Support
- [ ] Add perspective preview toggle
- [ ] Sync settings with game via BroadcastChannel

### Task 5: Configuration
- [ ] Add perspective settings to VideoCharacterConfig
- [ ] Save/load from config.json
- [ ] Default values for different camera modes

---

## Configuration Schema

```typescript
interface VideoCharacterConfig {
  url: string;
  offset: Vector3;
  pivot: { x: number; y: number };
  scale: number;
  chromaKey: {
    color: string;
    threshold: number;
    smoothing: number;
  };
  // New fields
  billboard: {
    mode: 'spherical' | 'cylindrical';  // default: 'cylindrical'
    perspectiveCorrection: boolean;      // default: true
    maxPerspective: number;              // default: 0.3 (30%)
  };
  impactTime?: number;
  backswingTopTime?: number;
}
```

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| UV distortion artifacts at edges | Clamp UV coordinates, add small margin |
| Performance impact from per-frame vertex updates | Use shader approach instead |
| Visual popping during angle transitions | Smooth interpolation of perspective ratio |
| Incompatibility with existing pivot system | Test pivot + perspective combination |

---

## Future Enhancements

1. **Multi-angle Imposters**: Pre-render 8-16 direction sprites for more accurate representation
2. **Dynamic LOD**: Switch between full 3D, billboard, and imposter based on distance
3. **Shadow projection**: Fake shadow that accounts for character orientation
