import type { Player } from '../types/game';

export interface PlayerSelectionOptions {
  /** Player ids to exclude entirely from this draw (e.g. already chosen as player1). */
  exclude?: string[];
  /** How many recent rounds count toward the "selected too often" penalty. */
  recentWindow?: number;
  round: number;
}

const RECENT_WINDOW_DEFAULT = 3;

/**
 * Weighted pick that actively avoids repeat spotlighting: a player selected
 * within the recent window gets their weight cut hard, and weight decays
 * further the more total challenges they've already received this session.
 * This is what makes the game "notice" that Alex keeps getting picked,
 * instead of pure uniform randomness which repeats far more than players
 * perceive as fair.
 */
export function pickWeightedPlayer(
  players: Player[],
  rng: () => number,
  options: PlayerSelectionOptions
): Player | undefined {
  const exclude = new Set(options.exclude ?? []);
  const recentWindow = options.recentWindow ?? RECENT_WINDOW_DEFAULT;
  const candidates = players.filter((p) => !exclude.has(p.id));
  if (candidates.length === 0) return undefined;

  const weights = candidates.map((p) => {
    let weight = 10;
    const roundsSinceSelected = options.round - p.stats.lastSelectedRound;
    if (p.stats.lastSelectedRound > 0 && roundsSinceSelected < recentWindow) {
      // Selected very recently: steep penalty, growing steeper the closer it was.
      weight *= 0.25 + 0.2 * roundsSinceSelected;
    }
    // Mild long-term fairness pull: players with far more total picks than
    // average get slightly deprioritized so nobody dominates the spotlight.
    const avgReceived =
      players.reduce((sum, pl) => sum + pl.stats.challengesReceived, 0) / players.length;
    if (avgReceived > 0 && p.stats.challengesReceived > avgReceived) {
      const overshoot = p.stats.challengesReceived - avgReceived;
      weight *= Math.max(0.35, 1 - overshoot * 0.15);
    }
    return Math.max(0.5, weight);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export function pickMultipleWeightedPlayers(
  players: Player[],
  rng: () => number,
  count: number,
  options: Omit<PlayerSelectionOptions, 'exclude'>
): Player[] {
  const chosen: Player[] = [];
  const excluded: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const pick = pickWeightedPlayer(players, rng, { ...options, exclude: excluded });
    if (!pick) break;
    chosen.push(pick);
    excluded.push(pick.id);
  }
  return chosen;
}
