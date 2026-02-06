# Shot Mechanics: Input → Swing → Flight → Roll

Complete pipeline from user gesture to final scoring.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Swing   │───▶│  Power   │───▶│  Launch  │───▶│  Flight  │───▶│ Collision│───▶│  Bounce  │───▶│ Rolling  │───▶│ Scoring  │
│  Input   │    │  Arc     │    │  Calc    │    │ Physics  │    │Detection │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
 Pull gesture    Timing bar     Power→speed     Gravity+drag    Heightmap        Reflect off     Friction+slope   Practice or
 + swipe up      captures       + angle calc    + Magnus lift   + binary search  terrain normal  + stop detect    Topgolf zones
                 power %
```

---

## 1. Swing Input

**Source:** `src/components/SwingButton.tsx`

The swing gesture is a two-phase drag inside a 132×160 px touch area (3 lanes of 44 px):

### Pull Phase
1. User touches the swing area → phase becomes `pulling`.
2. Dragging **downward** accumulates `pullProgress` (0–1), computed as:
   ```
   pullProgress = min(1, maxPullDistance / MAX_PULL_DISTANCE)
   ```
   where `MAX_PULL_DISTANCE = 80 px`.
3. When `pullProgress ≥ 0.95`, the Power Arc bar begins animating (see §2).

### Swing Phase
4. User reverses direction and swipes **upward**, releasing above the halfway line.
5. On release the following values are captured:

| Value       | Derivation |
|-------------|-----------|
| **power**   | Read from `arcPower` in the game store (set by the Power Arc timer — see §2) |
| **accuracy**| Smoothness-based: `max(0, round(100 − jitter × 300))` where jitter is the average `|deltaNormalizedX|` between consecutive upswing samples (see §1.5) |
| **direction**| Average `normalizedX` of last few upswing samples, inverted and clamped to [-1, 1] (see §1.5) |
| **sidespin** | Weighted-deviation integral of finger path curvature during upswing, clamped [-1, 1] (see §1.5) |
| **shotType** | Classified from sidespin + direction: straight, draw, fade, big_draw, big_fade, push, pull (see §1.5) |
| **score**   | `round(power × 0.5 + accuracy × 0.5)` (display only) |

### Fail Conditions
The swing resets without launching if any of:
- Pull distance < 30 px
- Swing-up distance < 30 px
- Release position is still in the bottom half of the area

---

## 1.5. Shot Shaping (Draw/Fade)

**Source:** `src/components/SwingButton.tsx`, `src/utils/ballPhysics.ts`

The swing area supports intentional shot shaping (draws, fades, pushes, pulls) via continuous finger-path tracking during the upswing.

### 3-Lane UI

The swing area is **132x160 px** with 3 lanes of 44 px each, separated by two vertical dividers at x=44 and x=88 (white, 15% opacity). The dot size is 24 px and max pull distance is 80 px.

### Curve Tracking (Upswing)

When the finger starts moving upward past the pull-end position, a curve accumulator begins recording samples:

```
normalizedX = (posX - centerX) / halfWidth    → range [-1, 1]
yProgress   = (pullEndY - clientY) / swingRange → range [0, 1]
```

### Sidespin Computation (Weighted-Deviation Integral)

At release, the sidespin is computed from the accumulated curve samples:

1. **Baseline:** straight line from first to last sample
2. **Deviation:** each sample's `normalizedX` minus expected position on baseline
3. **Weight:** bell curve peaking at `yProgress = 0.5`:
   ```
   bellWeight = e^(-8 × (yProgress - 0.5)²)
   ```
4. **Result:**
   ```
   weightedAvgDeviation = Σ(deviation × bellWeight) / Σ(bellWeight)
   sidespin = clamp(-weightedAvgDeviation × 2.5, -1, 1)
   ```

Negative sidespin = draw (ball curves right-to-left). Positive = fade (left-to-right).

### Shot Type Classification

| Condition | Label |
|-----------|-------|
| `|sidespin| < 0.15` and `|direction| < 0.3` | **STRAIGHT** |
| `|sidespin| < 0.15` and `|direction| >= 0.3` | **PUSH** (dir > 0) / **PULL** (dir < 0) |
| `0.15 <= |sidespin| < 0.5` | **DRAW** (spin < 0) / **FADE** (spin > 0) |
| `|sidespin| >= 0.5` | **BIG DRAW** (spin < 0) / **BIG FADE** (spin > 0) |

A live "DRAW" or "FADE" text indicator appears below the swing area during the upswing when `|liveSpin| > 0.15`.

### Accuracy (Smoothness-Based)

Accuracy is now based on path smoothness (jitter) rather than horizontal deviation:
```
jitter   = avg of |deltaNormalizedX| between consecutive upswing samples
accuracy = max(0, round(100 - jitter × 300))
```

This means intentional lateral movement (draws/fades) is not penalized — only erratic zig-zagging reduces accuracy.

### Direction

Direction is computed from the average `normalizedX` of the last few upswing samples, inverted and clamped to [-1, 1].

### Lateral Magnus Force (Sidespin Physics)

During flight, sidespin produces a lateral force perpendicular to the ball's horizontal velocity:

```
perpX = -vz / horizontalSpeed
perpZ = vx / horizontalSpeed

