import type { TemporaryRule } from '../types/game';

let ruleCounter = 0;

export function createTemporaryRule(
  description: string,
  playerIds: string[],
  round: number,
  durationRounds: number
): TemporaryRule {
  ruleCounter += 1;
  return {
    id: `rule_${round}_${ruleCounter}`,
    description,
    playerIds,
    startedRound: round,
    expiresRound: round + durationRounds,
  };
}

/**
 * Returns the rules that survive into the next round, plus the ones that
 * just expired (so the UI/engine can surface a one-time "rule X is over"
 * notice instead of silently dropping it).
 */
export function advanceRules(
  rules: TemporaryRule[],
  round: number
): { active: TemporaryRule[]; expired: TemporaryRule[] } {
  const active: TemporaryRule[] = [];
  const expired: TemporaryRule[] = [];
  for (const rule of rules) {
    if (rule.expiresRound <= round) {
      expired.push(rule);
    } else {
      active.push(rule);
    }
  }
  return { active, expired };
}
