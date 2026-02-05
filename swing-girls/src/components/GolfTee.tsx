import { useMemo } from 'react';
import { LatheGeometry, Vector2 } from 'three';

interface GolfTeeProps {
  position: [number, number, number];
}

/**
 * Golf tee - a tapered peg shape with a cup on top for the ball
 * Returns the height of the tee (where the ball should sit)
 */
export const TEE_HEIGHT = 0.08; // 8cm tall tee
export const TEE_CUP_RADIUS = 0.025; // Cup radius to hold the ball

export function GolfTee({ position }: GolfTeeProps) {
  // Create tee profile using lathe geometry for realistic shape
  const teeGeometry = useMemo(() => {
    // Create profile points for the tee (from bottom to top)
    // Format: Vector2(radius, height)
    const points = [
      new Vector2(0.005, 0),           // Bottom point (spike)
      new Vector2(0.008, 0.02),        // Lower spike
      new Vector2(0.010, 0.04),        // Mid spike
      new Vector2(0.012, 0.06),        // Upper spike
      new Vector2(0.018, 0.07),        // Flare start
      new Vector2(TEE_CUP_RADIUS, 0.075), // Cup outer edge
      new Vector2(TEE_CUP_RADIUS, TEE_HEIGHT), // Cup top outer
      new Vector2(0.018, TEE_HEIGHT),  // Cup top inner (concave)
    ];

    return new LatheGeometry(points, 16);
  }, []);

  return (
    <mesh
      position={position}
      geometry={teeGeometry}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color="#d4a574" // Wood/tan color
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}
