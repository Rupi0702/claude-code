import type { GameMode } from '../types/content';

/**
 * Monetization scaffold: no real payment is wired up yet, but modes and
 * future content packs already carry a `premium` flag end-to-end (Challenge,
 * ContentPack, here) so a store/paywall can be dropped in later without
 * touching the engine or content schema.
 */
export interface ModeDefinition {
  id: GameMode;
  premium: boolean;
}

export const MODE_DEFINITIONS: ModeDefinition[] = [
  { id: 'classic', premium: false },
  { id: 'icebreaker', premium: false },
  { id: 'bestfriends', premium: false },
  { id: 'couples', premium: true },
  { id: 'wild', premium: true },
  { id: 'chaos', premium: true },
];

export function isModeUnlocked(mode: GameMode, ownedPremium: boolean): boolean {
  const def = MODE_DEFINITIONS.find((m) => m.id === mode);
  if (!def) return false;
  return !def.premium || ownedPremium;
}

/**
 * Placeholder for future seasonal/DLC packs (Festival, Birthday, Oktoberfest,
 * Vacation, Christmas, Bachelor). Each pack would contribute additional
 * Challenge entries filtered in by `challengeIds` — the content loader
 * already merges packs generically, so adding a pack is a data-only change.
 */
export const CONTENT_PACKS: { id: string; name: string; premium: boolean; challengeIds: string[] }[] = [];
