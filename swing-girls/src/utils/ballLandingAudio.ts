/**
 * Ball landing sound effect module
 * Plays landing sound with decreasing volume for subsequent bounces
 */

// Web Audio API for low-latency sound playback
let audioContext: AudioContext | null = null;
let landingBuffer: AudioBuffer | null = null;
let audioLoadFailed = false;

/**
 * Initialize audio context and preload sound buffer
 */
async function initAudio(): Promise<void> {
  if (audioContext || audioLoadFailed) return;

  try {
    audioContext = new AudioContext();
    const response = await fetch('/sfx/golf_ball_landing.ogg');
    if (!response.ok) {
      audioLoadFailed = true;
      return;
    }
    const arrayBuffer = await response.arrayBuffer();
    landingBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch {
    audioLoadFailed = true;
  }
}

// Start loading audio immediately
initAudio();

/**
 * Play the ball landing sound effect with variable volume
 * @param volume - Volume multiplier (0-1), first bounce should be 1.0
 */
export function playBallLandingSound(volume: number = 1.0): void {
  if (audioLoadFailed) return;

  if (!audioContext || !landingBuffer) {
    return;
  }

  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Create buffer source for instant playback
  const source = audioContext.createBufferSource();
  source.buffer = landingBuffer;

  // Create gain node for volume control
  const gainNode = audioContext.createGain();
  gainNode.gain.value = Math.max(0, Math.min(1, volume));

  // Connect: source -> gain -> destination
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}