SIDESPIN_COEFF = 0.10
sideMagnitude = 0.5 × ρ × v² × SIDESPIN_COEFF × A / m

effectiveSpin = sidespin × e^(-0.3 × flightTime)    // spin decay

sideForceX = perpX × sideMagnitude × effectiveSpin
sideForceZ = perpZ × sideMagnitude × effectiveSpin
```

The spin decays exponentially over flight time (decay rate 0.3/s), making the curve strongest early in flight and straightening out over time. Sidespin is set to 0 when the ball transitions to rolling.

### Example Gestures → Ball Flights

| Gesture | sidespin | shotType | Ball Flight |
|---------|----------|----------|-------------|
| Straight swipe up center lane | ~0 | STRAIGHT | Straight flight |
| Arc finger rightward during upswing | negative | DRAW / BIG DRAW | Ball curves left |
| Arc finger leftward during upswing | positive | FADE / BIG FADE | Ball curves right |
| Straight swipe up left lane | ~0, dir > 0 | PUSH | Angled right, no curve |
| Straight swipe up right lane | ~0, dir < 0 | PULL | Angled left, no curve |
| Aggressive arc right | -0.7 to -1.0 | BIG DRAW | ~20-30m lateral deviation over 200m |

---

## 2. Power Arc (Timing Bar)

**Source:** `src/components/PowerArc.tsx`

A vertical bar (20×200 px) with a pointer that rises from bottom to top over **1200 ms** (`POINTER_CYCLE_MS`). The pointer's position at the moment of release determines power.

### Zones

| Zone   | Progress Range | Power Output |
|--------|---------------|-------------|
| Gray   | 0% – 70%      | `round((progress / 0.70) × 85)` → 0–85% |
| White (sweet spot) | 70% – 90% | **100%** |
| Red (danger)       | 90% – 100% | `round(100 − overshoot × 30)` → 100%–70% (penalty) |

The power value is continuously written to `gameStore.arcPower` while the pointer moves.

---

## 3. Launch Calculation

**Source:** `src/utils/ballPhysics.ts` — `calculateInitialVelocity()`

### Power → Speed (Quadratic)
```
powerRatio = power / 100
curvedPower = powerRatio²                       // 50% power → 25% speed
speed = MIN_VELOCITY + curvedPower × (MAX_VELOCITY − MIN_VELOCITY)
```
- `MIN_VELOCITY = 15 m/s` (~34 mph)
- `MAX_VELOCITY = 70 m/s` (~157 mph)

### Power → Launch Angle (Inverse Linear)
```
launchAngle = MAX_LAUNCH_ANGLE − (power / 100) × (MAX_LAUNCH_ANGLE − MIN_LAUNCH_ANGLE)
```
- `MIN_LAUNCH_ANGLE = 12°` (at full power)
- `MAX_LAUNCH_ANGLE = 25°` (at zero power)

Higher power → flatter trajectory for distance.

### Direction + Accuracy → Horizontal Angle
```
directionAngle = direction × 12° × π/180        // max ±12° intentional aim
errorAngle     = ((100 − accuracy) / 100) × 2° × random(±1)  // max ±2° random error
totalAngle     = cameraAimAngle + directionAngle + errorAngle
```

**Camera Aim Angle** (`src/components/AimController.tsx`): During the `ready` phase, the camera's azimuthal angle + π is stored as `aimAngle`. This means the ball flies in the direction the camera faces.

### Velocity Decomposition
```
horizontalSpeed = speed × cos(launchAngle)
vx = horizontalSpeed × sin(totalAngle)     // lateral
vy = speed × sin(launchAngle)              // upward
vz = horizontalSpeed × cos(totalAngle)     // forward
```

---

## 4. Flight Physics

**Source:** `src/utils/ballPhysics.ts` — `updateFlightPosition()`, `calculateAerodynamicForces()`

Each frame, while `phase === 'flying'`:

### Forces
Four forces act on the ball:

1. **Gravity:** constant downward acceleration `−9.81 m/s²`
2. **Drag:** opposes velocity direction
   ```
   F_drag = 0.5 × ρ × v² × Cd × A
   a_drag = F_drag / m                    (applied opposite to velocity)
   ```
3. **Magnus Lift:** backspin creates upward force
   ```
   F_lift = 0.5 × ρ × v² × Cl × A
   a_lift = (F_lift / m) × (horizontalSpeed / (speed + 0.1))
   ```
   The `liftFactor` term means lift is strongest when the ball moves horizontally and drops off as it descends steeply.
4. **Lateral Magnus (Sidespin):** curves the ball sideways (see §1.5 for full formula)
   ```
   effectiveSpin = sidespin × e^(-0.3 × flightTime)
   sideMagnitude = 0.5 × ρ × v² × 0.10 × A / m
   sideForce = perpendicular_to_velocity × sideMagnitude × effectiveSpin
   ```
   Sidespin is preserved through bounces but set to 0 on rolling transition.

### Integration (Semi-Implicit Euler)
```
// Acceleration
a = aerodynamicForces + [0, −GRAVITY, 0]

