import golfShotSfx from '../assets/golf_shot.mp3';

// Web Audio API for low-latency sound playback
let audioContext: AudioContext | null = null;
let golfShotBuffer: AudioBuffer | null = null;
let audioLoadFailed = false;

/**
 * Initialize audio context and preload sound buffer
 */
async function initAudio(): Promise<void> {
  if (audioContext || audioLoadFailed) return;

  try {
    audioContext = new AudioContext();
    const response = await fetch(golfShotSfx);
    if (!response.ok) {
      audioLoadFailed = true;
      return;
    }
    const arrayBuffer = await response.arrayBuffer();
    golfShotBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch {
    audioLoadFailed = true;
  }
}

// Start loading audio immediately
initAudio();

/**
 * Play the golf shot sound effect with low latency
 */
export function playGolfShotSound(): void {
  if (audioLoadFailed) return;

  if (!audioContext || !golfShotBuffer) {
    return;
  }

  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Create buffer source for instant playback
  const source = audioContext.createBufferSource();
  source.buffer = golfShotBuffer;
  source.connect(audioContext.destination);
  source.start(0);
}
