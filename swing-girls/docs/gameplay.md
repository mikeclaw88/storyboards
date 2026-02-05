# Swing Girls - Gameplay Mechanics

## Swing System

### Current Implementation (v0.1)

The swing system uses a **gesture-based** input method with a draggable control area.

#### Gesture Control
1. **Pull Back:** Drag downward to prepare swing
2. **Swing:** Release upward in a quick motion
3. **Power:** Determined by swing speed (faster = more power)
4. **Accuracy:** Determined by horizontal deviation (straighter = more accurate)

#### Swing Phases

```
1. Ready Phase
   - Character in stance position (Golf_Drive at 0.1s)
   - PowerBar visible but dimmed (30% opacity)
   - Awaiting user input

2. Pulling Phase
   - User dragging down
   - Trail visualization shows gesture path
   - Tracking pull distance
   - When pull reaches 95%: PowerBar animation starts

3. Swinging Phase
   - User released upward
   - PowerBar captures power at release moment
   - Full Golf_Drive animation plays
   - PowerBar fades out after 0.1s

4. Finished Phase
   - Result displayed (Power/Accuracy/Score)
   - Grade shown (Perfect/Great/Good/Miss)
   - Retry button available anytime during play mode
```

### PowerBar Component

Vertical bar swing timing indicator that **determines shot power**.

> **Important:** The drag gesture controls *when* to swing and *accuracy*. The PowerBar controls the actual *power* output based on where the pointer is at the moment of release.

#### Position & Appearance

- Vertical bar on **right side** of screen (30px from edge)
- 20px wide, 200px tall
- Pointer moves from bottom (0%) to top (100%)
- Zone labels (0, 50, 100) on the left side

#### Timing Zones

| Zone | Progress | Color | Power Output |
|------|----------|-------|--------------|
| Gray Zone | 0% - 70% | Gray gradient | 0% → 85% (building) |
| Sweet Spot | 70% - 90% | White (glowing) | 100% (maximum) |
| Danger Zone | 90% - 100% | Red gradient | 100% → 70% (penalty) |

#### Animation

- Pointer cycles from 0% to 100% over **1.2 seconds**
- Starts when pull progress reaches **95%** threshold
- Pointer color changes based on current zone:
  - Gray zone: Orange with orange border
  - Sweet spot: White with green border and glow
  - Danger zone: Red with dark red border

#### Power Calculation

Power is calculated based on **pointer position at release**:

```typescript
let power: number;
if (progress >= DANGER_ZONE_START) {
  // Red zone - penalty for overshooting
  const overshoot = (progress - 0.90) / 0.10;
  power = 100 - overshoot * 30;  // 100% -> 70%
} else if (progress >= SWEET_SPOT_START) {
  // White zone - maximum power
  power = 100;
} else {
  // Gray zone - building up
  power = (progress / 0.70) * 85;  // 0% -> 85%
}
```

#### Configuration

```typescript
const BAR_WIDTH = 20;
const BAR_HEIGHT = 200;
const POINTER_HEIGHT = 8;
const POINTER_CYCLE_MS = 1200;
const SWEET_SPOT_START = 0.70;
const SWEET_SPOT_END = 0.90;
const DANGER_ZONE_START = 0.90;
```

#### Scoring System

- **Power (0-100):** Determined by **PowerArc position** at release moment (see PowerArc Component)
- **Accuracy (0-100):** Based on horizontal deviation in drag gesture (`100 - deviation * 2`)
- **Score:** Combined average (`power * 0.5 + accuracy * 0.5`)

| Score Range | Grade |
|-------------|-------|
| 90+ | Perfect! |
| 70-89 | Great! |
| 50-69 | Good |
| 0-49 | Miss |

### Planned Features

#### Desktop (Mouse/Keyboard)
1. **Aim:** Move mouse to adjust direction
2. **Power:** Click and drag back to set power
3. **Timing:** Release at optimal point for accuracy
4. **Spin:** Hold modifier keys for draw/fade