// Velocity update (Euler)
v_new = v + a × dt

// Position update (Verlet-style with acceleration term)
p_new = p + v × dt + 0.5 × a × dt²
```

The position update uses the **old** velocity plus a half-acceleration correction, which is more stable than pure forward Euler.

---

## 5. Collision Detection

### Terrain Heightmap Sampling

**Source:** `src/utils/terrainLoader.ts` — `getHeightAtWorld()`

The terrain is a regular grid stored as a `Float32Array`. Height at any world point uses **bilinear interpolation**:

```
col = (worldX + width/2) × resolution
row = (depth/2 − worldZ) × resolution

h = bilerp(h00, h10, h01, h11, frac(col), frac(row)) × heightScale
```

**Source:** `src/stores/terrainStore.ts` — `getHeightAtWorldPosition()`

World-space queries account for terrain position offset, uniform scale, and height scale:
```
localX = (worldX − terrainPosition.x) / terrainScale
localZ = (worldZ − terrainPosition.z) / terrainScale
worldHeight = terrainHeight × terrainScale + terrainPosition.y + debugYOffset
```

### Anti-Tunneling (Binary Search)

**Source:** `src/utils/ballPhysics.ts` — `findCollisionPoint()`

When the ball's new Y falls below `terrainHeight + COLLISION_OFFSET`, a binary search over 8 iterations finds the exact collision point along the line segment `[startPos, endPos]`:

```
low = 0, high = 1
for i in 0..7:
    mid = (low + high) / 2
    midPos = lerp(startPos, endPos, mid)
    if midPos.y ≤ terrainHeight(midPos.xz) + COLLISION_OFFSET:
        high = mid
    else:
        low = mid
return high   // interpolation factor t ∈ [0, 1]
```

`COLLISION_OFFSET = BALL_RADIUS × 1.2` (ball radius = 0.02135 m, plus 20% margin).

### Terrain Normal (Finite Differences)

**Source:** `src/utils/ballPhysics.ts` — `calculateTerrainNormal()`

```
ε = 0.1 m
dx = height(x + ε, z) − height(x, z)
dz = height(x, z + ε) − height(x, z)
normal = normalize(−dx, ε, −dz)
```

---

## 6. Bounce

**Source:** `src/utils/ballPhysics.ts` — `reflectVelocity()`

On collision, the velocity normal component into the surface determines bounce vs. roll:

### Bounce Decision
```
normalSpeed = |v · n|
if normalSpeed > MIN_BOUNCE_VELOCITY (1.5 m/s):
    → BOUNCE
