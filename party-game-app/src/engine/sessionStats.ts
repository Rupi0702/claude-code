import type { GameSessionState, Player } from '../types/game';
import { getBiggestRivalry } from './RivalryEngine';

export interface EndGameSummary {
  mvp?: Player;
  chaosKing?: Player;
  mostTargeted?: Player;
  bestDuo?: [Player, Player];
  biggestRivalry?: { players: [Player, Player]; count: number };
  totalChallenges: number;
  durationMs: number;
}

function byStat(players: Player[], selector: (p: Player) => number): Player | undefined {
  if (players.length === 0) return undefined;
  return players.reduce((best, p) => (selector(p) > selector(best) ? p : best), players[0]!);
}

/**
 * "Best duo" is approximated from `teamWith` pairings recorded during
 * chaos-mode team effects; when no team ever formed, it's simply omitted
 * from the summary rather than guessing.
 */
function findBestDuo(players: Player[]): [Player, Player] | undefined {
  for (const player of players) {
    if (player.stats.teamWith) {
      const partner = players.find((p) => p.id === player.stats.teamWith);
      if (partner) return [player, partner];
    }
  }
  return undefined;
}

export function buildEndGameSummary(state: GameSessionState): EndGameSummary {
  const { players } = state;
  const mvp = byStat(players, (p) => p.stats.wins - p.stats.losses);
  const chaosKing = byStat(players, (p) => p.stats.chaosScore);
  const mostTargeted = byStat(players, (p) => p.stats.challengesReceived);
  const bestDuo = findBestDuo(players);
  const biggest = getBiggestRivalry(state.rivalries);
  const biggestRivalry = biggest
    ? {
        players: [
          players.find((p) => p.id === biggest.pair[0])!,
          players.find((p) => p.id === biggest.pair[1])!,
        ] as [Player, Player],
        count: biggest.count,
      }
    : undefined;

  return {
    mvp,
    chaosKing,
    mostTargeted,
    bestDuo,
    biggestRivalry,
    totalChallenges: state.history.length,
    durationMs: Date.now() - state.startedAt,
  };
}
