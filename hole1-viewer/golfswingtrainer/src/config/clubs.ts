export type ClubId = 'driver' | '3w' | '5i' | '6i' | '7i' | '8i' | '9i' | 'pw' | 'sw';

export interface ClubConfig {
  id: ClubId;
  name: string;
  shortName: string;
  minLaunchAngle: number; // degrees at 100% power
  maxLaunchAngle: number; // degrees at 0% power
  maxRange: number;       // approximate yards at full power (physics-calibrated)
  velocityScale: number;  // multiplier on launch speed (calibrated to match maxRange)
}

export const CLUBS: ClubConfig[] = [
  { id: 'driver', name: 'Driver',         shortName: 'DR',  minLaunchAngle: 12, maxLaunchAngle: 25, maxRange: 300, velocityScale: 1.046 },
  { id: '3w',     name: '3 Wood',         shortName: '3W',  minLaunchAngle: 15, maxLaunchAngle: 28, maxRange: 250, velocityScale: 0.869 },
  { id: '5i',     name: '5 Iron',         shortName: '5i',  minLaunchAngle: 20, maxLaunchAngle: 33, maxRange: 200, velocityScale: 0.698 },
  { id: '6i',     name: '6 Iron',         shortName: '6i',  minLaunchAngle: 23, maxLaunchAngle: 36, maxRange: 180, velocityScale: 0.629 },
  { id: '7i',     name: '7 Iron',         shortName: '7i',  minLaunchAngle: 26, maxLaunchAngle: 39, maxRange: 160, velocityScale: 0.567 },
  { id: '8i',     name: '8 Iron',         shortName: '8i',  minLaunchAngle: 30, maxLaunchAngle: 43, maxRange: 140, velocityScale: 0.505 },
  { id: '9i',     name: '9 Iron',         shortName: '9i',  minLaunchAngle: 35, maxLaunchAngle: 48, maxRange: 120, velocityScale: 0.449 },
  { id: 'pw',     name: 'Pitching Wedge', shortName: 'PW',  minLaunchAngle: 42, maxLaunchAngle: 55, maxRange: 90,  velocityScale: 0.371 },
  { id: 'sw',     name: 'Sand Wedge',     shortName: 'SW',  minLaunchAngle: 50, maxLaunchAngle: 63, maxRange: 70,  velocityScale: 0.327 },
];

export const CLUB_MAP = Object.fromEntries(CLUBS.map(c => [c.id, c])) as Record<ClubId, ClubConfig>;
export const DEFAULT_CLUB: ClubId = 'driver';