else:
    → transition to ROLLING
```

### Velocity Reflection
The velocity is decomposed into normal and tangent components relative to the terrain surface:

```
v_normal  = (v · n) × n                    // into surface
v_tangent = v − v_normal                    // along surface

v_reflected = v_tangent × TANGENT_FRICTION + n × |v · n| × BOUNCE_COEFFICIENT
```

| Parameter | Value | Effect |
|-----------|-------|--------|
| `BOUNCE_COEFFICIENT` | 0.38 | 38% of normal energy retained per bounce |
| Tangent friction | 0.80 | 80% of surface-parallel speed retained |

The ball remains in `flying` phase after a bounce, allowing multiple bounces before transitioning to roll.

---

## 7. Rolling

**Source:** `src/utils/ballPhysics.ts` — rolling section of `updateFlightPosition()`

When `phase === 'rolling'`, the ball moves along the terrain surface:

### Slope Acceleration
Gravity is projected onto the terrain slope to create downhill acceleration:
```
slopeAccelX = −GRAVITY × normal.x × (1 − normal.y)
slopeAccelZ = −GRAVITY × normal.z × (1 − normal.y)
```
On flat ground (`normal = [0,1,0]`), slope acceleration is zero.

### Rolling Friction
A constant deceleration opposing the direction of travel:
```
frictionDecel = ROLLING_FRICTION (6.0 m/s²)
frictionMagnitude = min(frictionDecel × dt, horizontalSpeed)
speedRatio = (horizontalSpeed − frictionMagnitude) / horizontalSpeed
v_new = v × speedRatio
```

### Stop Conditions
The ball stops (`phase → 'stopped'`) when **any** of:
1. `horizontalSpeed < MIN_ROLLING_SPEED (0.1 m/s)` **and** slope angle < 0.1 rad or friction can overcome slope
2. `horizontalSpeed < 0.01 m/s` (unconditional)
3. Rolling duration > `MAX_ROLLING_TIME (15 s)` (safety timeout)

### Edge Detection (Re-flight)
If the terrain drops more than expected under the ball while rolling speed > 2 m/s, the ball becomes airborne again:
```
if heightDiff < expectedHeightChange − 0.1 && speed > 2 m/s:
    phase → 'flying'
    vy = −1 m/s (small downward kick)
