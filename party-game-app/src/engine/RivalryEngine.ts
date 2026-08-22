import type { GameSessionState } from '../types/game';

const REVENGE_THRESHOLD = 2;

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function recordDuel(
  rivalries: GameSessionState['rivalries'],
  playerAId: string,
  playerBId: string
): GameSessionState['rivalries'] {
  const [a, b] = pairKey(playerAId, playerBId);
  const existing = rivalries.find((r) => r.pair[0] === a && r.pair[1] === b);
  if (existing) {
    return rivalries.map((r) => (r === existing ? { ...r, count: r.count + 1 } : r));
  }
  return [...rivalries, { pair: [a, b], count: 1 }];
}

export function getRivalryCount(
  rivalries: GameSessionState['rivalries'],
  playerAId: string,
  playerBId: string
): number {
  const [a, b] = pairKey(playerAId, playerBId);
  return rivalries.find((r) => r.pair[0] === a && r.pair[1] === b)?.count ?? 0;
}

export function isRivalryReady(
  rivalries: GameSessionState['rivalries'],
  playerAId: string,
  playerBId: string
): boolean {
  return getRivalryCount(rivalries, playerAId, playerBId) >= REVENGE_THRESHOLD;
}

export function getBiggestRivalry(
  rivalries: GameSessionState['rivalries']
): { pair: [string, string]; count: number } | undefined {
  const [first, ...rest] = rivalries;
  if (!first) return undefined;
  return rest.reduce((best, r) => (r.count > best.count ? r : best), first);
}
