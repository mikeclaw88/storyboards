import { create } from 'zustand';
import { MOTION_CONFIG_CHANNEL } from '../config/motionConfig';

/**
 * Video configuration for a specific video type (driver, idle, iron, etc.)
 */
export interface VideoTypeConfig {
  url: string;
  offset: { x: number; y: number; z: number };
  pivot: { x: number; y: number };
  scale: number;
  chromaKey: {
    color: string;
    threshold: number;
    smoothing: number;
  };
  backswingTopTime?: number;
  impactTime?: number;
}

/**
 * Video configuration for a character (contains multiple video types)
 */
export interface CharacterVideoConfig {
  driver?: VideoTypeConfig;
  idle?: VideoTypeConfig;
  iron?: VideoTypeConfig;
  [key: string]: VideoTypeConfig | undefined;
}

/**
 * Full config structure from config.json
 */
interface ConfigData {
  characters?: Record<string, { video?: CharacterVideoConfig }>;
}

interface VideoConfigState {
  configData: ConfigData;
  isLoaded: boolean;
  loadConfig: () => Promise<void>;
}

export const useVideoConfigStore = create<VideoConfigState>((set) => ({
  configData: {},
  isLoaded: false,

  loadConfig: async () => {
    try {
      const response = await fetch('./config.json');
      const data = await response.json();

      set({
        configData: data,
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Failed to load video config from config.json:', e);
    }
  },
}));

/**
 * Get list of video character IDs (characters that have video config)
 */
export function getVideoCharacterIds(): string[] {
  const { configData, isLoaded } = useVideoConfigStore.getState();

  if (!isLoaded || !configData.characters) {
    return [];
  }

  return Object.entries(configData.characters)
    .filter(([, char]) => char.video?.driver && char.video?.idle)
    .map(([id]) => id);
}

/**
 * Get video characters (driver video URLs) - for character selection
 */
export function getVideoCharacters(): Record<string, string> {
  const { configData, isLoaded } = useVideoConfigStore.getState();

  if (!isLoaded || !configData.characters) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [charId, char] of Object.entries(configData.characters)) {
    if (char.video?.driver?.url) {
      result[charId] = char.video.driver.url;
    }
  }
  return result;
}

/**
 * Get idle videos for video characters - for selection screen
 */
export function getVideoCharactersIdle(): Record<string, string> {
  const { configData, isLoaded } = useVideoConfigStore.getState();

  if (!isLoaded || !configData.characters) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [charId, char] of Object.entries(configData.characters)) {
    if (char.video?.idle?.url) {
      result[charId] = char.video.idle.url;
    }
  }
  return result;
}

/**
 * Get video config for a specific character and video type
 */
export function getVideoConfig(charId: string, videoType: string): VideoTypeConfig | undefined {
  const { configData, isLoaded } = useVideoConfigStore.getState();

  if (!isLoaded || !configData.characters) {
    return undefined;
  }

  return configData.characters[charId]?.video?.[videoType];
}

/**
 * Get all video types for a character
 */
export function getCharacterVideoTypes(charId: string): string[] {
  const { configData, isLoaded } = useVideoConfigStore.getState();

  if (!isLoaded || !configData.characters) {
    return [];
  }

  const video = configData.characters[charId]?.video;
  if (!video) return [];

  return Object.keys(video);
}

/**
 * Get available swing types for a character (driver, iron - excludes idle)
 */
export function getCharacterSwingTypes(charId: string): ('driver' | 'iron')[] {
  const { configData, isLoaded } = useVideoConfigStore.getState();

  if (!isLoaded || !configData.characters) {
    return ['driver'];
  }

  const video = configData.characters[charId]?.video;
  if (!video) return ['driver'];

  const swingTypes: ('driver' | 'iron')[] = [];
  if (video.driver) swingTypes.push('driver');
  if (video.iron) swingTypes.push('iron');

  return swingTypes.length > 0 ? swingTypes : ['driver'];
}

/**
 * Check if a character ID is a video character (has video config with driver and idle)
 */
export function isVideoCharacterId(charId: string): boolean {
  const { configData, isLoaded } = useVideoConfigStore.getState();

  if (!isLoaded || !configData.characters) {
    return false;
  }

  const char = configData.characters[charId];
  return !!(char?.video?.driver && char?.video?.idle);
}

// Listen for BroadcastChannel updates from golf_editor
if (typeof window !== 'undefined') {
  const channel = new BroadcastChannel(MOTION_CONFIG_CHANNEL);
  channel.onmessage = (event) => {
    if (event.data?.type === 'motion' && event.data?.config) {
      useVideoConfigStore.setState({
        configData: event.data.config,
        isLoaded: true,
      });
    }
  };
}
