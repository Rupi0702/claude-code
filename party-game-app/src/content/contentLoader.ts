import type { Challenge, ContentLevel, GameMode } from '../types/content';
import { CHALLENGES } from './challenges.data';
import { SCENARIOS } from './scenarios.data';
import { CONTENT_PACKS } from './packs';

export interface ContentFilter {
  mode: GameMode;
  playerCount: number;
  alcoholEnabled: boolean;
  contentLevel: ContentLevel;
  ownedPremium: boolean;
}

const CONTENT_LEVEL_RANK: Record<ContentLevel, number> = { all: 0, '16+': 1, '18+': 2 };

/**
 * Every challenge visible from a given filter, before per-round cooldown /
 * weighting is applied. Kept pure and side-effect free so the engine can
 * call it once per game and reuse the result for the whole session.
 */
export function loadChallengePool(filter: ContentFilter): Challenge[] {
  const packChallengeIds = new Set(
    CONTENT_PACKS.filter((p) => !p.premium || filter.ownedPremium).flatMap((p) => p.challengeIds)
  );

  return CHALLENGES.filter((challenge) => {
    if (!challenge.modes.includes(filter.mode)) return false;
    if (challenge.minPlayers > filter.playerCount) return false;
    if (challenge.maxPlayers != null && challenge.maxPlayers < filter.playerCount) return false;
    if (CONTENT_LEVEL_RANK[challenge.contentLevel] > CONTENT_LEVEL_RANK[filter.contentLevel]) return false;
    if (challenge.premium && !filter.ownedPremium && !packChallengeIds.has(challenge.id)) return false;
    // Alcohol-disabled games never exclude a challenge outright - the
    // renderer swaps in `noAlcoholAlternative` instead, so every player
    // pool stays the same size regardless of the alcohol toggle.
    void filter.alcoholEnabled;
    return true;
  });
}

export function getScenarioBanks() {
  return SCENARIOS;
}
