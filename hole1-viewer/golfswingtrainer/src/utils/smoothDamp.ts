import { Vector3 } from 'three';

/**
 * Critically-damped spring smoothing for Vector3.
 * Port of Unity's Mathf.SmoothDamp algorithm to Three.js Vector3.
 *
 * Mutates `current` and `velocity` in place. Returns `current`.
 */
export function smoothDampVec3(
  current: Vector3,
  target: Vector3,
  velocity: Vector3,
  smoothTime: number,
  delta: number,
  maxSpeed: number = Infinity,
): Vector3 {
  // Clamp smoothTime to avoid division by zero
  const st = Math.max(0.0001, smoothTime);
  const omega = 2.0 / st;

  const x = omega * delta;
  // Padé approximant of exp(-x)
  const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);

  let changeX = current.x - target.x;
  let changeY = current.y - target.y;
  let changeZ = current.z - target.z;

  // Clamp maximum speed
  const maxChange = maxSpeed * st;
  const sqMag = changeX * changeX + changeY * changeY + changeZ * changeZ;
  if (sqMag > maxChange * maxChange) {
    const mag = Math.sqrt(sqMag);
    changeX = (changeX / mag) * maxChange;
    changeY = (changeY / mag) * maxChange;
    changeZ = (changeZ / mag) * maxChange;
  }

  const targetX = current.x - changeX;
  const targetY = current.y - changeY;
  const targetZ = current.z - changeZ;

  const tempX = (velocity.x + omega * changeX) * delta;
  const tempY = (velocity.y + omega * changeY) * delta;
  const tempZ = (velocity.z + omega * changeZ) * delta;

  velocity.x = (velocity.x - omega * tempX) * exp;
  velocity.y = (velocity.y - omega * tempY) * exp;
  velocity.z = (velocity.z - omega * tempZ) * exp;

  let outX = targetX + (changeX + tempX) * exp;
  let outY = targetY + (changeY + tempY) * exp;
  let outZ = targetZ + (changeZ + tempZ) * exp;

  // Prevent overshooting
  const origMinusCurrentX = target.x - current.x;
  const origMinusCurrentY = target.y - current.y;
  const origMinusCurrentZ = target.z - current.z;
  const outMinusOrigX = outX - target.x;
  const outMinusOrigY = outY - target.y;
  const outMinusOrigZ = outZ - target.z;

  if (
    origMinusCurrentX * outMinusOrigX +
    origMinusCurrentY * outMinusOrigY +
    origMinusCurrentZ * outMinusOrigZ > 0
  ) {
    outX = target.x;
    outY = target.y;
    outZ = target.z;
    velocity.set(
      (outX - target.x) / delta,
      (outY - target.y) / delta,
      (outZ - target.z) / delta,
    );
  }

  current.set(outX, outY, outZ);
  return current;
}
