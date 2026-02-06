import { useRef, useCallback, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { useGameStore } from '../stores/gameStore';

interface TrailPoint {
  x: number;
  y: number;
  speed: number;
  time: number;
}

interface GestureData {
  startY: number;
  startX: number;
  startTime: number;
  pullEndY: number;
  pullEndX: number;
  pullEndTime: number;
  maxPullDistance: number;
  lastY: number;
  lastTime: number;
}

interface CurveSample {
  normalizedX: number; // -1 to 1 (left to right)
  yProgress: number;   // 0 to 1 (bottom of upswing to top)
}

const AREA_WIDTH = 132;
const AREA_HEIGHT = 160;
const DOT_SIZE = 24;
const MAX_PULL_DISTANCE = 80; // Max pull distance in pixels for 100% progress
const LANE_WIDTH = 44;
const HALF_WIDTH = AREA_WIDTH / 2;

/**
 * Compute continuous sidespin from curve samples using weighted-deviation integral.
 * Samples are weighted by a bell curve peaking at yProgress=0.5 (mid-upswing).
 * Returns clamped value in [-1, 1]. Negative = draw, positive = fade.
 */
function computeContinuousSidespin(samples: CurveSample[]): number {
  if (samples.length < 3) return 0;

  // Compute baseline: straight line from first to last sample
  const first = samples[0];
  const last = samples[samples.length - 1];

  let weightedDeviationSum = 0;
  let totalWeight = 0;

  for (const sample of samples) {
    // Expected X position along baseline (linear interpolation)
    const t = sample.yProgress > 0 ? sample.yProgress / (last.yProgress || 1) : 0;
    const expectedX = first.normalizedX + (last.normalizedX - first.normalizedX) * t;

    // Deviation from baseline
    const deviation = sample.normalizedX - expectedX;

    // Bell curve weight peaking at yProgress = 0.5
    const bellWeight = Math.exp(-8 * Math.pow(sample.yProgress - 0.5, 2));

    weightedDeviationSum += deviation * bellWeight;
    totalWeight += bellWeight;
  }

  if (totalWeight < 0.01) return 0;

  const weightedAvgDeviation = weightedDeviationSum / totalWeight;
  return Math.max(-1, Math.min(1, -weightedAvgDeviation * 2.5));
}

/**
 * Classify the shot type based on sidespin and direction values.
 */
function classifyShotType(sidespin: number, direction: number): string {
  const absSpin = Math.abs(sidespin);
  const absDir = Math.abs(direction);

  // Push/Pull: strong direction but minimal curve
  if (absSpin < 0.15 && absDir >= 0.3) {
    return direction < 0 ? 'pull' : 'push';
  }

  if (absSpin < 0.15) return 'straight';
  if (absSpin < 0.5) return sidespin < 0 ? 'draw' : 'fade';
  return sidespin < 0 ? 'big_draw' : 'big_fade';
}

const JOYSTICK_SIZE = 110;
const JOYSTICK_HEIGHT = 140;

/**
 * Joystick UI for drone mode — drag to pan camera (X/Z)
 */
function DroneJoystick() {
  const setDroneJoystick = useGameStore((s) => s.setDroneJoystick);

  const areaRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const centerRef = useRef({ x: 0, y: 0 });

  const maxRadius = JOYSTICK_SIZE / 2 - DOT_SIZE / 2;

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    centerRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - centerRef.current.x;
    const dy = e.clientY - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, maxRadius);
    const scale = dist > 0 ? clamped / dist : 0;
    const cx = dx * scale;
    const cy = dy * scale;
    setOffset({ x: cx, y: cy });
    const normX = cx / maxRadius;
    const normZ = cy / maxRadius;
    setDroneJoystick(normX, normZ);
  }, [dragging, maxRadius, setDroneJoystick]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    setOffset({ x: 0, y: 0 });
    setDroneJoystick(0, 0);
  }, [setDroneJoystick]);

  return (
    <div
      ref={areaRef}
      className="relative rounded-2xl overflow-hidden touch-none cursor-pointer bg-black/40 backdrop-blur-sm border-2 border-blue-400/50 flex items-center justify-center"
      style={{ width: JOYSTICK_SIZE, height: JOYSTICK_HEIGHT }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-blue-300 pointer-events-none drop-shadow-lg">
        PAN
      </div>
      <div className="absolute w-px h-12 bg-white/20 pointer-events-none" style={{ left: JOYSTICK_SIZE / 2, top: JOYSTICK_HEIGHT / 2 - 24 }} />
      <div className="absolute h-px w-12 bg-white/20 pointer-events-none" style={{ top: JOYSTICK_HEIGHT / 2, left: JOYSTICK_SIZE / 2 - 24 }} />
      <div
        className={`absolute rounded-full ${dragging ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-white'}`}
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          left: JOYSTICK_SIZE / 2 - DOT_SIZE / 2 + offset.x,
          top: JOYSTICK_HEIGHT / 2 - DOT_SIZE / 2 + offset.y,
        }}
      />
    </div>
  );
}

