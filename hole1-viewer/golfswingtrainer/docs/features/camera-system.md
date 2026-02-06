# Camera System

Golf game camera system documentation.

## Overview

The camera system manages two main screen modes with different behaviors:
- **Selection Mode**: Character selection screen
- **Play Mode**: Active gameplay with ball following

## Configuration (config.json)

Camera positions are configured in `public/config.json`:

```json
{
  "defaults": {
    "selectionCamera": {
      "position": { "x": -0.1320, "y": 1.4550, "z": -2.8766 },
      "target": { "x": -0.0985, "y": 0.9017, "z": 0.0880 }
    },
    "playCamera": {
      "position": { "x": 0.4438, "y": 1.6052, "z": -4.0364 },
      "target": { "x": 0.3575, "y": 1.1356, "z": -0.1693 },
      "polarAngle": 1.45
    }
  }
}
```

### polarAngle

Controls the camera tilt (vertical angle) in play mode:
- `1.25` = ~18 degrees looking down
- `1.45` = ~7 degrees looking down (nearly level)
- `1.57` = completely horizontal

## Screen Modes

### Selection Mode

- Camera is fixed at `selectionCamera` position/target
- Camera controls disabled by default
- **Ctrl key**: Temporarily enables camera rotation/zoom/pan
- Polar angle range: 0.2 ~ Math.PI/2.1

### Play Mode

- Camera starts at `playCamera` position/target
- Vertical rotation locked at `polarAngle` by default
- **Alt key**: Temporarily unlocks vertical rotation and pan (0.3 ~ Math.PI/2)
- When Alt is released, camera stays at the adjusted angle
- **Horizontal rotation limited**: ±12 degrees from initial aiming direction
- Zoom range: 3m ~ 10m (2m for video characters)

### Azimuth Rotation Limit

In play mode, horizontal camera rotation is restricted to prevent losing sight of the target:

| Setting | Value | Description |
|---------|-------|-------------|
| `PLAY_MODE_AZIMUTH_RANGE` | ±12 degrees | Maximum left/right rotation from initial aim |
| Center Azimuth | Dynamic | Captured when entering play mode |

When camera is following the ball, azimuth limits are removed to allow free rotation.

## Ball Following System

When the ball is flying, camera can follow it based on these conditions:

### Follow Conditions

1. Ball distance > `CAMERA_FOLLOW_THRESHOLD` (5m)
2. Time elapsed > `CAMERA_FOLLOW_DELAY` (2s)

### Follow Behavior

- OrbitControls are disabled during follow mode
- Camera uses `lookAt()` directly to keep ball centered
- When ball stops, camera returns to play position immediately

### Constants (CameraController.tsx)

| Constant | Value | Description |
|----------|-------|-------------|
| `CAMERA_FOLLOW_DELAY` | 2 | Seconds before following starts |
| `CAMERA_FOLLOW_THRESHOLD` | 5 | Minimum distance (meters) to trigger follow |
| `CAMERA_FOLLOW_SPEED` | 3 | Camera lerp speed (lower = smoother) |
| `BALL_TRACKING_SPEED` | 8 | Ball position smoothing speed |
| `CAMERA_RETURN_DELAY` | 2 | Seconds to wait at stopped ball before returning |

### Dynamic Camera Offset (Bird's Eye View)

Camera follows ball from above, looking down. Offset changes based on ball height:

| Ball Height | Offset | Description |
|-------------|--------|-------------|
| >= 15m (high) | (0, 30, -30) | 30m above, 30m behind |
| <= 2m (low) | (0, 3, -3) | 3m above, 3m behind |

Offset interpolates linearly between these values.

### Gimbal Effect

For stable footage-like camera movement:

1. **Ball Position Smoothing**: `smoothedBallPos.lerp(ballPos, delta * BALL_TRACKING_SPEED)`
2. **Camera Position Smoothing**: `smoothedCameraPos.lerp(desiredPos, delta * CAMERA_FOLLOW_SPEED)`
3. **Direct LookAt**: `camera.lookAt(smoothedBallPos)` keeps ball centered

## Ball Trail

The golf ball displays a trail while flying:
- Uses `@react-three/drei` Trail component
- `depthWrite={false}` prevents z-fighting with ground

## Camera State Machine

```
                    +----------------+
                    | Selection Mode |
                    +-------+--------+
                            |
                    [Enter Play Mode]
                            v
                    +----------------+
                    |   Play Mode    |
                    | (Fixed Camera) |
                    +-------+--------+
                            |
              [Ball Flying + Distance + Delay]
                            v
                    +----------------+
                    | Following Ball |
                    | (OrbitControls |
                    |   disabled)    |
                    +-------+--------+
                            |
                    [Ball Stopped]
                            v
                    +----------------+
                    | Waiting State  |
                    | (2s at stopped |
                    |    ball)       |
                    +-------+--------+
                            |
                    [Delay Elapsed]
                            v
                    +----------------+
                    |   Play Mode    |
                    | (Return to tee)|
                    +----------------+
```

## Key Controls Summary

| Key | Mode | Action |
|-----|------|--------|
| Alt | Play | Unlock vertical rotation and pan |
| Ctrl | Selection | Enable camera controls |
| Drag | Play | Horizontal rotation (limited to +/-12 degrees) |

## Files

| File | Responsibility |
|------|----------------|
| `src/components/CameraController.tsx` | Camera follow logic, mode switching, gimbal effect |
| `src/scenes/Stage.tsx` | OrbitControls setup, polar/azimuth angle limits |
| `src/hooks/useMotionConfig.ts` | Config loading (getSelectionCamera, getPlayCamera) |
| `public/config.json` | Camera position/target/polarAngle configuration |
| `src/components/GolfBall.tsx` | Ball trail rendering |
