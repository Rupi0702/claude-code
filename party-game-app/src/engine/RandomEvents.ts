import type { GamePhase, Player, RandomEventType } from '../types/game';

const BASE_EVENT_CHANCE: Record<GamePhase, number> = {
  warmup: 0.03,
  interaction: 0.08,
  chaos: 0.18,
  peak: 0.14,
  finale: 0.12,
};

export interface RandomEventContext {
  phase: GamePhase;
  round: number;
  lastPenalizedPlayerId?: string;
  players: Player[];
  rng: () => number;
}

/**
 * Decides whether a random event fires this round, and if so which one.
 * `revenge` and `team_battle`/`boss_round` need at least a certain player
 * count or prior state to make sense, so they're filtered out of the
 * candidate pool rather than firing into a no-op.
 */
export function maybeTriggerRandomEvent(ctx: RandomEventContext): RandomEventType | undefined {
  const chance = BASE_EVENT_CHANCE[ctx.phase];
  if (ctx.rng() > chance) return undefined;

  const candidates: RandomEventType[] = ['double_trouble', 'chaos_round'];
  if (ctx.lastPenalizedPlayerId) candidates.push('revenge');
  if (ctx.players.length >= 4) candidates.push('team_battle');
  if (ctx.players.length >= 3) candidates.push('boss_round');

  const index = Math.floor(ctx.rng() * candidates.length);
  return candidates[index];
}
