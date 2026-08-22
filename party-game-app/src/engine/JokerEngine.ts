import type { JokerType } from '../types/game';

const ALL_JOKERS: JokerType[] = ['skip', 'pass', 'choose_target', 'double_or_nothing', 'shield'];

/**
 * Every player starts with exactly one random joker. Keeping the pool to one
 * each (rather than letting players pick) is deliberate: it keeps jokers
 * rare and strategic instead of a resource players hoard and spam.
 */
export function assignStartingJoker(rng: () => number): JokerType {
  const index = Math.floor(rng() * ALL_JOKERS.length);
  return ALL_JOKERS[index] ?? 'skip';
}
