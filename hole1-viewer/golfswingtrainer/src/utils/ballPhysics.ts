/**
 * Golf ball physics utilities
 * Realistic trajectory with gravity, air drag, and Magnus effect (backspin lift)
 */

// Physics constants
export const GRAVITY = 9.81; // m/s^2

// Golf ball aerodynamics
const BALL_MASS = 0.0459; // kg (golf ball mass)
export const BALL_RADIUS = 0.02135; // m (golf ball radius)
const BALL_AREA = Math.PI * BALL_RADIUS * BALL_RADIUS; // cross-sectional area

// Collision offset: ball radius + small margin to prevent ground clipping
const COLLISION_OFFSET = BALL_RADIUS * 1.2; // 20% larger than actual radius for safety
const AIR_DENSITY = 1.225; // kg/m^3 at sea level

// Drag coefficient (golf ball with dimples)
const DRAG_COEFFICIENT = 0.25;

// Lift coefficient from backspin (Magnus effect)
// Typical backspin: 2500-3500 RPM for irons
const LIFT_COEFFICIENT = 0.15;

// Velocity range (m/s)
export const MIN_VELOCITY = 15; // ~34 mph - very weak shot
export const MAX_VELOCITY = 70; // ~157 mph - powerful drive

// Launch angles (degrees)
export const MIN_LAUNCH_ANGLE = 12; // Low trajectory at high power
export const MAX_LAUNCH_ANGLE = 25; // Higher trajectory at low power

// Legacy export for compatibility
export const CONTACT_RATIO = 0.65;

// Surface-aware ground physics
import type { SurfaceType } from './terrainLoader';

export type TerrainSurfaceGetter = (worldX: number, worldZ: number) => SurfaceType;

const SURFACE_PHYSICS: Record<SurfaceType, { bounce: number; friction: number; sticks: boolean }> = {
  fairway: { bounce: 0.38, friction: 4.0,  sticks: false },
  rough:   { bounce: 0.22, friction: 12.0, sticks: false },
  green:   { bounce: 0.30, friction: 3.0,  sticks: false },
  sand:    { bounce: 0.05, friction: 25.0, sticks: true  },
};

// Legacy defaults (used when no surface getter is provided)
const BOUNCE_COEFFICIENT = 0.38;
const ROLLING_FRICTION = 6.0;
const MIN_BOUNCE_VELOCITY = 1.5; // Below this, ball starts rolling instead of bouncing
const MIN_ROLLING_SPEED = 0.1; // Below this, ball stops completely
const MAX_ROLLING_TIME = 15; // Maximum seconds for rolling phase before forced stop

export type BallPhase = 'flying' | 'rolling' | 'stopped';

export interface FlightState {
  position: [number, number, number];
  velocity: [number, number, number];
  time: number;
  isFlying: boolean; // Legacy: true when flying
  phase: BallPhase; // New: detailed phase tracking
  rollingStartTime?: number; // Time when rolling phase started (for timeout)
  bounceCount: number; // Number of bounces so far
  justBounced: boolean; // True if ball bounced this frame (for SFX trigger)
  impactSpeed: number; // Speed at impact (for volume calculation)
  sidespin: number; // -1 to +1, lateral curve from draw/fade swing
}

/**
 * Calculate initial velocity vector based on power, accuracy, direction, and base angle
 * Ball flies in the direction determined by camera angle + swipe direction
 * @param power - 0-100, determines launch speed
 * @param accuracy - 0-100, determines random deviation amount
 * @param direction - -1 to 1, intentional horizontal direction (-1 = left, 1 = right)
 * @param baseAngle - Camera azimuthal angle in radians (0 = +Z direction)
 * @returns velocity vector [vx, vy, vz]
 */
