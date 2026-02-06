import { create } from 'zustand';
import { TOPGOLF_CONFIG } from '../config/targets';
import type { ShotResult } from '../utils/topgolfScoring';
import { useTerrainStore } from './terrainStore';
import { type ClubId, DEFAULT_CLUB, CLUBS } from '../config/clubs';
import { metersToYards } from '../utils/ballPhysics';
import {
  getVideoCharacters,
  getVideoCharactersIdle,
  isVideoCharacterId,
  getCharacterSwingTypes,
} from './videoConfigStore';

/**
 * Character/Animation configuration types
 */
export interface CharacterConfig {
  id: string;
  name: string;
  path: string;
  type?: 'video';
}

/**
 * Get video characters (driver videos) - loaded from config.json
 */
export function getVideoCharactersMap(): Record<string, string> {
  return getVideoCharacters();
}

/**
 * Get idle videos for video characters - loaded from config.json
 */
export function getVideoCharactersIdleMap(): Record<string, string> {
  return getVideoCharactersIdle();
}

/**
 * Check if a character ID is a video character
 */
export function isVideoCharacter(charId: string): boolean {
  return isVideoCharacterId(charId);
}

/**
 * Build character list from loaded config
 */
export function getCharacters(): CharacterConfig[] {
  const videoChars = getVideoCharacters();
  return Object.entries(videoChars).map(([id, path]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    path,
    type: 'video' as const,
  }));
}

// Re-export for backward compatibility - these now return dynamic data from config
export { getVideoCharacters as VIDEO_CHARACTERS_FN } from './videoConfigStore';
export { getVideoCharactersIdle as VIDEO_CHARACTERS_IDLE_FN } from './videoConfigStore';

export type CharacterId = string;
export type ScreenMode = 'selection' | 'playing';
export type SwingPhase = 'ready' | 'pulling' | 'swinging' | 'finished';
export type GameMode = 'practice' | 'topgolf';
export type ClubType = 'driver' | 'iron';

export interface SpinBumps {
  allocations: number[];  // length 8, one per direction index
  totalUsed: number;      // sum (max 3)
  maxBumps: number;       // always 3
}

const INITIAL_SPIN_BUMPS: SpinBumps = {
  allocations: [0, 0, 0, 0, 0, 0, 0, 0],
  totalUsed: 0,
  maxBumps: 3,
};

// Exported — used by GolfBall for physics rotation
export const BUMP_DIRECTION_VECTORS: [number, number][] = [
  [+0.32, +0.95],  // 0: ↖ (1/4 lateral, 3/4 forward)
  [ 0,    +1   ],  // 1: ↑  (forward)
  [-0.32, +0.95],  // 2: ↗ (1/4 lateral, 3/4 forward)
  [+0.32, +0.95],  // 3: ←  (1/4 lateral, 3/4 forward)
  [-0.32, +0.95],  // 4: →  (1/4 lateral, 3/4 forward)
  [+0.32, -0.95],  // 5: ↙ (1/4 lateral, 3/4 back)
  [ 0,    -1   ],  // 6: ↓  (back)
  [-0.32, -0.95],  // 7: ↘ (1/4 lateral, 3/4 back)
];

interface TopgolfState {
  currentShot: number;       // 1-10
  totalShots: number;        // 10
  runningScore: number;
  shotHistory: ShotResult[];
  lastShotResult: ShotResult | null;
  gameComplete: boolean;
}

export interface PracticeShotResult {
  shotNumber: number;
  distance: number;
  distanceToHole: number;
  score: number;
  surface: string; // 'Tee', 'Fairway', 'Rough', 'Green', 'Sand', 'OB'
}

