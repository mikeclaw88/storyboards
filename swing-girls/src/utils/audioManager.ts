/**
 * Audio Manager - Web Audio API based sound system for low-latency playback
 */

import uiClickSfx from '/public/sfx/click1.ogg?url';

// Audio context and state
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let initialized = false;
let enabled = true;

// Pre-decoded audio buffers
const buffers: Map<string, AudioBuffer> = new Map();

// Sound file URLs (will be set during initialization)
const soundUrls: Map<string, string> = new Map();

/**
 * Initialize audio context (call on first user interaction)
 */
export function initAudio() {
  if (initialized) return;

  try {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioContext.destination);
    initialized = true;

    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Load all registered sounds
    loadAllSounds();
  } catch (e) {
    console.warn('Failed to initialize audio:', e);
    enabled = false;
  }
}

/**
 * Register a sound file to be loaded
 */
export function registerSound(name: string, url: string) {
  soundUrls.set(name, url);
  // If already initialized, load immediately
  if (initialized && audioContext) {
    loadSound(name, url);
  }
}

/**
 * Load a single sound file
 */
async function loadSound(name: string, url: string) {
  if (!audioContext) return;

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    buffers.set(name, buffer);
  } catch (e) {
    console.warn(`Failed to load sound "${name}":`, e);
  }
}

/**
 * Load all registered sounds
 */
async function loadAllSounds() {
  for (const [name, url] of soundUrls) {
    await loadSound(name, url);
  }
}

/**
 * Play a pre-loaded sound buffer
 */
export function playSound(name: string, volumeMultiplier = 1) {
  if (!enabled || !initialized || !audioContext || !masterGain) return;

  const buffer = buffers.get(name);
  if (!buffer) {
    // Try procedural fallback
    playProceduralUIClick();
    return;
  }

  // Resume context if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();

  source.buffer = buffer;
  gain.gain.value = volumeMultiplier;

  source.connect(gain);
  gain.connect(masterGain);
  source.start(0);
}

/**
 * Play a procedural UI click sound (fallback if no audio file)
 */
export function playProceduralUIClick() {
  if (!enabled || !initialized || !audioContext || !masterGain) return;

  // Resume context if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.value = 800;

  gain.gain.setValueAtTime(0.15, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(audioContext.currentTime + 0.05);
}

/**
 * Play UI button click sound
 */
export function playUIClick() {
  if (buffers.has('ui_click')) {
    playSound('ui_click', 0.6);
  } else {
    playProceduralUIClick();
  }
}

/**
 * Set master volume (0-1)
 */
export function setVolume(vol: number) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, vol));
  }
}

/**
 * Toggle sound on/off
 */
export function toggleSound() {
  enabled = !enabled;
  return enabled;
}

/**
 * Check if audio is enabled
 */
export function isEnabled() {
  return enabled;
}

// Auto-initialize on first user interaction
if (typeof document !== 'undefined') {
  const initOnInteraction = () => {
    initAudio();
    document.removeEventListener('click', initOnInteraction);
    document.removeEventListener('touchstart', initOnInteraction);
    document.removeEventListener('keydown', initOnInteraction);
  };

  document.addEventListener('click', initOnInteraction);
  document.addEventListener('touchstart', initOnInteraction);
  document.addEventListener('keydown', initOnInteraction);
}

// Register default UI sounds
registerSound('ui_click', uiClickSfx);