export function calculateInitialVelocity(
  power: number,
  accuracy: number,
  direction: number = 0,
  baseAngle: number = 0,
  clubMinAngle: number = MIN_LAUNCH_ANGLE,
  clubMaxAngle: number = MAX_LAUNCH_ANGLE,
  velocityScale: number = 1.0
): [number, number, number] {
  // Map power to velocity magnitude with exponential curve
  // This makes weak shots travel much shorter distances
  const powerRatio = power / 100;
  const curvedPower = Math.pow(powerRatio, 2); // Quadratic curve: 50% power = 25% speed
  const speed = (MIN_VELOCITY + curvedPower * (MAX_VELOCITY - MIN_VELOCITY)) * velocityScale;

  // Map power to launch angle (higher power = lower angle for distance)
  const launchAngleDeg = clubMaxAngle - (power / 100) * (clubMaxAngle - clubMinAngle);
  const launchAngleRad = (launchAngleDeg * Math.PI) / 180;

  // Direction-based angle (intentional aim from swipe)
  // Max direction angle: 12 degrees left or right
  const maxDirectionDeg = 12;
  const directionRad = (direction * maxDirectionDeg * Math.PI) / 180;

  // Accuracy-based random deviation (unintentional error)
  // 100 accuracy = no error, 0 accuracy = up to 2 degrees random error
  const maxErrorDeg = 2;
  const errorDeg = ((100 - accuracy) / 100) * maxErrorDeg * (Math.random() > 0.5 ? 1 : -1);
  const errorRad = (errorDeg * Math.PI) / 180;

  // Total horizontal angle = camera base angle + swipe direction + accuracy error
  const totalAngle = baseAngle + directionRad + errorRad;

  // Velocity components
  // Rotate velocity around Y axis based on total angle
  const horizontalSpeed = speed * Math.cos(launchAngleRad);
  const vz = horizontalSpeed * Math.cos(totalAngle); // Forward component
  const vx = horizontalSpeed * Math.sin(totalAngle); // Lateral component
  const vy = speed * Math.sin(launchAngleRad); // Upward

  return [vx, vy, vz];
}

// Sidespin lateral Magnus coefficient
const SIDESPIN_COEFFICIENT = 0.10;

// Sidespin decay rate (per second of flight time)
const SIDESPIN_DECAY_RATE = 0.3;

/**
 * Calculate aerodynamic forces on the golf ball
 * @param velocity - Current velocity [vx, vy, vz]
 * @param sidespin - Lateral spin from -1 (draw) to +1 (fade), default 0
 * @param flightTime - Time in flight (for spin decay), default 0
 * @returns acceleration from aerodynamic forces [ax, ay, az]
 */
function calculateAerodynamicForces(
  velocity: [number, number, number],
  sidespin: number = 0,
  flightTime: number = 0
): [number, number, number] {
  const [vx, vy, vz] = velocity;
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

  if (speed < 0.1) return [0, 0, 0]; // Negligible at very low speeds

  // Drag force: F_drag = 0.5 * rho * v^2 * Cd * A
  // Acceleration = F / m
  const dragMagnitude = (0.5 * AIR_DENSITY * speed * speed * DRAG_COEFFICIENT * BALL_AREA) / BALL_MASS;

  // Drag opposes velocity direction
  const dragAx = -(vx / speed) * dragMagnitude;
  const dragAy = -(vy / speed) * dragMagnitude;
  const dragAz = -(vz / speed) * dragMagnitude;

  // Magnus effect (lift from backspin)
  // Lift is perpendicular to velocity, primarily upward for backspin
  // Simplified: lift proportional to speed, acting upward
  const liftMagnitude = (0.5 * AIR_DENSITY * speed * speed * LIFT_COEFFICIENT * BALL_AREA) / BALL_MASS;

  // Lift acts perpendicular to velocity, mostly upward
  // More lift when ball is moving horizontally (backspin effect)
  const horizontalSpeed = Math.sqrt(vx * vx + vz * vz);
  const liftFactor = horizontalSpeed / (speed + 0.1); // More lift when moving horizontally
  const liftAy = liftMagnitude * liftFactor;

  // Lateral Magnus force (sidespin → draw/fade curve)
  // Perpendicular to horizontal velocity direction
  let sideForceX = 0;
  let sideForceZ = 0;
  if (Math.abs(sidespin) > 0.01 && horizontalSpeed > 0.5) {
    // Spin decays over flight time: strongest early, straightens out
    const effectiveSpin = sidespin * Math.exp(-SIDESPIN_DECAY_RATE * flightTime);

    // Perpendicular direction to horizontal velocity (rotate 90° in XZ plane)
    const perpX = -vz / horizontalSpeed;
    const perpZ = vx / horizontalSpeed;

    const sideMagnitude = (0.5 * AIR_DENSITY * speed * speed * SIDESPIN_COEFFICIENT * BALL_AREA) / BALL_MASS;
    sideForceX = perpX * sideMagnitude * effectiveSpin;
    sideForceZ = perpZ * sideMagnitude * effectiveSpin;
  }

  return [dragAx + sideForceX, dragAy + liftAy, dragAz + sideForceZ];
}

