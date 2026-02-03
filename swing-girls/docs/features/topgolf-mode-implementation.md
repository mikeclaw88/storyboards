# Topgolf Mode - Implementation Plan

## Overview

This document outlines the implementation steps for adding Topgolf mode to Swing Girls.

## File Changes Summary

### New Files (7)

| File | Purpose |
|------|---------|
| `src/config/targets.ts` | Target zone definitions and constants |
| `src/utils/topgolfScoring.ts` | Scoring calculation utilities |
| `src/components/TargetZone.tsx` | 3D target circle rendering |
| `src/components/TopgolfHUD.tsx` | Shot counter and running score display |
| `src/components/TopgolfShotResult.tsx` | Per-shot points overlay |
| `src/components/TopgolfGameEnd.tsx` | Final score summary screen |
| `src/components/ModeSelectionUI.tsx` | Game mode selection buttons |

### Modified Files (4)

| File | Changes |
|------|---------|
| `src/stores/gameStore.ts` | Add gameMode, topgolf state, new actions |
| `src/scenes/Stage.tsx` | Render target zones component |
| `src/components/GolfBall.tsx` | Integrate target detection on ball stop |
| `src/components/SwingButton.tsx` | Handle nextShot() in topgolf mode |

---

## Phase 1: Target Configuration

### File: `src/config/targets.ts`

```typescript
export interface TargetZone {
  id: string;
  name: string;
  color: string;
  innerRadius: number;
  outerRadius: number;
  distanceFromTee: number;
  basePoints: number;
  centerBonus: number;
}

export const TARGET_ZONES: TargetZone[] = [
  { id: 'red', name: 'Red', color: '#ef4444', innerRadius: 3, outerRadius: 8, distanceFromTee: 35, basePoints: 10, centerBonus: 5 },
  { id: 'yellow', name: 'Yellow', color: '#eab308', innerRadius: 4, outerRadius: 10, distanceFromTee: 55, basePoints: 20, centerBonus: 10 },
  { id: 'green', name: 'Green', color: '#22c55e', innerRadius: 5, outerRadius: 12, distanceFromTee: 90, basePoints: 30, centerBonus: 15 },
  { id: 'blue', name: 'Blue', color: '#3b82f6', innerRadius: 6, outerRadius: 14, distanceFromTee: 135, basePoints: 40, centerBonus: 20 },
  { id: 'white', name: 'White', color: '#f8fafc', innerRadius: 7, outerRadius: 16, distanceFromTee: 170, basePoints: 50, centerBonus: 25 },
  { id: 'far', name: 'Far', color: '#a855f7', innerRadius: 8, outerRadius: 20, distanceFromTee: 200, basePoints: 60, centerBonus: 30 },
];

export const TOPGOLF_CONFIG = {
  totalShots: 10,
  bonusBallMultiplier: 2,
};
```

---

## Phase 2: Scoring Utilities

### File: `src/utils/topgolfScoring.ts`

```typescript
import { TARGET_ZONES, TOPGOLF_CONFIG, type TargetZone } from '../config/targets';

export interface ShotResult {
  zone: TargetZone | null;
  points: number;
  distanceFromCenter: number;
  isCenter: boolean;
  isBonusBall: boolean;
}

export function detectTargetZone(
  ballPosition: [number, number, number]
): { zone: TargetZone | null; distanceFromCenter: number } {
  const [bx, , bz] = ballPosition;

  for (const zone of TARGET_ZONES) {
    const dx = bx;
    const dz = bz - zone.distanceFromTee;
    const distanceFromCenter = Math.sqrt(dx * dx + dz * dz);

    if (distanceFromCenter <= zone.outerRadius) {
      return { zone, distanceFromCenter };
    }
  }

  return { zone: null, distanceFromCenter: 0 };
}

export function calculateShotPoints(
  zone: TargetZone | null,
  distanceFromCenter: number,
  isBonusBall: boolean
): ShotResult {
  if (!zone) {
    return { zone: null, points: 0, distanceFromCenter: 0, isCenter: false, isBonusBall };
  }

  const isCenter = distanceFromCenter <= zone.innerRadius;
  let points = zone.basePoints + (isCenter ? zone.centerBonus : 0);

  if (isBonusBall) {
    points *= TOPGOLF_CONFIG.bonusBallMultiplier;
  }

  return { zone, points, distanceFromCenter, isCenter, isBonusBall };
}
```

---

## Phase 3: State Management

### File: `src/stores/gameStore.ts` (modifications)

Add types:
```typescript
export type GameMode = 'practice' | 'topgolf';

interface TopgolfState {
  currentShot: number;
  totalShots: number;
  runningScore: number;
  shotHistory: ShotResult[];
  lastHitZone: TargetZone | null;
  gameComplete: boolean;
}
```

Add initial state:
```typescript
const INITIAL_TOPGOLF_STATE: TopgolfState = {
  currentShot: 1,
  totalShots: 10,
  runningScore: 0,
  shotHistory: [],
  lastHitZone: null,
  gameComplete: false,
};
```

