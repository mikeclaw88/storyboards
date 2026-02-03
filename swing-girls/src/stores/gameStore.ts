import { create } from 'zustand';
import { TOPGOLF_CONFIG } from '../config/targets';
import type { ShotResult } from '../utils/topgolfScoring';

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
 * Video characters (use video instead of 3D model)
 */
export const VIDEO_CHARACTERS: Record<string, string> = {
  ksenia: './videos/Ksenia.mp4',
  sandra: './videos/Sandra.mp4',
};

/**
 * Idle videos for video characters (used in selection screen)
 */
export const VIDEO_CHARACTERS_IDLE: Record<string, string> = {
  ksenia: './videos/Ksenia_idle.mp4',
  sandra: './videos/Sandra_idle.mp4',
};

export function isVideoCharacter(charId: string): boolean {
  return charId in VIDEO_CHARACTERS;
}

// Build final character list: video characters only
export const CHARACTERS: CharacterConfig[] = [
  ...Object.entries(VIDEO_CHARACTERS).map(([id, path]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    path,
    type: 'video' as const,
  })),
];

export type CharacterId = string;
export type ScreenMode = 'selection' | 'playing';
export type SwingPhase = 'ready' | 'pulling' | 'swinging' | 'finished';
export type GameMode = 'practice' | 'topgolf';

interface TopgolfState {
  currentShot: number;       // 1-10
  totalShots: number;        // 10
  runningScore: number;
  shotHistory: ShotResult[];
  lastShotResult: ShotResult | null;
  gameComplete: boolean;
}

interface SwingResult {
  power: number;      // 0-100, based on speed
  accuracy: number;   // 0-100, based on horizontal deviation (100 = perfect)
  score: number;      // Combined score
  direction: number;  // -1 to 1, horizontal direction (-1 = left, 0 = center, 1 = right)
}

interface BallState {
  isVisible: boolean;
  isFlying: boolean;
  position: [number, number, number];
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

  // Character selection
  characterIndex: number;
  selectedCharacter: CharacterId;

  // Swing state
  swingPhase: SwingPhase;
  swingResult: SwingResult | null;
  pullProgress: number; // 0-1, how far the pull gesture has progressed
  arcPower: number; // 0-100, power from timing arc

  // Aim state
  aimAngle: number; // Camera azimuthal angle in radians (captured at swing time)

  // Ball state
  ball: BallState;

  // Actions
  setScreenMode: (mode: ScreenMode) => void;
  startPlay: () => void;
  stopPlay: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setCharacter: (id: CharacterId) => void;
  nextCharacter: () => void;
  prevCharacter: () => void;
  setSwingPhase: (phase: SwingPhase) => void;
  setSwingResult: (result: SwingResult | null) => void;
  setPullProgress: (progress: number) => void;
  setArcPower: (power: number) => void;
  resetSwing: () => void;

  // Aim actions
  setAimAngle: (angle: number) => void;

  // Ball actions
  launchBall: () => void;
  updateBallPosition: (position: [number, number, number]) => void;
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
  position: [-0.5, 0.02, 0.3],
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

export const useGameStore = create<GameState>((set) => ({
  screenMode: 'selection',
  isPaused: false,
  gameMode: 'practice',
  topgolf: { ...INITIAL_TOPGOLF_STATE },
  characterIndex: 0,
  selectedCharacter: CHARACTERS[0]?.id || 'default',
  swingPhase: 'ready',
  swingResult: null,
  pullProgress: 0,
  arcPower: 0,
  aimAngle: 0,
  ball: { ...INITIAL_BALL_STATE },

  setScreenMode: (mode) => set({ screenMode: mode }),
  startPlay: () => set((state) => ({
    screenMode: 'playing',
    isPaused: false,
    swingPhase: 'ready',
    swingResult: null,
    pullProgress: 0,
    ball: { ...INITIAL_BALL_STATE },
    // Reset topgolf state when starting practice mode
    topgolf: state.gameMode === 'practice' ? { ...INITIAL_TOPGOLF_STATE } : state.topgolf,
  })),
  stopPlay: () => set({
    screenMode: 'selection',
    gameMode: 'practice',
    isPaused: false,
    swingPhase: 'ready',
    swingResult: null,
    ball: { ...INITIAL_BALL_STATE },
    topgolf: { ...INITIAL_TOPGOLF_STATE },
  }),
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  setCharacter: (id) => {
    const index = CHARACTERS.findIndex((c) => c.id === id);
    set({
      selectedCharacter: id,
      characterIndex: index >= 0 ? index : 0,
    });
  },
  nextCharacter: () => set((state) => {
    const nextIndex = (state.characterIndex + 1) % CHARACTERS.length;
    return {
      characterIndex: nextIndex,
      selectedCharacter: CHARACTERS[nextIndex].id,
    };
  }),
  prevCharacter: () => set((state) => {
    const prevIndex = (state.characterIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
    return {
      characterIndex: prevIndex,
      selectedCharacter: CHARACTERS[prevIndex].id,
    };
  }),
  setSwingPhase: (phase) => set({ swingPhase: phase }),
  setSwingResult: (result) => set({ swingResult: result }),
  setPullProgress: (progress) => set({ pullProgress: Math.max(0, Math.min(1, progress)) }),
  setArcPower: (power) => set({ arcPower: Math.max(0, Math.min(100, power)) }),
  setAimAngle: (angle) => set({ aimAngle: angle }),
  resetSwing: () => set({
    swingPhase: 'ready',
    swingResult: null,
    pullProgress: 0,
    arcPower: 0,
    ball: { ...INITIAL_BALL_STATE },
  }),

  // Ball actions
  launchBall: () => set((state) => ({
    ball: { ...state.ball, isFlying: true },
  })),
  updateBallPosition: (position) => set((state) => ({
    ball: { ...state.ball, position },
  })),
  landBall: (distance) => set((state) => ({
    ball: { ...state.ball, isFlying: false, distanceTraveled: distance },
    swingPhase: 'finished',
  })),
  resetBall: () => set({ ball: { ...INITIAL_BALL_STATE } }),

  // Game mode actions
  setGameMode: (mode) => set({ gameMode: mode }),

  startTopgolfGame: () => set({
    gameMode: 'topgolf',
    screenMode: 'playing',
    isPaused: false,
    swingPhase: 'ready',
    swingResult: null,
    pullProgress: 0,
    ball: { ...INITIAL_BALL_STATE },
    topgolf: { ...INITIAL_TOPGOLF_STATE },
  }),

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
      ball: { ...INITIAL_BALL_STATE },
    };
  }),

  endTopgolfGame: () => set({
    screenMode: 'selection',
    gameMode: 'practice',
    isPaused: false,
    swingPhase: 'ready',
    swingResult: null,
    pullProgress: 0,
    ball: { ...INITIAL_BALL_STATE },
    topgolf: { ...INITIAL_TOPGOLF_STATE },
  }),
}));

/**
 * Helper to get character config by ID
 */
export const getCharacterConfig = (id: CharacterId): CharacterConfig =>
  CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
