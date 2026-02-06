import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, MathUtils } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../stores/gameStore';

export type CameraMode = 'TEE_STATIC' | 'BALL_FOLLOW' | 'LANDING' | 'FREEROAM';

interface CameraSystemProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  freeRoam: boolean;
}

export function CameraSystem({ controlsRef, freeRoam }: CameraSystemProps) {
  const { camera } = useThree();
  const ball = useGameStore((s) => s.ball);
  const screenMode = useGameStore((s) => s.screenMode);
  const swingPhase = useGameStore((s) => s.swingPhase);
  const holePosition = useGameStore((s) => s.holePosition);
  
  // Internal State
  const modeRef = useRef<CameraMode>('TEE_STATIC');
  const targetPosRef = useRef(new Vector3()); // Where we are looking
  const cameraPosRef = useRef(new Vector3()); // Where the camera is
  
  // Constants
  const TEE_OFFSET = new Vector3(0, 2, -4); // Behind player
  const LANDING_OFFSET = new Vector3(0, 10, -10); // High angle view of landing
  
  // Transition logic
  useEffect(() => {
    if (freeRoam) {
      modeRef.current = 'FREEROAM';
      return;
    }

    if (screenMode === 'selection') {
       modeRef.current = 'TEE_STATIC'; // Use Selection cam logic eventually
       return;
    }

    if (swingPhase === 'swinging' && ball.isFlying) {
      // Delay switching to follow until ball is slightly away?
      const dist = Math.sqrt(ball.position[0]**2 + ball.position[2]**2);
      if (dist > 5) {
        modeRef.current = 'BALL_FOLLOW';
      }
    } else if (swingPhase === 'finished' || (swingPhase === 'swinging' && !ball.isFlying)) {
      // Ball landed
      if (modeRef.current === 'BALL_FOLLOW') {
        modeRef.current = 'LANDING';
      } else {
        modeRef.current = 'TEE_STATIC';
      }
    } else {
      modeRef.current = 'TEE_STATIC';
    }
    
  }, [swingPhase, ball.isFlying, freeRoam, screenMode, ball.position]);

  useFrame((state, delta) => {
    if (freeRoam || !controlsRef.current) return;
    
    const controls = controlsRef.current;
    const mode = modeRef.current;
    
    // Ball Position Vector
    const ballV = new Vector3(ball.position[0], ball.position[1], ball.position[2]);
    const holeV = new Vector3(holePosition[0], holePosition[1], holePosition[2]);

    if (mode === 'TEE_STATIC') {
      // Look at ball (or tee if ball is 0,0,0) from behind
      // Ideal position: Behind player, slightly right (for right-handed)
      // Current TEE_OFFSET is just behind (0, 2, -4)
      
      const desiredPos = new Vector3(0, 1.5, -4.5); // Fixed Tee Cam
      const desiredTarget = new Vector3(0, 1, 10); // Look down fairway
      
      // Smooth lerp
      camera.position.lerp(desiredPos, delta * 2);
      controls.target.lerp(desiredTarget, delta * 2);
    }
    else if (mode === 'BALL_FOLLOW') {
      // Pro TV Style: 
      // Camera is behind-ish the ball, but elevated.
      // Or from the side?
      // Let's do "Broadcast Wire Cam": Behind and Up.
      
      const velocity = new Vector3(ball.velocity[0], ball.velocity[1], ball.velocity[2]);
      const speed = velocity.length();
      
      // Dynamic offset based on speed/height
      const followDist = 8 + (speed * 0.1); 
      const followHeight = 3 + (ball.position[1] * 0.5); 
      
      // Calculate position behind ball velocity vector
      // If velocity is near zero (apex vertical), use direction to hole
      let direction = velocity.clone().normalize();
      if (speed < 1) {
         direction = holeV.clone().sub(ballV).normalize();
      }
      
      // Position: Ball - Direction * Dist + Up * Height
      const desiredPos = ballV.clone()
        .sub(direction.multiplyScalar(followDist))
        .add(new Vector3(0, followHeight, 0));
        
      // Constraint: Don't go below ground
      if (desiredPos.y < 1) desiredPos.y = 1;

      // Lerp camera
      camera.position.lerp(desiredPos, delta * 3);
      controls.target.lerp(ballV, delta * 5); // Look tightly at ball
    }
    else if (mode === 'LANDING') {
      // Static view of where the ball IS (landed)
      // Maybe slightly orbiting?
      
      const desiredPos = ballV.clone().add(new Vector3(5, 5, 5));
      camera.position.lerp(desiredPos, delta * 1);
      controls.target.lerp(ballV, delta * 2);
    }

    controls.update();
  });

  return null;
}