interface SwingResult {
  power: number;      // 0-100, based on speed
  accuracy: number;   // 0-100, based on horizontal deviation (100 = perfect)
  score: number;      // Combined score
  direction: number;  // -1 to 1, horizontal direction (-1 = left, 0 = center, 1 = right)
  sidespin: number;   // -1 to +1, continuous curve amount (negative = draw/right-to-left, positive = fade/left-to-right)
  shotType: string;   // 'straight' | 'draw' | 'fade' | 'big_draw' | 'big_fade' | 'push' | 'pull'
  distanceToHole: number; // Distance to hole in meters
  shotScore: number; // Score for this shot (100 - distance)
  surface: string;   // Surface type where ball landed
}

interface BallState {
  isVisible: boolean;
  isFlying: boolean;
  position: [number, number, number];
  velocity: [number, number, number];
  distanceTraveled: number;
}

interface GameState {
  // Screen mode
  screenMode: ScreenMode;
  isPaused: boolean;

  // Game mode (practice vs topgolf)
  gameMode: GameMode;

  // Topgolf state
  topgolf: TopgolfState;

  // Course positions (set by GolfCourseRenderer once terrain loads)
  teePosition: [number, number, number];
  courseReady: boolean;

  // Practice Mode State
  holePosition: [number, number, number];
  currentShot: number;
  practiceHistory: PracticeShotResult[];
  gameComplete: boolean;
  selectedClub: ClubId;
  ballStartPosition: [number, number, number];

  setCoursePositions: (tee: [number, number, number], hole: [number, number, number]) => void;
  setHolePosition: (pos: [number, number, number]) => void;
  setClub: (club: ClubId) => void;

  // Character selection
  characterIndex: number;
  selectedCharacter: CharacterId;
  selectedClubType: ClubType;

  // Swing state
  swingPhase: SwingPhase;
  swingResult: SwingResult | null;
  pullProgress: number; // 0-1, how far the pull gesture has progressed
  arcPower: number; // 0-100, power from timing arc

  // Aim state
  aimAngle: number; // Camera azimuthal angle in radians (captured at swing time)

  // Ball state
  ball: BallState;

  // Spin bumps state
  spinBumps: SpinBumps;

  // Actions
  setScreenMode: (mode: ScreenMode) => void;
  startPlay: () => void;
  stopPlay: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setCharacter: (id: CharacterId) => void;
  nextCharacter: () => void;
  prevCharacter: () => void;
  setClubType: (type: ClubType) => void;
  nextClubType: () => void;
  prevClubType: () => void;
  setSwingPhase: (phase: SwingPhase) => void;
  setSwingResult: (result: SwingResult | null) => void;
  setPullProgress: (progress: number) => void;
  setArcPower: (power: number) => void;
  resetSwing: () => void;
  nextShot: () => void; // Move to next shot or finish game

  // Aim actions
  setAimAngle: (angle: number) => void;

  // Spin bump actions
  addSpinBump: (dirIndex: number) => void;
  resetSpinBumps: () => void;

  // Ball actions
  launchBall: () => void;
  updateBallPosition: (position: [number, number, number], distance?: number, velocity?: [number, number, number]) => void;
  landBall: (distance: number) => void;
  resetBall: () => void;

  // Game mode actions
  setGameMode: (mode: GameMode) => void;
  startTopgolfGame: () => void;
  recordTopgolfShot: (result: ShotResult) => void;
  nextTopgolfShot: () => void;
  endTopgolfGame: () => void;
}

const INITIAL_BALL_STATE: BallState = {
  isVisible: true,
  isFlying: false,
  position: [0, 0, 0],
  velocity: [0, 0, 0],
  distanceTraveled: 0,
};

const INITIAL_TOPGOLF_STATE: TopgolfState = {
  currentShot: 1,
  totalShots: TOPGOLF_CONFIG.totalShots,
  runningScore: 0,
  shotHistory: [],
  lastShotResult: null,
  gameComplete: false,
};

// Placeholder until course loads via setCoursePositions
const DEFAULT_HOLE_POS: [number, number, number] = [0, 0, 0];