#### Mobile (Touch)
1. **Aim:** Swipe to rotate camera/direction
2. **Power:** Touch and drag gesture
3. **Timing:** Release touch at swing peak
4. **Spin:** Two-finger gesture for curve

## Physics Model

### Ball Physics (Current Implementation)

The ball uses realistic golf ball aerodynamics:

#### Flight Phase
- **Initial velocity**: 35-70 m/s based on power (0-100)
- **Launch angle**: 12-25 degrees (higher power = lower angle)
- **Air drag**: Drag coefficient 0.25 (dimpled golf ball)
- **Magnus effect**: Lift coefficient 0.15 (backspin lift)
- **Gravity**: 9.81 m/s^2

#### Ground Contact
- **Bouncing**: Ball bounces with 40% energy retention
- **Transition to rolling**: When vertical velocity < 1.5 m/s
- **Rolling friction**: 0.8 deceleration factor
- **Stop condition**: When rolling speed < 0.1 m/s

#### Ball Phases
```
flying -> bouncing -> rolling -> stopped
```

### Camera System

#### Play Mode Camera Behavior

| Phase | Description |
|-------|-------------|
| **Initial** | Behind character (-Z direction), position (0, 2.5, -6) |
| **Delay** | Waits **3 seconds** after shot before following |
| **Snap** | Instantly snaps to ball position when starting to follow |
| **Following** | Tracks ball with fast interpolation (speed: 25) |
| **At ball** | Stays at stopped ball position for 1.5 seconds |
| **Return** | Smoothly returns to initial position |

#### Camera Configuration

```typescript
const CAMERA_FOLLOW_DELAY = 3;      // Seconds before following
const CAMERA_FOLLOW_THRESHOLD = 5;  // Min distance to trigger follow (meters)
const CAMERA_FOLLOW_SPEED = 25;     // Lerp speed for tracking
const CAMERA_RETURN_DELAY = 1.5;    // Seconds at ball before returning
```

#### Dynamic Camera Offset

Camera offset changes based on ball height for better framing:
- **High altitude** (15m+): Offset (0, 0.5, -0.8) - further back
- **Low altitude** (2m): Offset (0, 0.2, -0.3) - very close

### Planned Features
- Wind resistance
- Terrain interaction (rough, sand, green)

### Club Properties

| Club | Distance | Loft | Control |
|------|----------|------|---------|
| Driver | 250-300y | 10deg | Low |
| 3 Wood | 200-250y | 15deg | Medium |
| 5 Iron | 150-180y | 27deg | High |
| 7 Iron | 130-150y | 34deg | High |
| 9 Iron | 110-130y | 41deg | Very High |
| Pitching Wedge | 80-110y | 45deg | Very High |
| Putter | Variable | 3deg | Maximum |

## Scoring System

### Standard Golf Scoring
- Eagle (-2)
- Birdie (-1)
- Par (0)
- Bogey (+1)
- Double Bogey (+2)

### Training Mode Scoring
- Accuracy points (target proximity)
- Distance achievements
- Consistency bonuses
- Combo multipliers

## Progression System

### Player Stats
- Power (max swing distance)
- Accuracy (reduced variance)
- Spin Control (curve shots)
- Putting Touch (green reading)

### Unlockables
- New courses
- Character costumes
- Golf equipment skins
- Special golf balls

## Training Curriculum

### Level 1: Basics
1. Grip and stance introduction
2. Basic swing mechanics
3. Power control
4. Simple putting

### Level 2: Intermediate
1. Club selection strategy
2. Reading terrain
3. Wind adjustment
4. Advanced putting (breaks)

### Level 3: Advanced
1. Draw and fade shots
2. Chip and pitch shots
3. Bunker play
4. Course management

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| K | Toggle left arm IK on/off |

## UI/HUD Elements

### During Play
- Club selector
- PowerBar (vertical swing timing indicator)
- Wind indicator
- Distance marker
- Mini-map
- Shot trajectory preview

### Results Screen
- Distance traveled
- Accuracy rating
- Score update
- Character reaction
- Next shot preview
