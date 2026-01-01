import confetti from 'canvas-confetti';

/**
 * Celebrate success with confetti animation
 *
 * @example
 * import { celebrateSuccess } from '@/lib/confetti';
 * celebrateSuccess();
 */
export const celebrateSuccess = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 }
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

/**
 * Quick confetti burst
 *
 * @example
 * import { quickBurst } from '@/lib/confetti';
 * quickBurst();
 */
export const quickBurst = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

/**
 * Confetti from specific element position
 *
 * @example
 * const button = document.getElementById('my-button');
 * confettiFromElement(button);
 */
export const confettiFromElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x, y }
  });
};

/**
 * Continuous confetti rain
 *
 * @example
 * const stop = confettiRain();
 * // Later: stop();
 */
export const confettiRain = () => {
  let intervalId: NodeJS.Timeout;

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
  };

  intervalId = setInterval(frame, 50);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
};
