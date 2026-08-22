import type { Challenge } from '../types/content';
import type {
  ActiveChallenge,
  GameSessionState,
  GameSettings,
  JokerType,
  Player,
  RandomEventType,
  SecretMission,
} from '../types/game';
import { loadChallengePool, getScenarioBanks } from '../content/contentLoader';
import { selectNextChallenge } from './ChallengeSelector';
import { pickWeightedPlayer, pickMultipleWeightedPlayers } from './PlayerSelector';
import { renderTemplate } from './templateRenderer';
import { computePhase, phaseIntensityBias, getEstimatedTotalRounds } from './PhaseManager';
import { advanceRules, createTemporaryRule } from './RuleEngine';
import { recordDuel, isRivalryReady } from './RivalryEngine';
import { createSecretMission, resolveExpiredMissions } from './MissionEngine';
import { assignStartingJoker } from './JokerEngine';
import { maybeTriggerRandomEvent } from './RandomEvents';
import { createRng, randomSeed } from './random';

export interface RoundNotice {
  kind: 'rule_expired' | 'mission_expired' | 'random_event' | 'new_mission' | 'rivalry_ready';
  text: string;
  randomEvent?: RandomEventType;
  mission?: SecretMission;
}

export interface RoundResult {
  challenge: ActiveChallenge;
  notices: RoundNotice[];
}

export interface ChallengeOutcome {
  loserId?: string;
  winnerId?: string;
}

const RANDOM_EVENT_LABEL: Record<RandomEventType, string> = {
  double_trouble: 'Die nächste Challenge zählt doppelt!',
  revenge: 'Revanche! Der zuletzt Bestrafte darf jemanden auswählen.',
  chaos_round: 'Chaos-Runde! Alle sind diesmal dran.',
  team_battle: 'Team Battle! Zwei Teams treten gegeneinander an.',
  boss_round: 'Boss-Runde! Ein Spieler übernimmt das Kommando.',
};

function freshPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    stats: {
      challengesReceived: 0,
      wins: 0,
      losses: 0,
      jokersUsed: 0,
      jokersAvailable: [],
      lastSelectedRound: 0,
      chaosScore: 0,
      opponents: {},
    },
  };
}

/**
 * Owns the entire session's mutable state and the rules for how it evolves.
 * Deliberately framework-agnostic (no React, no store) so it can be unit
 * tested in isolation and reused by any UI layer.
 */
export class GameEngine {
  state: GameSessionState;
  private rng: () => number;
  private pool: Challenge[];
  private doubleNextChallenge = false;
  private forcedDeciderId?: string;
  private teamBattleRuleId?: string;
  private ownedPremium: boolean;
  private chaosRoundBoost = false;

  constructor(
    players: { id: string; name: string }[],
    settings: GameSettings,
    options: { ownedPremium?: boolean; seed?: number } = {}
  ) {
    // No real payment flow exists yet (see product plan §21) - every mode is
    // fully playable in this MVP so it can actually be tested end-to-end.
    // The premium flag stays wired through the whole data model so a real
    // paywall is a config flip away, not a re-architecture.
    this.ownedPremium = options.ownedPremium ?? true;
    this.rng = createRng(options.seed ?? randomSeed());
    this.pool = loadChallengePool({
      mode: settings.mode,
      playerCount: players.length,
      alcoholEnabled: settings.alcoholEnabled,
      contentLevel: settings.contentLevel,
      ownedPremium: this.ownedPremium,
    });

    this.state = {
      players: players.map((p) => {
        const player = freshPlayer(p.id, p.name);
        player.stats.jokersAvailable = [assignStartingJoker(this.rng)];
        return player;
      }),
      settings,
      round: 0,
      phase: 'warmup',
      history: [],
      temporaryRules: [],
      secretMissions: [],
      randomEventLog: [],
      teams: {},
      rivalries: [],
      startedAt: Date.now(),
      isFinished: false,
    };
  }

  private effectiveMaxIntensity(): 1 | 2 | 3 | 4 | 5 {
    const { settings, round } = this.state;
    let target: number = settings.intensity;
    if (settings.progressiveMode) {
      // Ramps from 1 up toward (and potentially past) the dialed-in
      // intensity as the session progresses, so a group can start chill
      // and let the app carry them up rather than dialing it manually.
      const totalRounds = getEstimatedTotalRounds(settings.sessionLength);
      const progress = Math.min(1, round / totalRounds);
      target = Math.min(5, Math.max(settings.intensity, Math.round(1 + progress * 4)));
    }
    target += phaseIntensityBias(this.state.phase);
    return Math.min(5, Math.max(1, Math.round(target))) as 1 | 2 | 3 | 4 | 5;
  }

