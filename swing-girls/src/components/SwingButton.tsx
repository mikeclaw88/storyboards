import { useRef, useCallback, useState, useEffect } from 'react';
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

const AREA_WIDTH = 60;
const AREA_HEIGHT = 120;
const DOT_SIZE = 28;
const MAX_PULL_DISTANCE = 60; // Max pull distance in pixels for 100% progress

/**
 * Swing area with draggable dot and trail
 */
export function SwingButton() {
  const swingPhase = useGameStore((s) => s.swingPhase);
  const setSwingPhase = useGameStore((s) => s.setSwingPhase);
  const setSwingResult = useGameStore((s) => s.setSwingResult);
  const pullProgress = useGameStore((s) => s.pullProgress);
  const setPullProgress = useGameStore((s) => s.setPullProgress);
  const resetSwing = useGameStore((s) => s.resetSwing);
  const gameMode = useGameStore((s) => s.gameMode);
  const gameComplete = useGameStore((s) => s.topgolf.gameComplete);
  const nextTopgolfShot = useGameStore((s) => s.nextTopgolfShot);

  const [dotPosition, setDotPosition] = useState({ x: AREA_WIDTH / 2, y: AREA_HEIGHT / 2 });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const gestureRef = useRef<GestureData | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  // Reset dot position when swing resets
  useEffect(() => {
    if (swingPhase === 'ready') {
      setDotPosition({ x: AREA_WIDTH / 2, y: AREA_HEIGHT / 2 });
      setTrail([]);
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

    // Calculate speed
    const timeDelta = now - gestureRef.current.lastTime;
    const distanceDelta = Math.abs(client.y - gestureRef.current.lastY);
    const speed = timeDelta > 0 ? distanceDelta / timeDelta : 0;

    // Track pull distance
    const pullDistance = client.y - gestureRef.current.startY;
    if (pullDistance > gestureRef.current.maxPullDistance) {
      gestureRef.current.maxPullDistance = pullDistance;
      gestureRef.current.pullEndY = client.y;
      gestureRef.current.pullEndX = client.x;
      gestureRef.current.pullEndTime = now;
    }

    // Update pull progress (0-1) based on max pull distance
    const progress = Math.min(1, gestureRef.current.maxPullDistance / MAX_PULL_DISTANCE);
    setPullProgress(progress);

    gestureRef.current.lastY = client.y;
    gestureRef.current.lastTime = now;

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
    const horizontalDeviation = Math.abs(client.x - gesture.startX);

    setIsDragging(false);

    // Fail conditions:
    // 1. Didn't pull down enough
    // 2. Didn't swing up enough distance
    // 3. Release position is still in bottom half (didn't cross halfway)
    const halfwayY = AREA_HEIGHT / 2;
    const releasedInBottomHalf = pos.y > halfwayY;
    if (pullDistance < 30 || swingDistance < 30 || releasedInBottomHalf) {
      gestureRef.current = null;
      setSwingPhase('ready');
      setPullProgress(0);
      return;
    }

    // Power is determined by the PowerArc timing (read directly from store for latest value)
    // Accuracy is still based on horizontal deviation
    const power = useGameStore.getState().arcPower;
    const accuracy = Math.max(0, 100 - horizontalDeviation * 2);
    const score = Math.round((power * 0.5 + accuracy * 0.5));

    // Calculate direction based on horizontal movement during swing
    // Invert: drag right = ball goes left, drag left = ball goes right
    const horizontalMove = client.x - gesture.pullEndX;
    // Normalize to -1 to 1 range (40px movement = full direction), inverted
    const direction = Math.max(-1, Math.min(1, -horizontalMove / 40));

    setSwingPhase('swinging');
    setSwingResult({ power, accuracy, score, direction });

    // Ball landing will trigger 'finished' state via landBall() in gameStore

    gestureRef.current = null;
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

  const handleClick = () => {
    if (swingPhase === 'finished') {
      // In topgolf mode, advance to next shot (unless game is complete)
      if (gameMode === 'topgolf' && !gameComplete) {
        nextTopgolfShot();
      } else if (gameMode === 'practice') {
        resetSwing();
      }
      // If topgolf game is complete, don't do anything - the game end screen handles it
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

        {/* Center guide line */}
        <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/20 -translate-x-1/2" />

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

        {/* Draggable dot */}
        <div
          className={`
            absolute rounded-full transition-transform duration-75
            ${isDragging ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-white'}
            ${swingPhase === 'swinging' ? 'bg-green-400' : ''}
            ${swingPhase === 'finished' ? 'bg-blue-400' : ''}
          `}
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            left: dotPosition.x - DOT_SIZE / 2,
            top: dotPosition.y - DOT_SIZE / 2,
          }}
        />

        {/* Finished state text */}
        {swingPhase === 'finished' && !gameComplete && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {gameMode === 'topgolf' ? 'Next' : 'Retry'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
