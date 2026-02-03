# Golf Ball Physics System

## Overview

Simulate golf ball flight using projectile physics. Ball launches when club hits it during swing animation, flies in a realistic arc, and lands on the ground. Ball position is configurable via `config.html`.

## Architecture

### Component Structure

```
src/
├── components/
│   └── GolfBall.tsx       # Ball rendering + physics
├── config/
│   └── golf.ts            # Config constants (ball position)
├── hooks/
│   └── useGolfConfig.ts   # Config hook
├── utils/
│   └── ballPhysics.ts     # Physics calculations
├── stores/
│   └── gameStore.ts       # Ball state management
└── scenes/
    └── Stage.tsx          # Integration
```

### State Flow

```
ready -> pulling -> swinging -> [contact] -> flying -> landed -> finished
                                    |
                            Ball launches here
```

## Physics Model

### Projectile Motion

Simple physics without external engine:

```typescript
// Position at time t
x(t) = x0 + vx * t
y(t) = y0 + vy * t - 0.5 * g * t^2
z(t) = z0 + vz * t

// Where:
// - (x0, y0, z0) = initial position (from config)
// - (vx, vy, vz) = initial velocity
// - g = 9.81 m/s^2 (gravity)
// - t = elapsed time
```

### Launch Parameters

Derived from swing result (power and accuracy):

| Parameter | Formula | Range |
|-----------|---------|-------|
| Speed | `20 + (power / 100) * 60` | 20-80 m/s |
| Launch Angle | `45 - (power / 100) * 10` | 35-45 degrees |
| Deviation | `(1 - accuracy/100) * 30` | 0-30 degrees |

```typescript
export function calculateInitialVelocity(
  power: number,
  accuracy: number
): [number, number, number] {
  const speed = MIN_VELOCITY + (power / 100) * (MAX_VELOCITY - MIN_VELOCITY);
  const launchAngleDeg = MAX_LAUNCH_ANGLE - (power / 100) * (MAX_LAUNCH_ANGLE - MIN_LAUNCH_ANGLE);
  const launchAngleRad = (launchAngleDeg * Math.PI) / 180;

  // Horizontal deviation based on accuracy
  const maxDeviationDeg = 30;
  const deviationDeg = ((100 - accuracy) / 100) * maxDeviationDeg * (Math.random() > 0.5 ? 1 : -1);
  const deviationRad = (deviationDeg * Math.PI) / 180;

  const horizontalSpeed = speed * Math.cos(launchAngleRad);
  const vx = -horizontalSpeed * Math.cos(deviationRad); // -X = forward direction
  const vz = horizontalSpeed * Math.sin(deviationRad);  // Lateral deviation
  const vy = speed * Math.sin(launchAngleRad);          // Up

  return [vx, vy, vz];
}
```

## Animation Synchronization

### Contact Frame Detection

Ball launches at ~65% through Golf_Drive animation (club impact moment):

```typescript
const CONTACT_RATIO = 0.65;

useFrame(() => {
  if (mixer && !contactTriggered) {
    const duration = clip.duration;
    const contactTime = duration * CONTACT_RATIO;

    if (mixer.time >= contactTime) {
      contactTriggered = true;
      onContact(); // Trigger ball launch
    }
  }
});
```

## Configuration System

### Ball Position from Config

Ball start position is configurable via `config.html`:

```typescript
// In GolfBall.tsx
export function GolfBall({ ballConfig }: GolfBallProps) {
  const startPosition = useMemo<[number, number, number]>(() => [
    ballConfig.position.x,
    ballConfig.position.y,
    ballConfig.position.z,
  ], [ballConfig]);

  // Use startPosition for initial placement and physics
}
```

### Default Ball Position

```typescript
// In config/golf.ts
ball: {
  position: { x: -0.5, y: 0.02, z: 0.3 },
}
```

- **X**: -0.5 (in front of player, -X direction)
- **Y**: 0.02 (ball radius above ground)
- **Z**: 0.3 (slightly to the side)

## State Management

### Ball State Interface

```typescript
interface BallState {
  isVisible: boolean;
  isFlying: boolean;
  position: [number, number, number];
  distanceTraveled: number;
}
```

### Actions

```typescript
// Ball actions in gameStore
launchBall: () => void;
updateBallPosition: (position: [number, number, number]) => void;
landBall: (distance: number) => void;
resetBall: () => void;
```

## Ball Component

### GolfBall.tsx

