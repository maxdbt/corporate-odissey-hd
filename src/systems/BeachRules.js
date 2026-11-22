// The beach bonus keeps its original duration, three chances and reward curve.
export const BEACH_RULES = Object.freeze({ duration: 25, lives: 3, hpPerSecond: 4, speed: 240, feetY: 404 });
export function beachReward(elapsed) {
  const seconds = Math.max(0, Math.min(BEACH_RULES.duration, Math.floor(elapsed)));
  return { hp: Math.min(100, seconds * BEACH_RULES.hpPerSecond), stressDown: Math.min(50, seconds) };
}