/**
 * Terrain height getter function type
 * Takes world X and Z position, returns ground height at that position
 */
export type TerrainHeightGetter = (worldX: number, worldZ: number) => number;

/**
 * Calculate terrain normal at a given position using finite differences
 * @param getTerrainHeight - Function to get terrain height
 * @param x - World X position
 * @param z - World Z position
 * @returns Normalized normal vector [nx, ny, nz]
 */
function calculateTerrainNormal(
  getTerrainHeight: TerrainHeightGetter,
  x: number,
  z: number
): [number, number, number] {
  const epsilon = 0.1; // Sample distance for gradient calculation

  const hCenter = getTerrainHeight(x, z);
  const hRight = getTerrainHeight(x + epsilon, z);
  const hForward = getTerrainHeight(x, z + epsilon);

  // Calculate gradient vectors
  // Right vector: (epsilon, hRight - hCenter, 0)
  // Forward vector: (0, hForward - hCenter, epsilon)
  // Normal = Forward × Right (cross product)
  const dx = hRight - hCenter;
  const dz = hForward - hCenter;

  // Cross product: (0, dz, epsilon) × (epsilon, dx, 0)
  // = (dz*0 - epsilon*dx, epsilon*epsilon - 0*0, 0*dx - dz*epsilon)
  // = (-epsilon*dx, epsilon*epsilon, -epsilon*dz)
  // Simplified: (-dx, epsilon, -dz)
  let nx = -dx;
  let ny = epsilon;
  let nz = -dz;

  // Normalize
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len > 0) {
    nx /= len;
    ny /= len;
    nz /= len;
  } else {
    return [0, 1, 0]; // Fallback to up vector
  }

  return [nx, ny, nz];
}

/**
 * Reflect velocity vector off a surface with given normal
 * @param velocity - Incoming velocity [vx, vy, vz]
 * @param normal - Surface normal [nx, ny, nz]
 * @param restitution - Bounce coefficient (0-1)
 * @returns Reflected velocity
 */
function reflectVelocity(
  velocity: [number, number, number],
  normal: [number, number, number],
  restitution: number
): [number, number, number] {
  const [vx, vy, vz] = velocity;
  const [nx, ny, nz] = normal;

  // Dot product of velocity and normal
  const dot = vx * nx + vy * ny + vz * nz;

  // Only reflect if moving into the surface
  if (dot >= 0) return velocity;

  // Apply restitution (energy loss)
  // Separate normal and tangent components
  const normalSpeed = Math.abs(dot);
  const newNormalSpeed = normalSpeed * restitution;

  // Tangent velocity (velocity component parallel to surface)
  const tangentX = vx - dot * nx;
  const tangentY = vy - dot * ny;
  const tangentZ = vz - dot * nz;

  // Reduce tangent velocity (friction on bounce)
  const tangentFriction = 0.8;

  // Final velocity = tangent * friction + normal * restitution
  return [
    tangentX * tangentFriction + nx * newNormalSpeed,
    tangentY * tangentFriction + ny * newNormalSpeed,
    tangentZ * tangentFriction + nz * newNormalSpeed,
  ];
}

/**
 * Find exact collision point using binary search (anti-tunneling)
 * Uses COLLISION_OFFSET to detect collision when ball's bottom surface touches ground
 * @returns Interpolation factor t (0-1) where collision occurs, or -1 if no collision
 */