Add to GameState interface:
```typescript
gameMode: GameMode;
topgolf: TopgolfState;

setGameMode: (mode: GameMode) => void;
startTopgolfGame: () => void;
recordShot: (result: ShotResult) => void;
nextShot: () => void;
endTopgolfGame: () => void;
```

Add actions:
```typescript
gameMode: 'practice',
topgolf: { ...INITIAL_TOPGOLF_STATE },

setGameMode: (mode) => set({ gameMode: mode }),

startTopgolfGame: () => set({
  gameMode: 'topgolf',
  screenMode: 'playing',
  topgolf: { ...INITIAL_TOPGOLF_STATE },
  swingPhase: 'ready',
  swingResult: null,
  ball: { ...INITIAL_BALL_STATE },
}),

recordShot: (result) => set((state) => ({
  topgolf: {
    ...state.topgolf,
    runningScore: state.topgolf.runningScore + result.points,
    shotHistory: [...state.topgolf.shotHistory, result],
    lastHitZone: result.zone,
    gameComplete: state.topgolf.currentShot >= state.topgolf.totalShots,
  },
})),

nextShot: () => set((state) => {
  if (state.topgolf.gameComplete) return state;
  return {
    topgolf: {
      ...state.topgolf,
      currentShot: state.topgolf.currentShot + 1,
      lastHitZone: null,
    },
    swingPhase: 'ready',
    swingResult: null,
    ball: { ...INITIAL_BALL_STATE },
  };
}),

endTopgolfGame: () => set({
  gameMode: 'practice',
  screenMode: 'selection',
  topgolf: { ...INITIAL_TOPGOLF_STATE },
}),
```

---

## Phase 4: 3D Target Rendering

### File: `src/components/TargetZone.tsx`

```typescript
import { type TargetZone as TargetZoneType } from '../config/targets';

interface TargetZoneProps {
  zone: TargetZoneType;
  highlighted?: boolean;
}

export function TargetZone({ zone, highlighted }: TargetZoneProps) {
  return (
    <group position={[0, 0.02, zone.distanceFromTee]}>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[zone.innerRadius, zone.outerRadius, 64]} />
        <meshBasicMaterial
          color={zone.color}
          transparent
          opacity={highlighted ? 0.8 : 0.4}
        />
      </mesh>

      {/* Inner bullseye */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[zone.innerRadius, 64]} />
        <meshBasicMaterial
          color={zone.color}
          transparent
          opacity={highlighted ? 1.0 : 0.6}
        />
      </mesh>
    </group>
  );
}
```

### File: `src/scenes/Stage.tsx` (modifications)

Add TargetZones component:
```typescript
import { TARGET_ZONES } from '../config/targets';
import { TargetZone } from '../components/TargetZone';

function TargetZones() {
  const gameMode = useGameStore((s) => s.gameMode);
  const lastHitZone = useGameStore((s) => s.topgolf.lastHitZone);

  if (gameMode !== 'topgolf') return null;

  return (
    <>
      {TARGET_ZONES.map((zone) => (
        <TargetZone
          key={zone.id}
          zone={zone}
          highlighted={lastHitZone?.id === zone.id}
        />
      ))}
    </>
  );
}
```

Add to Stage component (before `</>`):
```typescript
<TargetZones />
```

---

## Phase 5: Ball Landing Integration

### File: `src/components/GolfBall.tsx` (modifications)

Add imports:
```typescript
import { detectTargetZone, calculateShotPoints } from '../utils/topgolfScoring';
```

Add store selectors:
```typescript
const gameMode = useGameStore((s) => s.gameMode);
const topgolf = useGameStore((s) => s.topgolf);
const recordShot = useGameStore((s) => s.recordShot);
```

Modify ball stop detection (around line 69):
```typescript
if (newState.phase === 'stopped') {
  const distance = calculateDistance(startPosition, newState.position);

  // Topgolf scoring
  if (gameMode === 'topgolf') {
    const { zone, distanceFromCenter } = detectTargetZone(newState.position);
    const isBonusBall = topgolf.currentShot === topgolf.totalShots;
    const result = calculateShotPoints(zone, distanceFromCenter, isBonusBall);
    recordShot(result);
  }

  landBall(distance);
}
```

---

## Phase 6: UI Components

### File: `src/components/TopgolfHUD.tsx`

```typescript
import { useGameStore } from '../stores/gameStore';

export function TopgolfHUD() {
  const gameMode = useGameStore((s) => s.gameMode);
  const topgolf = useGameStore((s) => s.topgolf);

  if (gameMode !== 'topgolf') return null;

  const isBonusBall = topgolf.currentShot === topgolf.totalShots;

  return (
    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-xl p-4 text-white min-w-[120px]">
      <div className="text-xs uppercase text-gray-400 tracking-wider">Shot</div>
      <div className="text-2xl font-bold">
        {topgolf.currentShot} / {topgolf.totalShots}
      </div>

      <div className="mt-3 text-xs uppercase text-gray-400 tracking-wider">Score</div>
      <div className="text-3xl font-bold text-yellow-400">
        {topgolf.runningScore}
      </div>

      {isBonusBall && (
        <div className="mt-2 text-xs text-purple-400 font-semibold animate-pulse">
          BONUS BALL 2x
        </div>
      )}
    </div>
  );
}
```