  private findPlayer(id: string): Player | undefined {
    return this.state.players.find((p) => p.id === id);
  }

  private updatePlayer(id: string, updater: (player: Player) => Player): void {
    this.state.players = this.state.players.map((p) => (p.id === id ? updater(p) : p));
  }

  /** Starts the session and draws the first challenge. */
  start(): RoundResult {
    return this.advanceRound();
  }

  useJoker(playerId: string, joker: JokerType): boolean {
    const player = this.findPlayer(playerId);
    if (!player || !player.stats.jokersAvailable.includes(joker)) return false;

    if (joker === 'shield') {
      this.updatePlayer(playerId, (p) => ({
        ...p,
        stats: { ...p.stats, protectedUntilRound: this.state.round + 3 },
      }));
    }
    // 'skip', 'pass', 'choose_target', 'double_or_nothing' are resolved by
    // the calling UI (e.g. skip triggers an immediate re-draw of the
    // current round) - here we only account for consumption.
    this.updatePlayer(playerId, (p) => ({
      ...p,
      stats: {
        ...p.stats,
        jokersAvailable: p.stats.jokersAvailable.filter((j) => j !== joker),
        jokersUsed: p.stats.jokersUsed + 1,
      },
    }));
    return true;
  }

  resolveChallenge(outcome?: ChallengeOutcome): void {
    const active = this.state.currentChallenge;
    if (!active) return;
    const { challenge } = active;

    if (challenge.type === 'duel' && active.involvedPlayerIds.length === 2) {
      const [a, b] = active.involvedPlayerIds as [string, string];
      this.state.rivalries = recordDuel(this.state.rivalries, a, b);
      if (isRivalryReady(this.state.rivalries, a, b)) {
        // Flagged for the UI via the next random-event roll rather than
        // forcing an immediate popup - keeps rivalry payoff feeling earned,
        // not scripted.
      }
    }

    if (outcome?.loserId) {
      const isDouble = this.doubleNextChallenge;
      this.updatePlayer(outcome.loserId, (p) => ({
        ...p,
        stats: {
          ...p.stats,
          losses: p.stats.losses + (isDouble ? 2 : 1),
          chaosScore: p.stats.chaosScore + (isDouble ? 10 : 5),
        },
      }));
      this.lastPenalizedPlayerId = outcome.loserId;
      if (challenge.followUpEffect === 'joker_award') {
        this.grantRandomJoker(outcome.loserId);
      }
    }
    if (outcome?.winnerId) {
      this.updatePlayer(outcome.winnerId, (p) => ({
        ...p,
        stats: { ...p.stats, wins: p.stats.wins + 1, chaosScore: p.stats.chaosScore + 2 },
      }));
      if (challenge.followUpEffect === 'joker_award' && !outcome.loserId) {
        this.grantRandomJoker(outcome.winnerId);
      }
    }

    this.doubleNextChallenge = false;
  }

  private lastPenalizedPlayerId: string | undefined;

  private grantRandomJoker(playerId: string): void {
    const jokers: JokerType[] = ['skip', 'pass', 'choose_target', 'double_or_nothing', 'shield'];
    const joker = jokers[Math.floor(this.rng() * jokers.length)] ?? 'skip';
    this.updatePlayer(playerId, (p) => ({
      ...p,
      stats: { ...p.stats, jokersAvailable: [...p.stats.jokersAvailable, joker] },
    }));
  }

  private applyDrawTimeEffect(
    challenge: Challenge,
    involvedPlayerIds: string[],
    renderedText: string
  ): RoundNotice[] {
    const notices: RoundNotice[] = [];
    switch (challenge.followUpEffect) {
      case 'temp_rule': {
        const description = challenge.ruleTemplate
          ? this.renderRuleTemplate(challenge.ruleTemplate, involvedPlayerIds)
          : renderedText;
        const rule = createTemporaryRule(description, involvedPlayerIds, this.state.round, 5);
        this.state.temporaryRules = [...this.state.temporaryRules, rule];
        break;
      }
      case 'crown_role': {
        const target = involvedPlayerIds[0];
        if (target) {
          this.updatePlayer(target, (p) => ({
            ...p,
            stats: { ...p.stats, crownRole: { label: 'Boss', untilRound: this.state.round + 3 } },
          }));
        }
        break;
      }
      case 'protection_shield': {
        const target = involvedPlayerIds[0];
        if (target) {
          this.updatePlayer(target, (p) => ({
            ...p,
            stats: { ...p.stats, protectedUntilRound: this.state.round + 3 },
          }));
        }
        break;
      }
      case 'team_formed': {
        const [a, b] = involvedPlayerIds;
        if (a && b) {
          const teamId = `team_${this.state.round}`;
          this.state.teams = { ...this.state.teams, [a]: teamId, [b]: teamId };
          this.updatePlayer(a, (p) => ({ ...p, stats: { ...p.stats, teamWith: b } }));
          this.updatePlayer(b, (p) => ({ ...p, stats: { ...p.stats, teamWith: a } }));
        }
        break;
      }
      case 'secret_mission': {
        const mission = createSecretMission(this.state.players, this.state.round, this.rng);
        if (mission) {
          this.state.secretMissions = [...this.state.secretMissions, mission];
          const name = this.findPlayer(mission.playerId)?.name ?? '';
          notices.push({ kind: 'new_mission', text: `Geheime Mission für ${name}`, mission });
        }
        break;
      }
      default:
        break;
    }
    return notices;
  }

