/**
 * Topgolf scoring utilities
 * Detects target zones and calculates points
 */

import { TARGET_ZONES, TOPGOLF_CONFIG, type TargetZone } from '../config/targets';

export interface ShotResult {
  zone: TargetZone | null;
  distanceFromCenter: number;
  isCenter: boolean;
  basePoints: number;
  bonusPoints: number;
  multiplier: number;
  totalPoints: number;
  shotNumber: number;
  ballPosition: [number, number, number];
}

interface TargetDetectionResult {
  zone: TargetZone | null;
  distanceFromCenter: number;
}

/**
 * Detect which target zone the ball landed in (if any)
 * @param ballPosition - Ball position [x, y, z] in world coordinates
 * @returns Target zone and distance from center
 */
export function detectTargetZone(ballPosition: [number, number, number]): TargetDetectionResult {
  const [x, , z] = ballPosition;

  // Check each zone - find the closest one the ball is inside
  let bestMatch: TargetDetectionResult = { zone: null, distanceFromCenter: Infinity };

  for (const zone of TARGET_ZONES) {
    // Calculate distance from target center (target is at xOffset, z=distanceFromTee)
    const dx = x - zone.xOffset;
    const dz = z - zone.distanceFromTee;
    const distanceFromCenter = Math.sqrt(dx * dx + dz * dz);

    // Check if ball is within outer radius
    if (distanceFromCenter <= zone.outerRadius) {
      // If this is a better (closer to center) match, use it
      if (distanceFromCenter < bestMatch.distanceFromCenter) {
        bestMatch = { zone, distanceFromCenter };
      }
    }
  }

  return bestMatch;
}

/**
 * Calculate points for a shot
 * @param zone - Target zone hit (or null)
 * @param distanceFromCenter - Distance from target center
 * @param shotNumber - Current shot number (1-10)
 * @returns Complete shot result with points breakdown
 */
export function calculateShotPoints(
  zone: TargetZone | null,
  distanceFromCenter: number,
  shotNumber: number,
  ballPosition: [number, number, number]
): ShotResult {
  const isBonusBall = shotNumber === TOPGOLF_CONFIG.totalShots;
  const multiplier = isBonusBall ? TOPGOLF_CONFIG.bonusBallMultiplier : 1;

  if (!zone) {
    return {
      zone: null,
      distanceFromCenter,
      isCenter: false,
      basePoints: 0,
      bonusPoints: 0,
      multiplier,
      totalPoints: 0,
      shotNumber,
      ballPosition,
    };
  }

  const isCenter = distanceFromCenter <= zone.innerRadius;
  const basePoints = zone.basePoints;
  const bonusPoints = isCenter ? zone.centerBonus : 0;
  const totalPoints = (basePoints + bonusPoints) * multiplier;

  return {
    zone,
    distanceFromCenter,
    isCenter,
    basePoints,
    bonusPoints,
    multiplier,
    totalPoints,
    shotNumber,
    ballPosition,
  };
}

/**
 * Calculate maximum possible score (for reference)
 * All shots hit center of farthest target, bonus ball on shot 10
 */
export function calculateMaxScore(): number {
  const farTarget = TARGET_ZONES[TARGET_ZONES.length - 1];
  const pointsPerNormalShot = farTarget.basePoints + farTarget.centerBonus;
  const normalShots = TOPGOLF_CONFIG.totalShots - 1;
  const bonusBallPoints = pointsPerNormalShot * TOPGOLF_CONFIG.bonusBallMultiplier;

  return normalShots * pointsPerNormalShot + bonusBallPoints;
}