### File: `src/components/TopgolfShotResult.tsx`

```typescript
import { useGameStore } from '../stores/gameStore';

export function TopgolfShotResult() {
  const gameMode = useGameStore((s) => s.gameMode);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const topgolf = useGameStore((s) => s.topgolf);
  const nextShot = useGameStore((s) => s.nextShot);

  if (gameMode !== 'topgolf' || swingPhase !== 'finished') return null;
  if (topgolf.gameComplete) return null;

  const lastShot = topgolf.shotHistory[topgolf.shotHistory.length - 1];
  if (!lastShot) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
      <div
        className="text-6xl font-bold drop-shadow-lg"
        style={{ color: lastShot.zone?.color || '#6b7280' }}
      >
        +{lastShot.points}
      </div>

      {lastShot.zone ? (
        <div className="text-xl mt-2 text-white drop-shadow">
          {lastShot.zone.name} {lastShot.isCenter && 'BULLSEYE!'}
        </div>
      ) : (
        <div className="text-xl mt-2 text-gray-400">Miss</div>
      )}

      {lastShot.isBonusBall && lastShot.points > 0 && (
        <div className="text-lg text-purple-400 mt-1">DOUBLE POINTS!</div>
      )}

      <button
        onClick={nextShot}
        className="mt-6 px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white text-lg font-semibold transition-colors"
      >
        Next Shot
      </button>
    </div>
  );
}
```

### File: `src/components/TopgolfGameEnd.tsx`

```typescript
import { useGameStore } from '../stores/gameStore';

export function TopgolfGameEnd() {
  const topgolf = useGameStore((s) => s.topgolf);
  const startTopgolfGame = useGameStore((s) => s.startTopgolfGame);
  const endTopgolfGame = useGameStore((s) => s.endTopgolfGame);

  if (!topgolf.gameComplete) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white text-center">Game Complete!</h2>

        <div className="text-center mt-6">
          <div className="text-5xl font-bold text-yellow-400">{topgolf.runningScore}</div>
          <div className="text-gray-400 uppercase text-sm mt-1">Total Points</div>
        </div>

        <div className="mt-6 space-y-1">
          {topgolf.shotHistory.map((shot, i) => (
            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-800">
              <span className="text-gray-500">Shot {i + 1}</span>
              <span style={{ color: shot.zone?.color || '#6b7280' }}>
                {shot.zone?.name || 'Miss'} {shot.isCenter && '(C)'}
              </span>
              <span className="text-white font-medium">+{shot.points}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={startTopgolfGame}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={endTopgolfGame}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-semibold transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
```

### File: `src/components/ModeSelectionUI.tsx`

```typescript
import { useGameStore } from '../stores/gameStore';

export function ModeSelectionUI() {
  const startTopgolfGame = useGameStore((s) => s.startTopgolfGame);
  const startPlay = useGameStore((s) => s.startPlay);

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <button
        onClick={startTopgolfGame}
        className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl text-white transition-all"
      >
        <div className="text-lg font-bold">Topgolf Mode</div>
        <div className="text-sm opacity-80">10 shots, target scoring</div>
      </button>

      <button
        onClick={startPlay}
        className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl text-white transition-all"
      >
        <div className="text-lg font-bold">Practice Mode</div>
        <div className="text-sm opacity-80">Free play</div>
      </button>
    </div>
  );
}
```

---

## Phase 7: Integration

### File: `src/components/SwingButton.tsx` (modifications)

Add store selectors:
```typescript
const gameMode = useGameStore((s) => s.gameMode);
const topgolf = useGameStore((s) => s.topgolf);
const nextShot = useGameStore((s) => s.nextShot);
```

Modify click handler for finished phase:
```typescript
// In handleClick or tap handler when swingPhase === 'finished':
if (gameMode === 'topgolf') {
  if (!topgolf.gameComplete) {
    nextShot();
  }
} else {
  resetSwing();
}
```

### File: `src/App.tsx` (modifications)

Add imports and components to playing mode render:
```typescript
import { TopgolfHUD } from './components/TopgolfHUD';
import { TopgolfShotResult } from './components/TopgolfShotResult';
import { TopgolfGameEnd } from './components/TopgolfGameEnd';

// In playing mode section:
<TopgolfHUD />
<TopgolfShotResult />
<TopgolfGameEnd />
```

---

## Testing Checklist

- [ ] Target zones render correctly in Topgolf mode
- [ ] Targets hidden in Practice mode
- [ ] Ball landing detects correct target zone
- [ ] Center vs outer ring detection works
- [ ] Points calculated correctly
- [ ] Bonus ball (shot 10) doubles points
- [ ] Shot counter increments correctly
- [ ] Running score updates after each shot
- [ ] Next Shot button advances game
- [ ] Game end screen shows after shot 10
- [ ] Shot history displays correctly
- [ ] Play Again resets game
- [ ] Exit returns to selection screen
- [ ] Mode selection buttons work
- [ ] Existing practice mode unchanged
