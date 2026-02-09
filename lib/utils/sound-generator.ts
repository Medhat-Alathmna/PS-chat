/**
 * Programmatic sound generation for kids app
 * No external files needed!
 */

type SoundType = "pop" | "ding" | "coin" | "success" | "fanfare" | "click" | "correct" | "wrong" | "hint" | "gameStart" | "gameOver" | "tick" | "levelComplete";

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
 * Correct answer - ascending happy tones
 */
export function playCorrectSound(): void {
  playTone(523, 0.12, "sine", 0.25); // C
  setTimeout(() => playTone(659, 0.12, "sine", 0.25), 60); // E
  setTimeout(() => playTone(784, 0.12, "sine", 0.3), 120); // G
  setTimeout(() => playTone(1047, 0.2, "sine", 0.3), 180); // C (high)
}

/**
 * Wrong answer - gentle descending (not scary)
 */
export function playWrongSound(): void {
  playTone(400, 0.15, "sine", 0.15);
  setTimeout(() => playTone(350, 0.2, "sine", 0.12), 100);
}

/**
 * Hint - ding-dong doorbell
 */
export function playHintSound(): void {
  playTone(659, 0.15, "triangle", 0.2); // E
  setTimeout(() => playTone(523, 0.2, "triangle", 0.2), 150); // C
}

/**
 * Game start - short trumpet
 */
export function playGameStartSound(): void {
  playTone(523, 0.1, "square", 0.2); // C
  setTimeout(() => playTone(659, 0.1, "square", 0.2), 80); // E
  setTimeout(() => playTone(784, 0.1, "square", 0.25), 160); // G
  setTimeout(() => playTone(1047, 0.3, "square", 0.3), 240); // C high
}

/**
 * Game over - celebratory melody
 */
export function playGameOverSound(): void {
  playTone(523, 0.15, "triangle", 0.25); // C
  setTimeout(() => playTone(659, 0.15, "triangle", 0.25), 100); // E
  setTimeout(() => playTone(784, 0.15, "triangle", 0.3), 200); // G
  setTimeout(() => playTone(1047, 0.15, "triangle", 0.3), 300); // C
  setTimeout(() => playTone(784, 0.15, "triangle", 0.25), 400); // G
  setTimeout(() => playTone(1047, 0.4, "triangle", 0.35), 500); // C
}

/**
 * Tick - quick tick sound
 */
export function playTickSound(): void {
  playTone(1000, 0.03, "square", 0.1);
}

/**
 * Level complete - extended fanfare
 */
export function playLevelCompleteSound(): void {
  playTone(523, 0.15, "triangle", 0.3);
  setTimeout(() => playTone(587, 0.15, "triangle", 0.3), 100);
  setTimeout(() => playTone(659, 0.15, "triangle", 0.3), 200);
  setTimeout(() => playTone(784, 0.15, "triangle", 0.35), 300);
  setTimeout(() => playTone(880, 0.15, "triangle", 0.35), 400);
  setTimeout(() => playTone(1047, 0.4, "triangle", 0.4), 500);
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
      case "correct":
        playCorrectSound();
        break;
      case "wrong":
        playWrongSound();
        break;
      case "hint":
        playHintSound();
        break;
      case "gameStart":
        playGameStartSound();
        break;
      case "gameOver":
        playGameOverSound();
        break;
      case "tick":
        playTickSound();
        break;
      case "levelComplete":
        playLevelCompleteSound();
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
