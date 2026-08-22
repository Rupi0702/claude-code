import type { GamePhase, SessionLength } from '../types/game';

/**
 * Estimated total rounds per session length, used only to compute the
 * dramaturgy phase (warmup -> interaction -> chaos -> peak -> finale). This
 * is a pacing heuristic, not a hard cap - "endless" games simply cycle the
 * last two phases forever so late-night rounds don't get stuck in "finale".
 */
const ESTIMATED_ROUNDS: Record<SessionLength, number> = {
  quick: 18,
  normal: 40,
  party: 70,
  endless: 40,
};

const PHASE_THRESHOLDS: { phase: GamePhase; upTo: number }[] = [
  { phase: 'warmup', upTo: 0.15 },
  { phase: 'interaction', upTo: 0.45 },
  { phase: 'chaos', upTo: 0.7 },
  { phase: 'peak', upTo: 0.9 },
  { phase: 'finale', upTo: 1.01 },
];

export function getEstimatedTotalRounds(sessionLength: SessionLength): number {
  return ESTIMATED_ROUNDS[sessionLength];
}

export function computeProgress(round: number, sessionLength: SessionLength): number {
  const total = ESTIMATED_ROUNDS[sessionLength];
  if (sessionLength === 'endless') {
    // Cycle through interaction..finale every `total` rounds so the game
    // keeps building tension in waves instead of flatlining.
    const cyclePosition = round % total;
    return cyclePosition / total;
  }
  return Math.min(1, round / total);
}

export function computePhase(round: number, sessionLength: SessionLength): GamePhase {
  const progress = computeProgress(round, sessionLength);
  const match = PHASE_THRESHOLDS.find((t) => progress <= t.upTo);
  return match?.phase ?? 'finale';
}

/**
 * Phase-dependent preference multipliers per challenge type, layered on top
 * of a challenge's own weight. This is what gives each phase its own feel:
 * warmup favors low-friction truth/vote content, chaos leans into
 * surprise/group mechanics, peak/finale lean into duels and dares.
 */
export function phaseTypeMultiplier(phase: GamePhase, type: string): number {
  const table: Record<GamePhase, Partial<Record<string, number>>> = {
    warmup: { truth: 1.4, vote: 1.3, group: 1.1, dare: 0.8, duel: 0.6, surprise: 0.5 },
    interaction: { vote: 1.2, decision: 1.3, duel: 1.1, dare: 1.1, truth: 1.0 },
    chaos: { surprise: 1.8, group: 1.4, minigame: 1.3, decision: 1.1 },
    peak: { dare: 1.4, duel: 1.4, surprise: 1.2, group: 1.1 },
    finale: { duel: 1.5, dare: 1.3, vote: 1.2, surprise: 1.3 },
  };
  return table[phase]?.[type] ?? 1;
}

export function phaseIntensityBias(phase: GamePhase): number {
  const bias: Record<GamePhase, number> = {
    warmup: -1,
    interaction: 0,
    chaos: 0,
    peak: 1,
    finale: 1,
  };
  return bias[phase];
}