function findCollisionPoint(
  startPos: [number, number, number],
  endPos: [number, number, number],
  getTerrainHeight: TerrainHeightGetter,
  iterations: number = 8
): number {
  const [sx, sy, sz] = startPos;
  const [ex, ey, ez] = endPos;

  // Check if end position is below ground (accounting for ball radius)
  const endGroundHeight = getTerrainHeight(ex, ez) + COLLISION_OFFSET;
  if (ey > endGroundHeight) return -1; // No collision

  // Binary search for collision point
  let low = 0;
  let high = 1;

  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    const mx = sx + (ex - sx) * mid;
    const my = sy + (ey - sy) * mid;
    const mz = sz + (ez - sz) * mid;

    const groundHeight = getTerrainHeight(mx, mz) + COLLISION_OFFSET;

    if (my <= groundHeight) {
      high = mid; // Collision is before or at mid
    } else {
      low = mid; // Collision is after mid
    }
  }

  return high;
}

/**
 * Update flight position using realistic golf ball physics
 * Includes gravity, air drag, Magnus effect, bouncing, and rolling
 * @param state - Current flight state
 * @param delta - Time delta in seconds
 * @param getTerrainHeight - Optional function to get terrain height at world position
 * @returns Updated flight state
 */
export function updateFlightPosition(
  state: FlightState,
  delta: number,
  getTerrainHeight?: TerrainHeightGetter,
  getSurfaceType?: TerrainSurfaceGetter
): FlightState {
  // Ball has stopped
  if (state.phase === 'stopped') return state;

  const [px, py, pz] = state.position;
  const [vx, vy, vz] = state.velocity;

  // Rolling phase - ground friction + slope gravity
  if (state.phase === 'rolling') {
    // Track rolling start time for timeout
    const rollingStartTime = state.rollingStartTime ?? state.time;
    const rollingDuration = state.time - rollingStartTime;

    // Get ground height and normal at current position (with collision offset)
    const groundHeight = getTerrainHeight ? getTerrainHeight(px, pz) + COLLISION_OFFSET : COLLISION_OFFSET;
    const normal: [number, number, number] = getTerrainHeight
      ? calculateTerrainNormal(getTerrainHeight, px, pz)
      : [0, 1, 0];

    // Query surface type at current position
    const rollingSurface = getSurfaceType ? getSurfaceType(px, pz) : undefined;
    const rollingPhysics = rollingSurface ? SURFACE_PHYSICS[rollingSurface] : undefined;
    const currentFriction = rollingPhysics?.friction ?? ROLLING_FRICTION;

    // Sand sticks: stop immediately when rolling on sand
    if (rollingPhysics?.sticks) {
      return {
        position: [px, groundHeight, pz],
        velocity: [0, 0, 0],
        time: state.time + delta,
        isFlying: false,
        phase: 'stopped',
        bounceCount: state.bounceCount ?? 0,
        justBounced: false,
        impactSpeed: 0,
        sidespin: 0,
      };
    }

    // Calculate slope acceleration (gravity component along slope)
    // Gravity projected onto the slope surface
    const slopeAccelX = -GRAVITY * normal[0] * (1 - normal[1]);
    const slopeAccelZ = -GRAVITY * normal[2] * (1 - normal[1]);

    // Update velocity with slope acceleration
    let newVx = vx + slopeAccelX * delta;
    let newVz = vz + slopeAccelZ * delta;

    const horizontalSpeed = Math.sqrt(newVx * newVx + newVz * newVz);

    // Ball has stopped rolling - check multiple conditions
    // 1. Speed is below threshold and slope is gentle enough
    // 2. Rolling timeout exceeded (safety fallback)
    // 3. Speed is essentially zero (< 0.01)
    const slopeAngle = Math.acos(normal[1]); // Angle from vertical
    const slopeMagnitude = Math.sqrt(slopeAccelX * slopeAccelX + slopeAccelZ * slopeAccelZ);
    const frictionCanOvercomeSlope = currentFriction > slopeMagnitude;

    const shouldStop =
      (horizontalSpeed < MIN_ROLLING_SPEED && (slopeAngle < 0.1 || frictionCanOvercomeSlope)) ||
      rollingDuration > MAX_ROLLING_TIME ||
      horizontalSpeed < 0.01;

    if (shouldStop) {
      return {
        position: [px, groundHeight, pz],
        velocity: [0, 0, 0],
        time: state.time + delta,
        isFlying: false,
        phase: 'stopped',
        bounceCount: state.bounceCount ?? 0,
        justBounced: false,
        impactSpeed: 0,
        sidespin: 0,
      };
    }

    // Apply rolling friction (deceleration opposing velocity)
    if (horizontalSpeed > 0) {
      const frictionDecel = currentFriction;
      const frictionMagnitude = Math.min(frictionDecel * delta, horizontalSpeed);
      const frictionRatio = (horizontalSpeed - frictionMagnitude) / horizontalSpeed;
      newVx *= frictionRatio;
      newVz *= frictionRatio;
    }

    // Update position
    const newPx = px + newVx * delta;
    const newPz = pz + newVz * delta;

    // Get ground height at new position (with collision offset)
    const newGroundHeight = getTerrainHeight ? getTerrainHeight(newPx, newPz) + COLLISION_OFFSET : COLLISION_OFFSET;

    // Check if ball should become airborne (rolling off edge or bump)
    const heightDiff = newGroundHeight - groundHeight;
    const expectedHeightChange = (newPx - px) * (-normal[0] / normal[1]) + (newPz - pz) * (-normal[2] / normal[1]);

    // If terrain drops more than expected, ball might be airborne
    if (heightDiff < expectedHeightChange - 0.1 && Math.sqrt(newVx * newVx + newVz * newVz) > 2) {
      // Ball becomes airborne
      return {
        position: [newPx, groundHeight + 0.01, newPz],
        velocity: [newVx, -1, newVz], // Small downward velocity
        time: state.time + delta,
        isFlying: true,
        phase: 'flying',
        bounceCount: state.bounceCount ?? 0,
        justBounced: false,
        impactSpeed: 0,
        sidespin: 0, // No sidespin after rolling
      };
    }

    return {
      position: [newPx, newGroundHeight, newPz],
      velocity: [newVx, 0, newVz],
      time: state.time + delta,
      isFlying: false,
      phase: 'rolling',
      rollingStartTime,
      bounceCount: state.bounceCount ?? 0,
      justBounced: false,
      impactSpeed: 0,
      sidespin: 0, // No sidespin while rolling
    };
  }

  // Flying phase - full aerodynamics
  // Calculate aerodynamic forces (with sidespin for lateral Magnus)
  const [aeroAx, aeroAy, aeroAz] = calculateAerodynamicForces(state.velocity, state.sidespin, state.time);

  // Total acceleration (gravity + aerodynamics)
  const ax = aeroAx;
  const ay = -GRAVITY + aeroAy; // Gravity pulls down, lift pushes up
  const az = aeroAz;

  // Update velocity (Euler integration)
  let newVx = vx + ax * delta;
  let newVy = vy + ay * delta;
  let newVz = vz + az * delta;

  // Update position
  let newPx = px + vx * delta + 0.5 * ax * delta * delta;
  let newPy = py + vy * delta + 0.5 * ay * delta * delta;
  let newPz = pz + vz * delta + 0.5 * az * delta * delta;

  // Get ground height at new position (terrain or flat ground)
  // Add COLLISION_OFFSET to account for ball radius (sphere bottom, not center)
  const groundHeight = getTerrainHeight ? getTerrainHeight(newPx, newPz) + COLLISION_OFFSET : COLLISION_OFFSET;

  // Check if ball hits ground (using ball's bottom surface, not center)
  if (newPy <= groundHeight) {
    // Anti-tunneling: find exact collision point
    let collisionPx = newPx;
    let collisionPy = groundHeight;
    let collisionPz = newPz;

    if (getTerrainHeight) {
      const t = findCollisionPoint(
        [px, py, pz],
        [newPx, newPy, newPz],
        getTerrainHeight
      );

      if (t >= 0 && t < 1) {
        // Interpolate to collision point
        collisionPx = px + (newPx - px) * t;
        collisionPz = pz + (newPz - pz) * t;
        // Position ball center at terrain + offset (so ball sits on top, not inside)
        collisionPy = getTerrainHeight(collisionPx, collisionPz) + COLLISION_OFFSET;
      }
    }

    // Calculate terrain normal at collision point for proper bounce
    const normal: [number, number, number] = getTerrainHeight
      ? calculateTerrainNormal(getTerrainHeight, collisionPx, collisionPz)
      : [0, 1, 0];

    // Calculate velocity at collision point (approximate)
    const collisionVelocity: [number, number, number] = [newVx, newVy, newVz];

    // Calculate speed into the surface
    const normalSpeed = Math.abs(
      collisionVelocity[0] * normal[0] +
      collisionVelocity[1] * normal[1] +
      collisionVelocity[2] * normal[2]
    );

    // Query surface type at collision point
    const collisionSurface = getSurfaceType ? getSurfaceType(collisionPx, collisionPz) : undefined;
    const surfacePhysics = collisionSurface ? SURFACE_PHYSICS[collisionSurface] : undefined;

    // Sand sticks: stop immediately on contact
    if (surfacePhysics?.sticks) {
      return {
        position: [collisionPx, collisionPy, collisionPz],
        velocity: [0, 0, 0],
        time: state.time + delta,
        isFlying: false,
        phase: 'stopped',
        bounceCount: (state.bounceCount ?? 0) + 1,
        justBounced: true,
        impactSpeed: normalSpeed,
        sidespin: 0,
      };
    }

    const bounceCoeff = surfacePhysics?.bounce ?? BOUNCE_COEFFICIENT;

    // Bounce or start rolling based on normal velocity component
    if (normalSpeed > MIN_BOUNCE_VELOCITY) {
      // Bounce: reflect velocity off terrain surface
      const reflectedVelocity = reflectVelocity(
        collisionVelocity,
        normal,
        bounceCoeff
      );

      return {
        position: [collisionPx, collisionPy + 0.01, collisionPz], // Slightly above ground
        velocity: reflectedVelocity,
        time: state.time + delta,
        isFlying: true, // Still in air after bounce
        phase: 'flying',
        bounceCount: (state.bounceCount ?? 0) + 1,
        justBounced: true,
        impactSpeed: normalSpeed,
        sidespin: state.sidespin, // Preserve sidespin through bounces
      };
    } else {
      // Start rolling - project velocity onto terrain surface
      const dot = newVx * normal[0] + newVy * normal[1] + newVz * normal[2];
      const rollingVx = newVx - dot * normal[0];
      const rollingVz = newVz - dot * normal[2];

      return {
        position: [collisionPx, collisionPy, collisionPz],
        velocity: [rollingVx, 0, rollingVz],
        time: state.time + delta,
        isFlying: false,
        phase: 'rolling',
        rollingStartTime: state.time + delta, // Track when rolling started
        bounceCount: (state.bounceCount ?? 0) + 1,
        justBounced: true,
        impactSpeed: normalSpeed,
        sidespin: 0, // No sidespin when transitioning to rolling
      };
    }
  }

  return {
    position: [newPx, newPy, newPz],
    velocity: [newVx, newVy, newVz],
    time: state.time + delta,
    isFlying: true,
    phase: 'flying',
    bounceCount: state.bounceCount ?? 0,
    justBounced: false,
    impactSpeed: 0,
    sidespin: state.sidespin, // Preserve sidespin through flight
  };
}

/**
 * Calculate distance traveled from start to end position
 * @param start - Starting position
 * @param end - Ending position
 * @returns Distance in meters
 */
export function calculateDistance(
  start: [number, number, number],
  end: [number, number, number]
): number {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Convert meters to yards
 * @param meters - Distance in meters
 * @returns Distance in yards
 */
export function metersToYards(meters: number): number {
  return meters * 1.09361;
}

/**
 * Create initial flight state
 * @param startPosition - Starting position
 * @param velocity - Initial velocity
 * @param sidespin - Lateral spin from -1 (draw) to +1 (fade), default 0
 * @returns Initial flight state
 */
export function createInitialFlightState(
  startPosition: [number, number, number],
  velocity: [number, number, number],
  sidespin: number = 0
): FlightState {
  return {
    position: [...startPosition],
    velocity: [...velocity],
    time: 0,
    isFlying: true,
    phase: 'flying',
    bounceCount: 0,
    justBounced: false,
    impactSpeed: 0,
    sidespin,
  };
}
