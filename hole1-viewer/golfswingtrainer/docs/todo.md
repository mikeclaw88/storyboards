# Todo

## Completed

- [x] Scene Management System
  - [x] Scene tab in editor (first position)
  - [x] Scene JSON schema (terrain, splat, teeBox, tee, props)
  - [x] Real-time sync via BroadcastChannel
  - [x] TransformControls gizmo for scene objects
  - [x] Tree view UI with selection

- [x] Editor Polish
  - [x] Rename Video tab to Character tab
  - [x] Remove Motion tab (no longer needed)
  - [x] Remove Club tab and club rendering
  - [x] Remove 3D character from editor
  - [x] Default scene loading (urban-golf-range.scene.json)
  - [x] Animation paused by default in Character tab

- [x] Video Character System
  - [x] Pivot point at tee position (no offset)
  - [x] Billboard rotation around pivot
  - [x] Scale around pivot
  - [x] Chroma key (green screen removal)
  - [x] Add Sandra character
  - [x] Forward offset for z-fighting fix (renders in front of tee)

- [x] Camera System
  - [x] Selection camera configurable from config.json
  - [x] Play camera configurable from config.json
  - [x] 'm' key to log camera transform values for config.json
  - [x] Camera controls locked in selection mode (Ctrl to unlock)
  - [x] Vertical rotation locked in play mode (Alt to unlock)
  - [x] Gimbal effect for smooth ball following
  - [x] Swing zoom out effect (starts at swing up)

- [x] Character Animation
  - [x] Auto-reset to first frame after swing finishes
  - [x] Video character support (3D character support removed)

- [x] Ball Physics Improvements
  - [x] Anti-tunneling (binary search collision detection)
  - [x] Terrain normal calculation for proper bounce
  - [x] Slope-aware bouncing (reflects off surface normal)
  - [x] Slope-aware rolling (gravity acceleration on slopes)
  - [x] Re-launch when rolling off edges

- [x] Terrain Rendering
  - [x] sRGB color space for proper lighting
  - [x] Proper material integration with diffuseColor
  - [x] Detail maps with distance-based fade (v1.1.0)
  - [x] Macro noise overlay for texture variation (v1.1.0)
  - [x] Stochastic tiling to eliminate texture repetition
  - [x] Relative texture path resolution

- [x] Camera System Improvements
  - [x] Azimuth rotation limits in play mode (±12 degrees)
  - [x] Ball position persistence after landing

## In Progress

- [ ] Fix 404 errors for texture/model paths in build

## Future

- [ ] Add more video characters
- [ ] Prop system (golf flags, obstacles)
- [ ] Multiple scene support (different golf holes)