export const useGameStore = create<GameState>((set, get) => ({
  screenMode: 'selection',
  isPaused: false,
  gameMode: 'practice',
  topgolf: { ...INITIAL_TOPGOLF_STATE },
  
  // Course positions (set by GolfCourseRenderer)
  teePosition: [0, 0, 0] as [number, number, number],
  courseReady: false,

  // Hole Defaults
  holePosition: DEFAULT_HOLE_POS,
  currentShot: 1,
  practiceHistory: [],
  gameComplete: false,
  selectedClub: DEFAULT_CLUB,
  ballStartPosition: [...INITIAL_BALL_STATE.position] as [number, number, number],

  setCoursePositions: (tee, hole) => set({
    teePosition: tee,
    holePosition: hole,
    ballStartPosition: [...tee] as [number, number, number],
    ball: { ...INITIAL_BALL_STATE, position: [...tee] as [number, number, number] },
    courseReady: true,
  }),
  setHolePosition: (pos) => set({ holePosition: pos }),
  setClub: (club) => set({ selectedClub: club }),

  characterIndex: 0,
  selectedCharacter: 'ksenia', // Default character, will be updated after config loads
  selectedClubType: 'driver',
  swingPhase: 'ready',
  swingResult: null,
  pullProgress: 0,
  arcPower: 0,
  aimAngle: 0,
  ball: { ...INITIAL_BALL_STATE },
  spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },

  setScreenMode: (mode) => set({ screenMode: mode }),
  startPlay: () => set((state) => ({
    screenMode: 'playing',
    isPaused: false,
    swingPhase: 'ready',
    swingResult: null,
    pullProgress: 0,
    ball: { ...INITIAL_BALL_STATE, position: [...state.teePosition] as [number, number, number] },
    spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },
    // Reset game state
    currentShot: 1,
    practiceHistory: [],
    gameComplete: false,
    selectedClub: DEFAULT_CLUB,
    ballStartPosition: [...state.teePosition] as [number, number, number],
    topgolf: state.gameMode === 'practice' ? { ...INITIAL_TOPGOLF_STATE } : state.topgolf,
  })),
  stopPlay: () => set((state) => ({
    screenMode: 'selection',
    gameMode: 'practice',
    isPaused: false,
    swingPhase: 'ready',
    swingResult: null,
    ball: { ...INITIAL_BALL_STATE, position: [...state.teePosition] as [number, number, number] },
    spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },
    topgolf: { ...INITIAL_TOPGOLF_STATE },
    currentShot: 1,
    practiceHistory: [],
    gameComplete: false,
    selectedClub: DEFAULT_CLUB,
    ballStartPosition: [...state.teePosition] as [number, number, number],
  })),
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  setCharacter: (id) => {
    const characters = getCharacters();
    const index = characters.findIndex((c) => c.id === id);
    set({
      selectedCharacter: id,
      characterIndex: index >= 0 ? index : 0,
    });
  },
  nextCharacter: () => set((state) => {
    const characters = getCharacters();
    if (characters.length === 0) return state;
    const nextIndex = (state.characterIndex + 1) % characters.length;
    const newCharId = characters[nextIndex].id;
    // Reset club type to driver if new character doesn't have current club type
    const availableTypes = getCharacterSwingTypes(newCharId);
    const newClubType = availableTypes.includes(state.selectedClubType)
      ? state.selectedClubType
      : 'driver';
    return {
      characterIndex: nextIndex,
      selectedCharacter: newCharId,
      selectedClubType: newClubType,
    };
  }),
  prevCharacter: () => set((state) => {
    const characters = getCharacters();
    if (characters.length === 0) return state;
    const prevIndex = (state.characterIndex - 1 + characters.length) % characters.length;
    const newCharId = characters[prevIndex].id;
    // Reset club type to driver if new character doesn't have current club type
    const availableTypes = getCharacterSwingTypes(newCharId);
    const newClubType = availableTypes.includes(state.selectedClubType)
      ? state.selectedClubType
      : 'driver';
    return {
      characterIndex: prevIndex,
      selectedCharacter: newCharId,
      selectedClubType: newClubType,
    };
  }),
  setClubType: (type) => set({ selectedClubType: type }),
  nextClubType: () => set((state) => {
    const availableTypes = getCharacterSwingTypes(state.selectedCharacter);
    if (availableTypes.length <= 1) return state;
    const currentIndex = availableTypes.indexOf(state.selectedClubType);
    const nextIndex = (currentIndex + 1) % availableTypes.length;
    return { selectedClubType: availableTypes[nextIndex] };
  }),
  prevClubType: () => set((state) => {
    const availableTypes = getCharacterSwingTypes(state.selectedCharacter);
    if (availableTypes.length <= 1) return state;
    const currentIndex = availableTypes.indexOf(state.selectedClubType);
    const prevIndex = (currentIndex - 1 + availableTypes.length) % availableTypes.length;
    return { selectedClubType: availableTypes[prevIndex] };
  }),
  setSwingPhase: (phase) => set({ swingPhase: phase }),
  setSwingResult: (result) => set({ swingResult: result }),
  setPullProgress: (progress) => set({ pullProgress: Math.max(0, Math.min(1, progress)) }),
  setArcPower: (power) => set({ arcPower: Math.max(0, Math.min(100, power)) }),
  setAimAngle: (angle) => set({ aimAngle: angle }),
  resetSwing: () => set((state) => {
    const pos = state.currentShot > 1 ? state.ballStartPosition : state.teePosition;
    return {
      swingPhase: 'ready',
      swingResult: null,
      pullProgress: 0,
      arcPower: 0,
      ball: { ...INITIAL_BALL_STATE, position: [...pos] as [number, number, number] },
      spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },
    };
  }),
  
  nextShot: () => set((state) => {
    // If game is already complete (ball on green), don't advance
    if (state.gameComplete) return {};

    // Calculate distance to hole in yards for club selection
    const ballPos = state.ballStartPosition;
    const holePos = state.holePosition;
    const distToHoleMeters = Math.sqrt(
      Math.pow(ballPos[0] - holePos[0], 2) +
      Math.pow(ballPos[2] - holePos[2], 2)
    );
    const distToHoleYards = metersToYards(distToHoleMeters);

    // Auto-select club: highest maxRange that doesn't exceed distance to hole
    // Sort clubs by maxRange descending, pick first one <= distance
    const sortedClubs = [...CLUBS].sort((a, b) => b.maxRange - a.maxRange);
    const bestClub = sortedClubs.find(c => c.maxRange <= distToHoleYards) || sortedClubs[sortedClubs.length - 1];

    // Prepare next stroke from where ball landed
    return {
      currentShot: state.currentShot + 1,
      swingPhase: 'ready',
      swingResult: null,
      pullProgress: 0,
      ball: { ...INITIAL_BALL_STATE, position: [...state.ballStartPosition] as [number, number, number] },
      spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },
      selectedClub: bestClub.id,
    };
  }),

  // Spin bump actions
  addSpinBump: (dirIndex) => set((state) => {
    if (dirIndex < 0 || dirIndex >= 8 || state.spinBumps.totalUsed >= state.spinBumps.maxBumps) return state;
    const newAllocations = [...state.spinBumps.allocations];
    newAllocations[dirIndex] += 1;
    return {
      spinBumps: {
        ...state.spinBumps,
        allocations: newAllocations,
        totalUsed: state.spinBumps.totalUsed + 1,
      },
    };
  }),
  resetSpinBumps: () => set({
    spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },
  }),

  // Ball actions
  launchBall: () => set((state) => ({
    ball: { ...state.ball, isFlying: true },
  })),
  updateBallPosition: (position, distance, velocity) => set((state) => ({
    ball: { 
      ...state.ball, 
      position, 
      ...(distance !== undefined ? { distanceTraveled: distance } : {}),
      ...(velocity !== undefined ? { velocity } : {})
    },
  })),
  landBall: (distance) => set((state) => {
    // Calculate distance to hole
    const ballPos = state.ball.position;
    const holePos = state.holePosition;
    const distToHole = Math.sqrt(
      Math.pow(ballPos[0] - holePos[0], 2) +
      Math.pow(ballPos[2] - holePos[2], 2)
    );

    // Sample surface map at ball's landing position (terrainStore uses correct coordinate system)
    const rawSurface = useTerrainStore.getState().getSurfaceTypeAtWorldPosition(ballPos[0], ballPos[2]);
    // Capitalize first letter for display consistency
    const surface = rawSurface.charAt(0).toUpperCase() + rawSurface.slice(1);

    // Check if ball landed on green — round ends
    const onGreen = rawSurface === 'green';

    // Record history
    const shotRecord: PracticeShotResult = {
      shotNumber: state.currentShot,
      distance: Math.round(distance),
      distanceToHole: Math.round(distToHole),
      score: 0,
      surface
    };

    return {
      ball: { ...state.ball, isFlying: false, distanceTraveled: distance },
      swingPhase: 'finished',
      practiceHistory: [...state.practiceHistory, shotRecord],
      ballStartPosition: [...ballPos] as [number, number, number],
      gameComplete: onGreen,
      swingResult: {
        ...(state.swingResult || { power: 0, accuracy: 0, score: 0, direction: 0, sidespin: 0, shotType: 'straight' }),
        distanceToHole: distToHole,
        shotScore: 0,
        surface,
      }
    };
  }),
  resetBall: () => set((state) => ({
    ball: { ...INITIAL_BALL_STATE, position: [...state.teePosition] as [number, number, number] },
  })),

  // Game mode actions
  setGameMode: (mode) => set({ gameMode: mode }),

  startTopgolfGame: () => set((state) => ({
    gameMode: 'topgolf',
    screenMode: 'playing',
    isPaused: false,
    swingPhase: 'ready',
    swingResult: null,
    pullProgress: 0,
    ball: { ...INITIAL_BALL_STATE, position: [...state.teePosition] as [number, number, number] },
    spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },
    topgolf: { ...INITIAL_TOPGOLF_STATE },
  })),

  recordTopgolfShot: (result) => set((state) => ({
    topgolf: {
      ...state.topgolf,
      runningScore: state.topgolf.runningScore + result.totalPoints,
      shotHistory: [...state.topgolf.shotHistory, result],
      lastShotResult: result,
    },
  })),

  nextTopgolfShot: () => set((state) => {
    const nextShot = state.topgolf.currentShot + 1;
    const isGameComplete = nextShot > state.topgolf.totalShots;

    if (isGameComplete) {
      return {
        topgolf: { ...state.topgolf, gameComplete: true },
        swingPhase: 'finished',
      };
    }

    return {
      topgolf: {
        ...state.topgolf,
        currentShot: nextShot,
        lastShotResult: null,
      },
      swingPhase: 'ready',
      swingResult: null,
      pullProgress: 0,
      ball: { ...INITIAL_BALL_STATE, position: [...state.teePosition] as [number, number, number] },
      spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },
    };
  }),

  endTopgolfGame: () => set((state) => ({
    screenMode: 'selection',
    gameMode: 'practice',
    isPaused: false,
    swingPhase: 'ready',
    swingResult: null,
    pullProgress: 0,
    ball: { ...INITIAL_BALL_STATE, position: [...state.teePosition] as [number, number, number] },
    spinBumps: { ...INITIAL_SPIN_BUMPS, allocations: [...INITIAL_SPIN_BUMPS.allocations] },
    topgolf: { ...INITIAL_TOPGOLF_STATE },
  })),
}));

/**
 * Helper to get character config by ID
 */
export const getCharacterConfig = (id: CharacterId): CharacterConfig => {
  const characters = getCharacters();
  const found = characters.find((c) => c.id === id);
  if (found) return found;
  // Fallback to first character or default
  return characters[0] || { id, name: id.charAt(0).toUpperCase() + id.slice(1), path: '', type: 'video' };
};