```

---

## 8. Scoring

**Source:** `src/stores/gameStore.ts`, `src/utils/topgolfScoring.ts`, `src/config/targets.ts`

### Practice Mode
```
distToHole = √((ballX − holeX)² + (ballZ − holeZ)²)
shotScore = max(0, round(100 − distToHole))
```
Running total accumulated across shots.

### Topgolf Mode
10 shots per game. Ball stops immediately on contact with any target zone (no rolling inside zones).

**Zone detection** (`detectTargetZone`): For each zone, compute distance from zone center. If inside `outerRadius`, it's a hit — pick the closest match.

**Points calculation** (`calculateShotPoints`):
```
isCenter = distanceFromCenter ≤ zone.innerRadius
basePoints = zone.basePoints
bonusPoints = isCenter ? zone.centerBonus : 0
totalPoints = (basePoints + bonusPoints) × multiplier
```

Where `multiplier = 2` for shot 10 (bonus ball), `1` otherwise.

### Target Zones

| Zone | Distance | X Offset | Inner R | Outer R | Base Pts | Center Bonus |
|------|----------|----------|---------|---------|----------|-------------|
| Red (left) | 30 m | −8 m | 1.5 m | 4 m | 5 | +5 |
| Red (center) | 35 m | 0 m | 1.5 m | 4 m | 5 | +5 |
| Red (right) | 30 m | 8 m | 1.5 m | 4 m | 5 | +5 |
| Yellow (left) | 55 m | −6 m | 2.0 m | 5 m | 10 | +10 |
| Yellow (right) | 55 m | 6 m | 2.0 m | 5 m | 10 | +10 |
| Green | 85 m | −4 m | 2.5 m | 6 m | 20 | +10 |
| Orange | 110 m | 5 m | 3.0 m | 7 m | 30 | +10 |
| Dark Blue | 140 m | −3 m | 3.5 m | 8 m | 40 | +10 |
| Light Blue | 175 m | 4 m | 4.0 m | 9 m | 50 | +10 |

---

## 9. Constants Reference

| Constant | Value | Unit | Source |
|----------|-------|------|--------|
| `GRAVITY` | 9.81 | m/s² | ballPhysics.ts:7 |
| `BALL_MASS` | 0.0459 | kg | ballPhysics.ts:10 |
| `BALL_RADIUS` | 0.02135 | m | ballPhysics.ts:11 |
| `BALL_AREA` | π × r² ≈ 0.001432 | m² | ballPhysics.ts:12 |
| `COLLISION_OFFSET` | BALL_RADIUS × 1.2 | m | ballPhysics.ts:15 |
| `AIR_DENSITY` | 1.225 | kg/m³ | ballPhysics.ts:16 |
| `DRAG_COEFFICIENT` | 0.25 | — | ballPhysics.ts:19 |
| `LIFT_COEFFICIENT` | 0.15 | — | ballPhysics.ts:23 |
| `MIN_VELOCITY` | 15 | m/s | ballPhysics.ts:26 |
| `MAX_VELOCITY` | 70 | m/s | ballPhysics.ts:27 |
| `MIN_LAUNCH_ANGLE` | 12 | degrees | ballPhysics.ts:30 |
| `MAX_LAUNCH_ANGLE` | 25 | degrees | ballPhysics.ts:31 |
| `BOUNCE_COEFFICIENT` | 0.38 | — | ballPhysics.ts:37 |
| `ROLLING_FRICTION` | 6.0 | m/s² | ballPhysics.ts:38 |
| `MIN_BOUNCE_VELOCITY` | 1.5 | m/s | ballPhysics.ts:39 |
| `MIN_ROLLING_SPEED` | 0.1 | m/s | ballPhysics.ts:40 |
| `MAX_ROLLING_TIME` | 15 | s | ballPhysics.ts:41 |
| `CONTACT_RATIO` | 0.65 | — | ballPhysics.ts:34 (legacy) |
| `SIDESPIN_COEFFICIENT` | 0.10 | — | ballPhysics.ts |
| `SIDESPIN_DECAY_RATE` | 0.3 | 1/s | ballPhysics.ts |
| `AREA_WIDTH` | 132 | px | SwingButton.tsx |
| `AREA_HEIGHT` | 160 | px | SwingButton.tsx |
| `DOT_SIZE` | 24 | px | SwingButton.tsx |
| `MAX_PULL_DISTANCE` | 80 | px | SwingButton.tsx |
| `LANE_WIDTH` | 44 | px | SwingButton.tsx |
| `POINTER_CYCLE_MS` | 1200 | ms | PowerArc.tsx:15 |
| `SWEET_SPOT_START` | 0.70 | — | PowerArc.tsx:18 |
| `SWEET_SPOT_END` | 0.90 | — | PowerArc.tsx:19 |
| `DANGER_ZONE_START` | 0.90 | — | PowerArc.tsx:20 |
| `totalShots` | 10 | — | targets.ts:139 |
| `bonusBallMultiplier` | 2 | × | targets.ts:140 |
| Terrain normal ε | 0.1 | m | ballPhysics.ts:158 |
| Binary search iterations | 8 | — | ballPhysics.ts:243 |
| Tangent friction (bounce) | 0.80 | — | ballPhysics.ts:225 |
| Max direction angle | 12 | degrees | ballPhysics.ts:84 |
| Max accuracy error | 2 | degrees | ballPhysics.ts:89 |

---

## Source Files

| File | Role |
|------|------|
| `src/components/SwingButton.tsx` | Pull/swing gesture input |
| `src/components/PowerArc.tsx` | Timing bar for power capture |
| `src/components/AimController.tsx` | Camera azimuthal angle → aim direction |
| `src/utils/ballPhysics.ts` | All flight, bounce, and roll physics |
| `src/components/GolfBall.tsx` | Per-frame simulation loop, landing triggers |
| `src/utils/terrainLoader.ts` | Heightmap decoding and bilinear interpolation |
| `src/stores/terrainStore.ts` | World-space height queries with transforms |
| `src/stores/gameStore.ts` | State machine, practice scoring, shot management |
| `src/utils/topgolfScoring.ts` | Zone detection and point calculation |
| `src/config/targets.ts` | Zone definitions and game constants |
