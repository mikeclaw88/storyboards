/**
 * Topgolf target zone configuration
 * Each zone has a position, radius, and scoring values
 */

export interface TargetZone {
  id: string;
  name: string;
  color: string;       // CSS color for rendering
  innerRadius: number; // Center bullseye radius (meters)
  outerRadius: number; // Outer ring radius (meters)
  distanceFromTee: number; // Meters in +Z direction
  xOffset: number;     // Horizontal offset from center (meters)
  basePoints: number;  // Points for hitting outer zone
  centerBonus: number; // Additional points for hitting center
}

/**
 * Target zones based on Topgolf layout
 * Layout: 3 red (front), 2 yellow-green, then zigzag: green, orange, dark blue, light blue
 */
export const TARGET_ZONES: TargetZone[] = [
  // 3 Red zones at front (closest, smallest, spread horizontally)
  {
    id: 'red-left',
    name: 'Red',
    color: '#ef4444',
    innerRadius: 1.5,
    outerRadius: 4,
    distanceFromTee: 30,
    xOffset: -8,
    basePoints: 5,
    centerBonus: 5,
  },
  {
    id: 'red-center',
    name: 'Red',
    color: '#ef4444',
    innerRadius: 1.5,
    outerRadius: 4,
    distanceFromTee: 35,
    xOffset: 0,
    basePoints: 5,
    centerBonus: 5,
  },
  {
    id: 'red-right',
    name: 'Red',
    color: '#ef4444',
    innerRadius: 1.5,
    outerRadius: 4,
    distanceFromTee: 30,
    xOffset: 8,
    basePoints: 5,
    centerBonus: 5,
  },

  // 2 Yellow-green zones
  {
    id: 'yellow-left',
    name: 'Yellow',
    color: '#a3e635', // lime/yellow-green
    innerRadius: 2,
    outerRadius: 5,
    distanceFromTee: 55,
    xOffset: -6,
    basePoints: 10,
    centerBonus: 10,
  },
  {
    id: 'yellow-right',
    name: 'Yellow',
    color: '#a3e635',
    innerRadius: 2,
    outerRadius: 5,
    distanceFromTee: 55,
    xOffset: 6,
    basePoints: 10,
    centerBonus: 10,
  },

  // Green zone (zigzag pattern starts)
  {
    id: 'green',
    name: 'Green',
    color: '#22c55e',
    innerRadius: 2.5,
    outerRadius: 6,
    distanceFromTee: 85,
    xOffset: -4,
    basePoints: 20,
    centerBonus: 10,
  },

  // Orange zone
  {
    id: 'orange',
    name: 'Orange',
    color: '#f97316',
    innerRadius: 3,
    outerRadius: 7,
    distanceFromTee: 110,
    xOffset: 5,
    basePoints: 30,
    centerBonus: 10,
  },

  // Dark blue zone
  {
    id: 'dark-blue',
    name: 'Blue',
    color: '#6366f1', // indigo/dark blue
    innerRadius: 3.5,
    outerRadius: 8,
    distanceFromTee: 140,
    xOffset: -3,
    basePoints: 40,
    centerBonus: 10,
  },

  // Light blue zone (farthest)
  {
    id: 'light-blue',
    name: 'Cyan',
    color: '#22d3ee', // cyan/light blue
    innerRadius: 4,
    outerRadius: 9,
    distanceFromTee: 175,
    xOffset: 4,
    basePoints: 50,
    centerBonus: 10,
  },
];

/**
 * Topgolf game constants
 */
export const TOPGOLF_CONFIG = {
  totalShots: 10,
  bonusBallMultiplier: 2, // Shot 10 is bonus ball (2x points)
};