  private renderRuleTemplate(template: string, involvedPlayerIds: string[]): string {
    const name = this.findPlayer(involvedPlayerIds[0] ?? '')?.name ?? '';
    return template.replace(/\{player\}/g, name).replace(/\{number\}/g, '5');
  }

  private buildRenderContext(players: string[]) {
    const shuffled = [...this.state.players].sort(() => this.rng() - 0.5);
    return {
      player: players[0] ? this.findPlayer(players[0])?.name : undefined,
      player1: players[0] ? this.findPlayer(players[0])?.name : undefined,
      player2: players[1] ? this.findPlayer(players[1])?.name : undefined,
      player3: players[2] ? this.findPlayer(players[2])?.name : undefined,
      randomPlayer: shuffled[0]?.name,
      team: 'Team',
      number: 5,
      duration: undefined as number | undefined,
      scenarioBanks: getScenarioBanks(),
      rng: this.rng,
    };
  }

  private pickPlayersForChallenge(challenge: Challenge): Player[] {
    const count = challenge.variables.filter((v) => v.startsWith('player')).length;
    const needed = new Set(challenge.variables);
    let n = 0;
    if (needed.has('player') || needed.has('player1')) n = Math.max(n, 1);
    if (needed.has('player2')) n = Math.max(n, 2);
    if (needed.has('player3')) n = Math.max(n, 3);
    if (n === 0) n = count > 0 ? count : 0;

    if (this.forcedDeciderId && n > 0 && this.findPlayer(this.forcedDeciderId)) {
      const forced = this.findPlayer(this.forcedDeciderId)!;
      const rest = pickMultipleWeightedPlayers(this.state.players, this.rng, n - 1, {
        round: this.state.round,
      }).filter((p) => p.id !== forced.id);
      this.forcedDeciderId = undefined;
      return [forced, ...rest].slice(0, n);
    }

    return pickMultipleWeightedPlayers(this.state.players, this.rng, n, { round: this.state.round });
  }

