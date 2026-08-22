import type { Challenge } from '../types/content';
import type { GamePhase } from '../types/game';
import { phaseTypeMultiplier } from './PhaseManager';

export interface HistoryEntry {
  challengeId: string;
  round: number;
}

export interface SelectionParams {
  pool: Challenge[];
  history: HistoryEntry[];
  round: number;
  phase: GamePhase;
  maxIntensity: 1 | 2 | 3 | 4 | 5;
  rng: () => number;
}

function isOnCooldown(challenge: Challenge, history: HistoryEntry[], round: number): boolean {
  const lastUse = [...history].reverse().find((h) => h.challengeId === challenge.id);
  if (!lastUse) return false;
  return round - lastUse.round < challenge.cooldown;
}

/**
 * Picks the next challenge from the eligible pool. Cooldown is a hard
 * filter (a challenge simply cannot repeat too soon); everything else -
 * phase fit, base weight - only biases the odds, so even an "unlikely"
 * challenge type can still show up and keep rounds unpredictable.
 */
export function selectNextChallenge(params: SelectionParams): Challenge | undefined {
  const eligible = params.pool.filter(
    (c) => c.intensity <= params.maxIntensity && !isOnCooldown(c, params.history, params.round)
  );

  const usable = eligible.length > 0 ? eligible : params.pool.filter((c) => c.intensity <= params.maxIntensity);
  if (usable.length === 0) return undefined;

  const weights = usable.map((c) => c.weight * phaseTypeMultiplier(params.phase, c.type));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = params.rng() * total;
  for (let i = 0; i < usable.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return usable[i];
  }
  return usable[usable.length - 1];
}
