# Topgolf Mode - Feature Specification

## Overview

Topgolf mode adds target-based scoring gameplay to Swing Girls. Players hit balls at color-coded targets at various distances, earning points based on distance and accuracy.

## Game Rules

### Target Zones

Six circular targets positioned at increasing distances from the tee:

| Target | Color | Distance | Outer Radius | Inner Radius | Base Points | Center Bonus |
|--------|-------|----------|--------------|--------------|-------------|--------------|
| Red | #ef4444 | 35m | 8m | 3m | 10 | +5 |
| Yellow | #eab308 | 55m | 10m | 4m | 20 | +10 |
| Green | #22c55e | 90m | 12m | 5m | 30 | +15 |
| Blue | #3b82f6 | 135m | 14m | 6m | 40 | +20 |
| White | #f8fafc | 170m | 16m | 7m | 50 | +25 |
| Far | #a855f7 | 200m | 20m | 8m | 60 | +30 |

### Scoring System

```
Points = BasePoints + (isCenter ? CenterBonus : 0)
If BonusBall: Points = Points * 2
```

- **Outer Ring Hit**: Base points only
- **Center (Bullseye) Hit**: Base points + center bonus
- **Miss (No Target)**: 0 points
- **Bonus Ball (Shot 10)**: Double all points

### Game Flow

1. Player selects "Topgolf Mode" from mode selection
2. Game starts with Shot 1 of 10
3. Player performs swing gesture (existing mechanics)
4. Ball flies and lands
5. System detects which target (if any) was hit
6. Points displayed with zone name
7. Player taps to advance to next shot
8. After Shot 10, final score screen displays

### Scoring Reference

| Scenario | Points |
|----------|--------|
| Miss | 0 |
| Red outer | 10 |
| Red center | 15 |
| Blue outer | 40 |
| Blue center | 60 |
| Far center (bonus ball) | 180 |
| **Max possible score** | ~400 |
| **Average score** | ~95 |

## User Interface

### Topgolf HUD (During Play)

```
+------------------+
| Shot  3 / 10     |
|                  |
| Score            |
|   125            |
|                  |
| [BONUS BALL 2x]  |  <- Only on shot 10
+------------------+
```

Position: Top-left corner

### Shot Result Overlay

```
      +30
   Blue Zone

  [Next Shot]
```

- Large point number with animation
- Zone name with zone color
- "BULLSEYE!" indicator if center hit
- "DOUBLE POINTS!" indicator if bonus ball

### Game End Screen

```
+---------------------------+
|     Game Complete!        |
|                           |
|         245               |
|      Total Points         |
|                           |
| Shot 1   Green      +30   |
| Shot 2   Miss        +0   |
| Shot 3   Blue (C)   +60   |
| ...                       |
| Shot 10  Yellow (2x)+40   |
|                           |
| [Play Again] [Exit]       |
+---------------------------+
```

### Mode Selection (Character Select Screen)

```
+---------------------------+
|    [Topgolf Mode]         |
|  10 shots, target scoring |
|                           |
|    [Practice Mode]        |
|       Free play           |
+---------------------------+
```

## Technical Implementation

### Target Detection Algorithm

```typescript
function detectTargetZone(ballPosition: [x, y, z]): TargetZone | null {
  for (const zone of TARGET_ZONES) {
    // Zone center at [0, 0, zone.distanceFromTee]
    const dx = ballPosition[0];
    const dz = ballPosition[2] - zone.distanceFromTee;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance <= zone.outerRadius) {
      return zone;
    }
  }
  return null;
}
```

### State Structure

```typescript
interface TopgolfState {
  currentShot: number;      // 1-10
  totalShots: number;       // 10
  runningScore: number;     // Sum of all shots
  shotHistory: ShotResult[];
  lastHitZone: TargetZone | null;
  gameComplete: boolean;
}

interface ShotResult {
  zone: TargetZone | null;
  points: number;
  distanceFromCenter: number;
  isCenter: boolean;
  isBonusBall: boolean;
}
```

### 3D Target Rendering

- Targets rendered as flat circles on ground plane (y = 0.02)
- Two layers per target: outer ring + inner bullseye
- Semi-transparent material with zone color
- Glow/highlight effect when ball lands in zone
- Visible only in Topgolf mode

## Integration Points

### Existing Systems Used

- **Swing Mechanics**: Unchanged (pull-to-swing gesture)
- **Ball Physics**: Unchanged (flight, bounce, roll)
- **Camera System**: Unchanged (follows ball)
- **Character Animation**: Unchanged

### New Hooks Required

1. **Ball Landing Event**: Detect target when `ball.phase === 'stopped'`
2. **Game Mode State**: Add `gameMode` to store
3. **Shot Progression**: Add `nextShot()` action

## Future Extensions

### Additional Game Modes

1. **Quick 9**: 9 shots to specific targets (3 each to Red, Yellow, Green)
2. **TopChip**: Short game focus (Red, Yellow targets only)
3. **TopShot**: Must hit designated targets per round
4. **Time Attack**: Most points in 60 seconds

### Multiplayer

- Turn-based local multiplayer (2-4 players)
- Track scores per player
- Leaderboard display

### Achievements

- First bullseye
- Perfect game (all center hits)
- Long drive (Far target hit)
- Consistency streak

## References

- [How TopGolf Works](https://golfersauthority.com/how-topgolf-works/)
- [The Golfer's Guide to TopGolf](https://theleftrough.com/how-to-play-topgolf/)
