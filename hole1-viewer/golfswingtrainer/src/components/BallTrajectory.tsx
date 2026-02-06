import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

const MAX_POINTS = 30;
// Sample every N frames to spread the trail over more distance
const SAMPLE_INTERVAL = 3;

export function BallTrajectory() {
  const ball = useGameStore((s) => s.ball);

  const geomRef = useRef<THREE.BufferGeometry>(null);
  const writeIndex = useRef(0);
  const pointCount = useRef(0);
  const wasFlying = useRef(false);
  const frameCounter = useRef(0);

  // Pre-allocate buffers
  const positions = useMemo(() => new Float32Array(MAX_POINTS * 3), []);
  const colors = useMemo(() => new Float32Array(MAX_POINTS * 4), []);

  useFrame(() => {
    if (!geomRef.current) return;

    const isFlying = ball.isFlying;

    // Clear buffer on transition to not-flying
    if (wasFlying.current && !isFlying) {
      pointCount.current = 0;
      writeIndex.current = 0;
      frameCounter.current = 0;
      // Zero out draw range
      geomRef.current.setDrawRange(0, 0);
      wasFlying.current = false;
      return;
    }

    wasFlying.current = isFlying;

    if (!isFlying) return;

    // Only sample every SAMPLE_INTERVAL frames
    frameCounter.current++;
    if (frameCounter.current % SAMPLE_INTERVAL !== 0) return;

    // Write new position into ring buffer
    const idx = writeIndex.current;
    positions[idx * 3] = ball.position[0];
    positions[idx * 3 + 1] = ball.position[1];
    positions[idx * 3 + 2] = ball.position[2];

    writeIndex.current = (idx + 1) % MAX_POINTS;
    if (pointCount.current < MAX_POINTS) pointCount.current++;

    // Build ordered positions + colors from ring buffer
    const count = pointCount.current;
    const start = (writeIndex.current - count + MAX_POINTS) % MAX_POINTS;

    const posAttr = geomRef.current.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geomRef.current.getAttribute('color') as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const srcIdx = (start + i) % MAX_POINTS;
      // Alpha: oldest (i=0) → 0, newest (i=count-1) → 1
      const alpha = count > 1 ? i / (count - 1) : 1;

      posAttr.array[i * 3] = positions[srcIdx * 3];
      posAttr.array[i * 3 + 1] = positions[srcIdx * 3 + 1];
      posAttr.array[i * 3 + 2] = positions[srcIdx * 3 + 2];

      // White color with fading alpha
      colAttr.array[i * 4] = 0.3;
      colAttr.array[i * 4 + 1] = 0.8;
      colAttr.array[i * 4 + 2] = 0.77;
      colAttr.array[i * 4 + 3] = alpha;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geomRef.current.setDrawRange(0, count);
  });

  return (
    <line>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          array={new Float32Array(MAX_POINTS * 3)}
          count={MAX_POINTS}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={new Float32Array(MAX_POINTS * 4)}
          count={MAX_POINTS}
          itemSize={4}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        depthWrite={false}
        linewidth={1}
      />
    </line>
  );
}