```typescript
export function GolfBall({ ballConfig }: GolfBallProps) {
  const meshRef = useRef<Mesh>(null);
  const flightStateRef = useRef<FlightState | null>(null);

  const startPosition = useMemo<[number, number, number]>(() => [
    ballConfig.position.x,
    ballConfig.position.y,
    ballConfig.position.z,
  ], [ballConfig]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Process flight physics when ball is in motion
    if (ball.isFlying && flightStateRef.current && flightStateRef.current.phase !== 'stopped') {
      const newState = updateFlightPosition(flightStateRef.current, delta);
      flightStateRef.current = newState;
      updateBallPosition(newState.position);

      // Ball has completely stopped
      if (newState.phase === 'stopped') {
        const distance = calculateDistance(startPosition, newState.position);
        landBall(distance);
      }
    } else if (!ball.isFlying) {
      // Not flying - stay at start position
      meshRef.current.position.set(startPosition[0], startPosition[1], startPosition[2]);
    }
  });

  return (
    <Trail
      width={1.2}
      length={12}
      color="#ffffff"
      attenuation={(t) => t * t * t}
      decay={1}
    >
      <mesh ref={meshRef} position={startPosition} castShadow>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
      </mesh>
    </Trail>
  );
}
```

### Visual Trail Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| width | 1.2 | Trail width (increased from 0.3) |
| length | 12 | Trail length in segments (increased from 8) |
| attenuation | t^3 | Cubic falloff for smooth fade |
| decay | 1 | Trail decay rate |

## Distance Calculation

```typescript
export function calculateDistance(
  start: [number, number, number],
  end: [number, number, number]
): number {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function metersToYards(meters: number): number {
  return meters * 1.09361;
}
```

## Constants

```typescript
// Physics
export const GRAVITY = 9.81;           // m/s^2
export const MIN_VELOCITY = 15;        // m/s (~34 mph - weak shot)
export const MAX_VELOCITY = 70;        // m/s (~157 mph - powerful drive)
export const MIN_LAUNCH_ANGLE = 12;    // degrees (low trajectory at high power)
export const MAX_LAUNCH_ANGLE = 25;    // degrees (higher trajectory at low power)

// Golf ball aerodynamics
const BALL_MASS = 0.0459;              // kg
const BALL_RADIUS = 0.02135;           // m
const AIR_DENSITY = 1.225;             // kg/m^3 at sea level
const DRAG_COEFFICIENT = 0.25;         // Dimpled golf ball
const LIFT_COEFFICIENT = 0.15;         // Magnus effect (backspin)

// Ground physics
const BOUNCE_COEFFICIENT = 0.38;       // Energy retained on bounce
const ROLLING_FRICTION = 1.5;          // Rolling deceleration
const MIN_BOUNCE_VELOCITY = 1.5;       // Below this, ball rolls instead of bounces
const MIN_ROLLING_SPEED = 0.1;         // Below this, ball stops

// Animation timing
export const CONTACT_RATIO = 0.65;     // 65% through animation
```

## Ball Phases

```
flying -> bouncing -> rolling -> stopped
```

| Phase | Description |
|-------|-------------|
| flying | Ball in air, full aerodynamics applied |
| bouncing | Ball hit ground but has enough vertical velocity to bounce |
| rolling | Ball on ground, rolling with friction |
| stopped | Ball velocity below threshold, stationary |

### Bounce Logic

```typescript
if (newPy <= 0) {
  if (Math.abs(newVy) > MIN_BOUNCE_VELOCITY) {
    // Bounce: reverse vertical, reduce velocities
    newVy = -newVy * BOUNCE_COEFFICIENT;
    newVx *= 0.7;  // Horizontal friction on bounce
    newVz *= 0.7;
  } else {
    // Start rolling
    phase = 'rolling';
  }
}
```

## Result Display

After ball lands, distance shown in `SwingResult.tsx`:

```typescript
{swingPhase === 'finished' && ball.distanceTraveled > 0 && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <div className="text-3xl font-bold text-purple-600">
      {Math.round(metersToYards(ball.distanceTraveled))} yds
    </div>
    <div className="text-xs text-gray-500 uppercase">Distance</div>
  </div>
)}
```

## Future Enhancements

1. **Wind Effect**: Add wind vector affecting trajectory
2. ~~**Terrain Interaction**: Bounce/roll on landing~~ (DONE - bounce/rolling physics)
3. ~~**Camera Follow**: Smooth camera tracking during flight~~ (DONE - 3s delay, instant snap, fast tracking)
4. **Sound Effects**: Swing and impact sounds
5. ~~**Ball Spin**: Magnus effect for draw/fade shots~~ (DONE - lift coefficient)
