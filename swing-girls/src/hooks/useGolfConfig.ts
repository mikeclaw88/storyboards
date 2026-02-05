import { useState, useEffect, useCallback } from 'react';
import {
  GOLF_CONFIG,
  GOLF_CONFIG_CHANNEL,
  type GolfConfig,
} from '../config/golf';
import { useBroadcastChannel } from './useBroadcastChannel';

const STORAGE_KEY = 'swing-girls-golf-config';

/**
 * Hook to manage golf configuration
 * - Loads from localStorage first, falls back to ./config.json
 * - Listens for real-time updates from config.html via BroadcastChannel
 */
export function useGolfConfig(): GolfConfig {
  const [config, setConfig] = useState<GolfConfig>(GOLF_CONFIG);

  // Load config on startup: localStorage -> config.json -> defaults
  useEffect(() => {
    // Try localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }

    // Fall back to config.json
    fetch('./config.json')
      .then((res) => res.json())
      .then((data: GolfConfig) => {
        setConfig(data);
      })
      .catch((e) => {
        console.warn('Failed to load ./config.json, using defaults:', e);
      });
  }, []);

  // Handle BroadcastChannel message with localStorage persistence
  const handleConfigUpdate = useCallback((newConfig: GolfConfig) => {
    setConfig(newConfig);
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, []);

  // Listen for BroadcastChannel messages (real-time updates from config.html)
  useBroadcastChannel<GolfConfig>({
    channelName: GOLF_CONFIG_CHANNEL,
    messageType: 'golf',
    payloadKey: 'config',
    onMessage: handleConfigUpdate,
  });

  return config;
}