  advanceRound(): RoundResult {
    this.state.round += 1;
    const round = this.state.round;
    const notices: RoundNotice[] = [];

    this.state.phase = computePhase(round, this.state.settings.sessionLength);

    const { active: activeRules, expired: expiredRules } = advanceRules(
      this.state.temporaryRules,
      round
    );
    this.state.temporaryRules = activeRules;
    for (const rule of expiredRules) {
      notices.push({ kind: 'rule_expired', text: `Regel beendet: ${rule.description}` });
    }
    if (this.teamBattleRuleId && expiredRules.some((r) => r.id === this.teamBattleRuleId)) {
      this.state.teams = {};
      this.teamBattleRuleId = undefined;
    }

    const { stillActive, justExpired } = resolveExpiredMissions(this.state.secretMissions, round);
    this.state.secretMissions = stillActive;
    for (const mission of justExpired) {
      const name = this.findPlayer(mission.playerId)?.name ?? '';
      notices.push({ kind: 'mission_expired', text: `Mission von ${name} ist ausgelaufen.` });
    }

    const event = maybeTriggerRandomEvent({
      phase: this.state.phase,
      round,
      lastPenalizedPlayerId: this.lastPenalizedPlayerId,
      players: this.state.players,
      rng: this.rng,
    });
    if (event) {
      this.state.randomEventLog = [...this.state.randomEventLog, { id: `evt_${round}`, type: event, round }];
      notices.push({ kind: 'random_event', text: RANDOM_EVENT_LABEL[event], randomEvent: event });
      this.applyRandomEvent(event);
    }

    const boostedTypes = new Set(['group', 'surprise', 'minigame']);
    const boostedPool = this.chaosRoundBoost
      ? this.pool.filter((c) => boostedTypes.has(c.type))
      : undefined;
    this.chaosRoundBoost = false;

    const challenge = selectNextChallenge({
      pool: boostedPool && boostedPool.length > 0 ? boostedPool : this.pool,
      history: this.state.history,
      round,
      phase: this.state.phase,
      maxIntensity: this.effectiveMaxIntensity(),
      rng: this.rng,
    });

    if (!challenge) {
      // Pool exhausted for current constraints (e.g. tiny player count with
      // a narrow content level) - surface an empty round rather than crash.
      const empty: ActiveChallenge = {
        round,
        challenge: {
          id: 'fallback',
          type: 'group',
          modes: [this.state.settings.mode],
          minPlayers: 1,
          intensity: 1,
          alcohol: false,
          contentLevel: 'all',
          template: 'Nehmt euch eine kurze Pause und erzählt euch etwas Lustiges.',
          variables: [],
          weight: 1,
          cooldown: 0,
        },
        renderedText: 'Nehmt euch eine kurze Pause und erzählt euch etwas Lustiges.',
        involvedPlayerIds: [],
      };
      this.state.currentChallenge = empty;
      return { challenge: empty, notices };
    }

    const chosenPlayers = this.pickPlayersForChallenge(challenge);
    const involvedPlayerIds = chosenPlayers.map((p) => p.id);
    for (const p of chosenPlayers) {
      this.updatePlayer(p.id, (pl) => ({
        ...pl,
        stats: {
          ...pl.stats,
          challengesReceived: pl.stats.challengesReceived + 1,
          lastSelectedRound: round,
        },
      }));
    }

    const ctx = this.buildRenderContext(involvedPlayerIds);
    if (challenge.duration) ctx.duration = challenge.duration;
    const renderedText = renderTemplate(challenge, ctx);
    const renderedNoAlcoholText =
      challenge.alcohol && !this.state.settings.alcoholEnabled && challenge.noAlcoholAlternative
        ? this.substitutePlayerNames(challenge.noAlcoholAlternative, involvedPlayerIds)
        : undefined;

    const finalText = renderedNoAlcoholText ?? renderedText;

    notices.push(...this.applyDrawTimeEffect(challenge, involvedPlayerIds, finalText));

    const active: ActiveChallenge = {
      round,
      challenge,
      renderedText: finalText,
      involvedPlayerIds,
      isRandomEvent: event,
    };
    this.state.currentChallenge = active;
    this.state.history = [...this.state.history, { challengeId: challenge.id, round }];

    return { challenge: active, notices };
  }

  private substitutePlayerNames(template: string, involvedPlayerIds: string[]): string {
    const ctx = this.buildRenderContext(involvedPlayerIds);
    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
      const value = (ctx as Record<string, unknown>)[key];
      return typeof value === 'string' ? value : match;
    });
  }

  private applyRandomEvent(event: RandomEventType): void {
    switch (event) {
      case 'double_trouble':
        this.doubleNextChallenge = true;
        break;
      case 'revenge':
        this.forcedDeciderId = this.lastPenalizedPlayerId;
        break;
      case 'boss_round': {
        const pick = pickWeightedPlayer(this.state.players, this.rng, { round: this.state.round });
        if (pick) {
          this.updatePlayer(pick.id, (p) => ({
            ...p,
            stats: { ...p.stats, crownRole: { label: 'Boss', untilRound: this.state.round + 1 } },
          }));
        }
        break;
      }
      case 'team_battle': {
        const shuffled = [...this.state.players].sort(() => this.rng() - 0.5);
        const mid = Math.ceil(shuffled.length / 2);
        const teams: Record<string, string> = {};
        shuffled.forEach((p, i) => {
          teams[p.id] = i < mid ? 'team_a' : 'team_b';
        });
        this.state.teams = teams;
        const rule = createTemporaryRule('Team Battle: Team A gegen Team B', [], this.state.round, 3);
        this.teamBattleRuleId = rule.id;
        this.state.temporaryRules = [...this.state.temporaryRules, rule];
        break;
      }
      case 'chaos_round':
        this.chaosRoundBoost = true;
        break;
      default:
        break;
    }
  }

  /** Used by the 'double_or_nothing' joker: doubles this round's outcome. */
  markCurrentChallengeDoubled(): void {
    this.doubleNextChallenge = true;
  }

  /** Used by the 'choose_target'/'pass' jokers: forces who decides next round. */
  forceNextDecider(playerId: string): void {
    this.forcedDeciderId = playerId;
  }

  endSession(): void {
    this.state.isFinished = true;
  }
}