/**
 * Elevation + Yaw joystick — vertical = camera Y, horizontal = yaw rotation
 */
function ElevJoystick() {
  const setDroneElevation = useGameStore((s) => s.setDroneElevation);
  const setDroneYaw = useGameStore((s) => s.setDroneYaw);

  const areaRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const centerRef = useRef({ x: 0, y: 0 });

  const maxRadius = JOYSTICK_SIZE / 2 - DOT_SIZE / 2;

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    centerRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - centerRef.current.x;
    const dy = e.clientY - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, maxRadius);
    const scale = dist > 0 ? clamped / dist : 0;
    const cx = dx * scale;
    const cy = dy * scale;
    setOffset({ x: cx, y: cy });
    // Horizontal = yaw, Vertical = elevation (inverted: drag up = positive)
    setDroneYaw(cx / maxRadius);
    setDroneElevation(-cy / maxRadius);
  }, [dragging, maxRadius, setDroneElevation, setDroneYaw]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    setOffset({ x: 0, y: 0 });
    setDroneElevation(0);
    setDroneYaw(0);
  }, [setDroneElevation, setDroneYaw]);

  return (
    <div
      ref={areaRef}
      className="relative rounded-2xl overflow-hidden touch-none cursor-pointer bg-black/40 backdrop-blur-sm border-2 border-blue-400/50 flex items-center justify-center"
      style={{ width: JOYSTICK_SIZE, height: JOYSTICK_HEIGHT }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-blue-300 pointer-events-none drop-shadow-lg">
        VIEW
      </div>
      <div className="absolute w-px h-12 bg-white/20 pointer-events-none" style={{ left: JOYSTICK_SIZE / 2, top: JOYSTICK_HEIGHT / 2 - 24 }} />
      <div className="absolute h-px w-12 bg-white/20 pointer-events-none" style={{ top: JOYSTICK_HEIGHT / 2, left: JOYSTICK_SIZE / 2 - 24 }} />
      <div
        className={`absolute rounded-full ${dragging ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-white'}`}
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          left: JOYSTICK_SIZE / 2 - DOT_SIZE / 2 + offset.x,
          top: JOYSTICK_HEIGHT / 2 - DOT_SIZE / 2 + offset.y,
        }}
      />
    </div>
  );
}

/**
 * Full drone controls bar: PAN (left) — DRONE toggle (center) — ELEV (right)
 */
function DroneControls() {
  const setDroneMode = useGameStore((s) => s.setDroneMode);

  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-4 z-40">
      <DroneJoystick />
      <button
        className="px-5 py-2 rounded-full text-sm font-bold transition-colors backdrop-blur-sm bg-blue-500/60 text-white border border-blue-400 mb-4"
        onClick={() => setDroneMode(false)}
      >
        DRONE
      </button>
      <ElevJoystick />
    </div>
  );
}

