import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';

/**
 * Power Bar component for golf swing timing
 * Displays a vertical bar with a moving pointer - timing determines shot power
 */

// Bar configuration
const BAR_WIDTH = 20;
const BAR_HEIGHT = 200;
const POINTER_HEIGHT = 8;

// Timing configuration
const POINTER_CYCLE_MS = 1200; // Time for pointer to go from 0% to 100%

// Zone configuration
const SWEET_SPOT_START = 0.70; // 70% along the bar - white zone starts
const SWEET_SPOT_END = 0.90;   // 90% - white zone ends
const DANGER_ZONE_START = 0.90; // 90% - red danger zone starts
const DANGER_ZONE_END = 1.0;   // 100% (end of bar)

// Pull progress threshold to start bar animation
const PULL_COMPLETE_THRESHOLD = 0.95;

interface PowerArcProps {
  visible: boolean;
  onPowerCapture?: (power: number) => void;
}

export function PowerArc({ visible, onPowerCapture }: PowerArcProps) {
  const swingPhase = useGameStore((s) => s.swingPhase);
  const pullProgress = useGameStore((s) => s.pullProgress);
  const [progress, setProgress] = useState(0);
  const [capturedPower, setCapturedPower] = useState<number | null>(null);
  const [barStarted, setBarStarted] = useState(false);
  const [shouldFade, setShouldFade] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const barStartedRef = useRef(false);

  // Calculate power from progress
  const calculatePower = useCallback((progress: number): number => {
    if (progress >= DANGER_ZONE_START) {
      // Red zone - penalty for overshooting
      const overshoot = (progress - DANGER_ZONE_START) / (DANGER_ZONE_END - DANGER_ZONE_START);
      return Math.round(100 - overshoot * 30); // 100% -> 70%
    } else if (progress >= SWEET_SPOT_START) {
      // White zone - sweet spot = 100% power
      return 100;
    } else {
      // Gray zone - building up power
      return Math.round((progress / SWEET_SPOT_START) * 85); // 0% -> 85%
    }
  }, []);

  // Animate the pointer along the bar
  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    // Progress goes from 0 to 1 over POINTER_CYCLE_MS
    const newProgress = Math.min(1, elapsed / POINTER_CYCLE_MS);
    setProgress(newProgress);
    progressRef.current = newProgress;

    // Continuously update power as pointer moves
    const power = calculatePower(newProgress);
    onPowerCapture?.(power);

    // Continue animation if not at end
    if (newProgress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [calculatePower, onPowerCapture]);

  // Check pull progress and start bar animation when threshold is reached
  useEffect(() => {
    if (swingPhase === 'pulling' && pullProgress >= PULL_COMPLETE_THRESHOLD && !barStartedRef.current) {
      barStartedRef.current = true;
      setBarStarted(true);
      setProgress(0);
      progressRef.current = 0;
      setCapturedPower(null);
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [swingPhase, pullProgress, animate]);

  // Handle swing phase transitions
  useEffect(() => {
    if (swingPhase === 'swinging') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      const power = calculatePower(progressRef.current);
      setCapturedPower(power);

      setShouldFade(false);
      fadeTimeoutRef.current = window.setTimeout(() => {
        setShouldFade(true);
      }, 100);
    } else if (swingPhase === 'ready' || swingPhase === 'finished') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setProgress(0);
      progressRef.current = 0;
      setCapturedPower(null);
      barStartedRef.current = false;
      setBarStarted(false);
      setShouldFade(false);
    }
  }, [swingPhase, calculatePower]);

  // Calculate pointer position (bottom = 0%, top = 100%)
  const pointerY = BAR_HEIGHT * (1 - progress);

  // Determine zone
  const inSweetSpot = progress >= SWEET_SPOT_START && progress < SWEET_SPOT_END;
  const inDangerZone = progress >= DANGER_ZONE_START;

  // Get pointer color based on zone
  const getPointerColor = () => {
    if (inSweetSpot) return '#ffffff';
    if (inDangerZone) return '#ff3333';
    return '#ff8844';
  };

  const getPointerGlow = () => {
    if (inSweetSpot) return '0 0 12px rgba(255,255,255,0.9), 0 0 20px rgba(0,255,0,0.5)';
    if (inDangerZone) return '0 0 12px rgba(255,50,50,0.8)';
    return '0 0 8px rgba(255,150,50,0.6)';
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        right: '30px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        opacity: swingPhase === 'ready' || shouldFade ? 0.3 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      {/* Container for bar and label */}
      <div style={{ position: 'relative' }}>
        {/* Power percentage display */}
        {!shouldFade && (barStarted || capturedPower !== null) && (
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              fontFamily: 'sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {capturedPower !== null
              ? `${capturedPower}%`
              : `${Math.round(progress * 100)}%`}
          </div>
        )}

        {/* Bar container */}
        <div
          style={{
            width: BAR_WIDTH,
            height: BAR_HEIGHT,
            borderRadius: BAR_WIDTH / 2,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {/* Background (dark) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(60, 60, 60, 0.6)',
            }}
          />

          {/* Gray zone (0% - 70%) - bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${SWEET_SPOT_START * 100}%`,
              background: 'linear-gradient(to top, rgba(100,100,100,0.9), rgba(150,150,150,0.9))',
            }}
          />

          {/* White zone (70% - 90%) - SWEET SPOT */}
          <div
            style={{
              position: 'absolute',
              bottom: `${SWEET_SPOT_START * 100}%`,
              left: 0,
              right: 0,
              height: `${(SWEET_SPOT_END - SWEET_SPOT_START) * 100}%`,
              background: 'linear-gradient(to top, #ffffff, #f0f0f0)',
              boxShadow: '0 0 10px rgba(255,255,255,0.8)',
            }}
          />

          {/* Red zone (90% - 100%) - DANGER ZONE (top) */}
          <div
            style={{
              position: 'absolute',
              bottom: `${DANGER_ZONE_START * 100}%`,
              left: 0,
              right: 0,
              height: `${(DANGER_ZONE_END - DANGER_ZONE_START) * 100}%`,
              background: 'linear-gradient(to top, #ff4444, #cc0000)',
            }}
          />

          {/* Pointer - only show after animation has started */}
          {(barStarted || swingPhase === 'swinging') && (
            <div
              style={{
                position: 'absolute',
                left: -4,
                right: -4,
                height: POINTER_HEIGHT,
                top: pointerY - POINTER_HEIGHT / 2,
                background: getPointerColor(),
                borderRadius: POINTER_HEIGHT / 2,
                boxShadow: getPointerGlow(),
                border: inSweetSpot ? '2px solid #00ff00' : inDangerZone ? '2px solid #aa0000' : '2px solid #cc6600',
              }}
            />
          )}
        </div>

        {/* Zone labels */}
        <div
          style={{
            position: 'absolute',
            right: BAR_WIDTH + 8,
            top: 0,
            height: BAR_HEIGHT,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.7)',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            fontFamily: 'sans-serif',
          }}
        >
          <span>100</span>
          <span style={{ marginTop: 'auto', marginBottom: 'auto' }}>50</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
}

export { SWEET_SPOT_START, SWEET_SPOT_END };
