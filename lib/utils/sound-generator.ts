/**
 * Programmatic sound generation for kids app
 * No external files needed!
 */

type SoundType = "pop" | "ding" | "coin" | "success" | "fanfare" | "click";

/**
 * Create an AudioContext instance (singleton)
 */
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a simple beep/tone
 */
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3
): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/**
 * Pop sound - quick short beep
 */
export function playPopSound(): void {
  playTone(800, 0.1, "sine", 0.2);
}

/**
 * Ding sound - notification bell
 */
export function playDingSound(): void {
  const ctx = getAudioContext();

  // Two-tone bell sound
  playTone(800, 0.15, "sine", 0.25);
  setTimeout(() => {
    playTone(1000, 0.15, "sine", 0.2);
  }, 50);
}

/**
 * Coin sound - collecting coins
 */
export function playCoinSound(): void {
  const ctx = getAudioContext();

  // Rising pitch for coin
  playTone(400, 0.08, "square", 0.25);
  setTimeout(() => {
    playTone(600, 0.08, "square", 0.2);
  }, 50);
  setTimeout(() => {
    playTone(800, 0.1, "square", 0.15);
  }, 100);
}

/**
 * Success sound - achievement unlocked
 */
export function playSuccessSound(): void {
  const ctx = getAudioContext();

  // Three ascending tones
  playTone(523, 0.15, "sine", 0.25); // C
  setTimeout(() => {
    playTone(659, 0.15, "sine", 0.25); // E
  }, 80);
  setTimeout(() => {
    playTone(784, 0.25, "sine", 0.3); // G
  }, 160);
}

/**
 * Fanfare sound - celebration
 */
export function playFanfareSound(): void {
  const ctx = getAudioContext();

  // Triumphant fanfare
  playTone(523, 0.2, "triangle", 0.3); // C
  setTimeout(() => {
    playTone(659, 0.2, "triangle", 0.3); // E
  }, 100);
  setTimeout(() => {
    playTone(784, 0.2, "triangle", 0.35); // G
  }, 200);
  setTimeout(() => {
    playTone(1047, 0.4, "triangle", 0.4); // C (high)
  }, 300);
}

/**
 * Click sound - button press
 */
export function playClickSound(): void {
  playTone(400, 0.05, "square", 0.15);
}

/**
 * Main sound player - routes to correct sound
 */
export function playSound(type: SoundType): void {
  try {
    switch (type) {
      case "pop":
        playPopSound();
        break;
      case "ding":
        playDingSound();
        break;
      case "coin":
        playCoinSound();
        break;
      case "success":
        playSuccessSound();
        break;
      case "fanfare":
        playFanfareSound();
        break;
      case "click":
        playClickSound();
        break;
      default:
        console.warn(`Unknown sound type: ${type}`);
    }
  } catch (error) {
    console.error("Error playing sound:", error);
  }
}

/**
 * Resume audio context (required for autoplay policy)
 */
export function resumeAudioContext(): void {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}