/**
 * Swing area with draggable dot and trail — 3-lane layout with curve tracking
 */
export function SwingButton() {
  const droneMode = useGameStore((s) => s.droneMode);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const setSwingPhase = useGameStore((s) => s.setSwingPhase);
  const setSwingResult = useGameStore((s) => s.setSwingResult);
  const swingResult = useGameStore((s) => s.swingResult);
  const pullProgress = useGameStore((s) => s.pullProgress);
  const setPullProgress = useGameStore((s) => s.setPullProgress);
  const gameMode = useGameStore((s) => s.gameMode);
  const gameComplete = useGameStore((s) => s.gameComplete);
  const nextShot = useGameStore((s) => s.nextShot);
  const nextTopgolfShot = useGameStore((s) => s.nextTopgolfShot);

  const spinBumps = useGameStore((s) => s.spinBumps);
  const addSpinBump = useGameStore((s) => s.addSpinBump);

  const [dotPosition, setDotPosition] = useState({ x: AREA_WIDTH / 2, y: AREA_HEIGHT / 2 });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [liveSpin, setLiveSpin] = useState(0);

  const gestureRef = useRef<GestureData | null>(null);
  const curveRef = useRef<CurveSample[]>([]);
  const upswingDetectedRef = useRef(false);
  const areaRef = useRef<HTMLDivElement>(null);

  // Reset dot position when swing resets
  useEffect(() => {
    if (swingPhase === 'ready') {
      setDotPosition({ x: AREA_WIDTH / 2, y: AREA_HEIGHT / 2 });
      setTrail([]);
      setLiveSpin(0);
      curveRef.current = [];
      upswingDetectedRef.current = false;
    }
  }, [swingPhase]);

  const getRelativePosition = useCallback((clientX: number, clientY: number) => {
    if (!areaRef.current) return { x: AREA_WIDTH / 2, y: AREA_HEIGHT / 2 };
    const rect = areaRef.current.getBoundingClientRect();
    return {
      x: Math.max(DOT_SIZE / 2, Math.min(AREA_WIDTH - DOT_SIZE / 2, clientX - rect.left)),
      y: Math.max(DOT_SIZE / 2, Math.min(AREA_HEIGHT - DOT_SIZE / 2, clientY - rect.top)),
    };
  }, []);

  const getClientPosition = useCallback((e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }, []);

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (swingPhase !== 'ready') return;
    e.preventDefault();

    const client = getClientPosition(e);
    const pos = getRelativePosition(client.x, client.y);

    gestureRef.current = {
      startY: client.y,
      startX: client.x,
      startTime: Date.now(),
      pullEndY: client.y,
      pullEndX: client.x,
      pullEndTime: Date.now(),
      maxPullDistance: 0,
      lastY: client.y,
      lastTime: Date.now(),
    };

    curveRef.current = [];
    upswingDetectedRef.current = false;
    setLiveSpin(0);

    setDotPosition(pos);
    setTrail([{ x: pos.x, y: pos.y, speed: 0, time: Date.now() }]);
    setIsDragging(true);
    setSwingPhase('pulling');
  }, [swingPhase, getClientPosition, getRelativePosition, setSwingPhase]);

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!gestureRef.current || !isDragging) return;
    e.preventDefault();

    const client = getClientPosition(e);
    const pos = getRelativePosition(client.x, client.y);
    const now = Date.now();
    const gesture = gestureRef.current;

    // Calculate speed
    const timeDelta = now - gesture.lastTime;
    const distanceDelta = Math.abs(client.y - gesture.lastY);
    const speed = timeDelta > 0 ? distanceDelta / timeDelta : 0;

    // Track pull distance
    const pullDistance = client.y - gesture.startY;
    if (pullDistance > gesture.maxPullDistance) {
      gesture.maxPullDistance = pullDistance;
      gesture.pullEndY = client.y;
      gesture.pullEndX = client.x;
      gesture.pullEndTime = now;
    }

    // Update pull progress (0-1) based on max pull distance
    const progress = Math.min(1, gesture.maxPullDistance / MAX_PULL_DISTANCE);
    setPullProgress(progress);

    // Detect upswing: finger is moving upward past the pull-end position
    if (!upswingDetectedRef.current && client.y < gesture.pullEndY - 5) {
      upswingDetectedRef.current = true;
    }

    // Record curve samples during upswing
    if (upswingDetectedRef.current && areaRef.current) {
      const rect = areaRef.current.getBoundingClientRect();
      const posX = client.x - rect.left;
      const centerX = AREA_WIDTH / 2;
      const normalizedX = (posX - centerX) / HALF_WIDTH; // -1 to 1

      const swingRange = gesture.pullEndY - gesture.startY;
      const yProgress = swingRange > 0
        ? Math.max(0, Math.min(1, (gesture.pullEndY - client.y) / swingRange))
        : 0;

      curveRef.current.push({ normalizedX, yProgress });

      // Compute live sidespin for indicator
      if (curveRef.current.length >= 3) {
        const spin = computeContinuousSidespin(curveRef.current);
        setLiveSpin(spin);
      }
    }

    gesture.lastY = client.y;
    gesture.lastTime = now;

    setDotPosition(pos);
    setTrail((prev) => [...prev.slice(-50), { x: pos.x, y: pos.y, speed, time: now }]);
  }, [isDragging, getClientPosition, getRelativePosition, setPullProgress]);

  const handleEnd = useCallback((e: TouchEvent | MouseEvent) => {
    if (!gestureRef.current || !isDragging) return;

    const client = getClientPosition(e);
    const pos = getRelativePosition(client.x, client.y);
    const gesture = gestureRef.current;

    const pullDistance = gesture.maxPullDistance;
    const swingDistance = gesture.pullEndY - client.y;

    setIsDragging(false);
    setLiveSpin(0);

    // Fail conditions:
    // 1. Didn't pull down enough
    // 2. Didn't swing up enough distance
    // 3. Release position is still in bottom half (didn't cross halfway)
    const halfwayY = AREA_HEIGHT / 2;
    const releasedInBottomHalf = pos.y > halfwayY;
    if (pullDistance < 30 || swingDistance < 30 || releasedInBottomHalf) {
      gestureRef.current = null;
      curveRef.current = [];
      setSwingPhase('ready');
      setPullProgress(0);
      return;
    }

    // Power is determined by the PowerArc timing (read directly from store for latest value)
    const power = useGameStore.getState().arcPower;

    // Accuracy based on path smoothness (jitter), not horizontal deviation
    const samples = curveRef.current;
    let jitter = 0;
    if (samples.length > 2) {
      let totalDeltaX = 0;
      for (let i = 1; i < samples.length; i++) {
        totalDeltaX += Math.abs(samples[i].normalizedX - samples[i - 1].normalizedX);
      }
      jitter = totalDeltaX / (samples.length - 1);
    }
    const accuracy = Math.max(0, Math.round(100 - jitter * 300));

    const score = Math.round((power * 0.5 + accuracy * 0.5));

    // Compute sidespin from curve accumulator
    const sidespin = computeContinuousSidespin(samples);

    // Direction: average normalizedX of the last few upswing samples (inverted)
    const dirSamples = samples.slice(-Math.min(5, samples.length));
    let avgNormX = 0;
    if (dirSamples.length > 0) {
      avgNormX = dirSamples.reduce((sum, s) => sum + s.normalizedX, 0) / dirSamples.length;
    }
    const direction = Math.max(-1, Math.min(1, -avgNormX));

    // Classify shot type
    const shotType = classifyShotType(sidespin, direction);

    setSwingPhase('swinging');
    setSwingResult({ power, accuracy, score, direction, sidespin, shotType, distanceToHole: 0, shotScore: 0, surface: '' });

    // Ball landing will trigger 'finished' state via landBall() in gameStore

    gestureRef.current = null;
    curveRef.current = [];
  }, [isDragging, getClientPosition, getRelativePosition, setSwingPhase, setSwingResult, setPullProgress]);

  // Add global mouse/touch listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Drone mode: show full controls bar (after all hooks)
  if (droneMode) return <DroneControls />;

  const handleClick = () => {
    if (swingPhase === 'finished') {
      if (gameComplete) return; // GameEndModal handles completion
      if (gameMode === 'topgolf') {
        nextTopgolfShot();
      } else {
        nextShot();
      }
    }
  };

  // Render trail as SVG path
  const renderTrail = () => {
    if (trail.length < 2) return null;

    return trail.slice(1).map((point, i) => {
      const prev = trail[i];
      const opacity = Math.min(1, point.speed * 2 + 0.2);
      const age = (Date.now() - point.time) / 500;
      const fadeOpacity = Math.max(0, opacity - age);

      return (
        <line
          key={i}
          x1={prev.x}
          y1={prev.y}
          x2={point.x}
          y2={point.y}
          stroke={`rgba(59, 130, 246, ${fadeOpacity})`}
          strokeWidth={3}
          strokeLinecap="round"
        />
      );
    });
  };

  // Live spin indicator label
  const liveLabel = Math.abs(liveSpin) > 0.15
    ? (liveSpin < 0 ? 'DRAW' : 'FADE')
    : null;

  // Shot type display config
  const shotTypeConfig: Record<string, { label: string; color: string }> = {
    straight: { label: 'STRAIGHT', color: 'text-white' },
    draw: { label: 'DRAW', color: 'text-cyan-400' },
    fade: { label: 'FADE', color: 'text-amber-400' },
    big_draw: { label: 'BIG DRAW', color: 'text-cyan-300' },
    big_fade: { label: 'BIG FADE', color: 'text-amber-300' },
    push: { label: 'PUSH', color: 'text-orange-400' },
    pull: { label: 'PULL', color: 'text-orange-400' },
  };

  const shotCfg = swingResult ? shotTypeConfig[swingResult.shotType] || { label: 'STRAIGHT', color: 'text-white' } : null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      {/* Swing Area */}
      <div
        ref={areaRef}
        onMouseDown={swingPhase === 'ready' ? handleStart : undefined}
        onTouchStart={swingPhase === 'ready' ? handleStart : undefined}
        onClick={handleClick}
        className={`
          relative rounded-2xl overflow-hidden touch-none cursor-pointer
          transition-all duration-200
          ${swingPhase === 'finished' ? 'bg-blue-500/30' : 'bg-white/20'}
          backdrop-blur-sm border-2
          ${isDragging ? 'border-blue-400 scale-105' : 'border-white/30'}
        `}
        style={{ width: AREA_WIDTH, height: AREA_HEIGHT }}
      >
        {/* Trail SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {renderTrail()}
        </svg>

        {/* Lane dividers (2 lines creating 3 lanes) */}
        <div className="absolute top-4 bottom-4 w-px bg-white/15 pointer-events-none" style={{ left: LANE_WIDTH }} />
        <div className="absolute top-4 bottom-4 w-px bg-white/15 pointer-events-none" style={{ left: LANE_WIDTH * 2 }} />

        {/* Instructions inside the area */}
        {(swingPhase === 'ready' || swingPhase === 'pulling') && (
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-center leading-snug pointer-events-none drop-shadow-lg ${pullProgress >= 0.5 ? 'text-orange-400' : 'text-white'}`}>
            {pullProgress >= 0.5 ? (
              <>Swing<br />up!</>
            ) : (
              <>Pull<br />down</>
            )}
          </div>
        )}

        {/* Draggable dot — hidden when outcome overlay is showing */}
        <div
          className={`
            absolute rounded-full transition-all duration-75
            ${isDragging ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-white'}
            ${swingPhase === 'swinging' ? 'bg-green-400 opacity-0' : ''}
            ${swingPhase === 'finished' ? 'bg-blue-400 opacity-0' : ''}
          `}
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            left: dotPosition.x - DOT_SIZE / 2,
            top: dotPosition.y - DOT_SIZE / 2,
          }}
        />

        {/* Live spin indicator during upswing */}
        {isDragging && liveLabel && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className={`text-xs font-bold drop-shadow-lg ${liveSpin < 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {liveLabel}
            </span>
          </div>
        )}

        {/* 3x3 Spin Bump Grid — shown during flight (swinging phase) */}
        {swingPhase === 'swinging' && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: 'auto' }}
          >
            <div
              className="grid grid-cols-3"
              style={{ width: AREA_WIDTH, height: AREA_WIDTH }}
            >
              {Array.from({ length: 9 }).map((_, gridIndex) => {
                const isCenter = gridIndex === 4;
                const dirIndex = gridIndex < 4 ? gridIndex : gridIndex - 1;
                const arrows = ['↖', '↑', '↗', '←', '', '→', '↙', '↓', '↘'];
                const remaining = spinBumps.maxBumps - spinBumps.totalUsed;

                if (isCenter) {
                  return (
                    <div
                      key={gridIndex}
                      className="flex flex-col items-center justify-center"
                      style={{ width: 44, height: 44 }}
                    >
                      <div className="w-3 h-3 rounded-full bg-white" />
                      <div className={`text-[10px] font-bold mt-0.5 tabular-nums ${remaining > 0 ? 'text-white' : 'text-white/40'}`}>
                        {remaining}
                      </div>
                    </div>
                  );
                }

                const count = spinBumps.allocations[dirIndex];
                const hasAllocation = count > 0;
                const canAllocate = remaining > 0;

                return (
                  <button
                    key={gridIndex}
                    className={`
                      flex items-center justify-center relative
                      text-sm font-bold transition-colors duration-100 rounded
                      ${hasAllocation ? 'bg-blue-500/40 text-blue-300' : canAllocate ? 'text-white/60 hover:bg-white/10 active:bg-white/20' : 'text-white/25'}
                    `}
                    style={{ width: 44, height: 44 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      addSpinBump(dirIndex);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      addSpinBump(dirIndex);
                    }}
                  >
                    {arrows[gridIndex]}
                    {hasAllocation && (
                      <span className="absolute top-0.5 right-0.5 text-[8px] text-blue-300 font-bold">
                        x{count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Shot outcome overlay — shown after ball lands (finished phase) */}
        {swingPhase === 'finished' && swingResult && shotCfg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
            {/* Shot type label */}
            <div className={`text-base font-black ${shotCfg.color} drop-shadow-lg leading-none`}>
              {shotCfg.label}
            </div>

            {/* Compact stats */}
            <div className="mt-1.5 flex gap-3 text-center">
              <div>
                <div className="text-xs font-bold text-orange-400 tabular-nums">{Math.round(swingResult.power)}</div>
                <div className="text-[9px] text-gray-400 uppercase leading-none">Pwr</div>
              </div>
              <div>
                <div className="text-xs font-bold text-blue-400 tabular-nums">{Math.round(swingResult.accuracy)}</div>
                <div className="text-[9px] text-gray-400 uppercase leading-none">Acc</div>
              </div>
              {Math.abs(swingResult.sidespin) >= 0.05 && (
                <div>
                  <div className={`text-xs font-bold tabular-nums ${swingResult.sidespin < 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {swingResult.sidespin < 0 ? '◀' : '▶'}{Math.round(Math.abs(swingResult.sidespin) * 100)}
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase leading-none">Spin</div>
                </div>
              )}
            </div>

            {/* Tap prompt */}
            {!gameComplete && (
              <div className="mt-2 text-[10px] text-white/50 font-medium">
                tap → next
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
