import type { Challenge, ChallengeType, ContentLevel, GameMode } from './content';

export type SessionLength = 'quick' | 'normal' | 'party' | 'endless';

export type GamePhase = 'warmup' | 'interaction' | 'chaos' | 'peak' | 'finale';

export type JokerType =
  | 'skip'
  | 'pass'
  | 'choose_target'
  | 'double_or_nothing'
  | 'shield';

export interface Player {
  id: string;
  name: string;
  /** Session-only stats, reset every game */
  stats: PlayerStats;
}

export interface PlayerStats {
  challengesReceived: number;
  wins: number;
  losses: number;
  jokersUsed: number;
  jokersAvailable: JokerType[];
  lastSelectedRound: number;
  chaosScore: number;
  protectedUntilRound?: number;
  crownRole?: { label: string; untilRound: number };
  opponents: Record<string, number>; // playerId -> times faced in a duel
  teamWith?: string; // playerId of temporary teammate
}

export interface TemporaryRule {
  id: string;
  description: string;
  playerIds: string[];
  startedRound: number;
  expiresRound: number;
}

export interface SecretMission {
  id: string;
  playerId: string;
  description: string;
  startedRound: number;
  expiresRound: number;
  status: 'active' | 'success' | 'failed';
}

export interface RandomEventLog {
  id: string;
  type: RandomEventType;
  round: number;
}

export type RandomEventType =
  | 'double_trouble'
  | 'revenge'
  | 'chaos_round'
  | 'team_battle'
  | 'boss_round';

export interface ActiveChallenge {
  round: number;
  challenge: Challenge;
  renderedText: string;
  renderedNoAlcoholText?: string;
  involvedPlayerIds: string[];
  isRandomEvent?: RandomEventType;
}

export interface GameSettings {
  mode: GameMode;
  alcoholEnabled: boolean;
  intensity: 1 | 2 | 3 | 4 | 5;
  progressiveMode: boolean;
  sessionLength: SessionLength;
  contentLevel: ContentLevel;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  language: 'de' | 'en';
}

export interface GameSessionState {
  players: Player[];
  settings: GameSettings;
  round: number;
  phase: GamePhase;
  history: { challengeId: string; round: number }[];
  temporaryRules: TemporaryRule[];
  secretMissions: SecretMission[];
  randomEventLog: RandomEventLog[];
  teams: Record<string, string>; // playerId -> teamId
  rivalries: { pair: [string, string]; count: number }[];
  currentChallenge?: ActiveChallenge;
  startedAt: number;
  isFinished: boolean;
}

export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  dare: 'Challenge',
  truth: 'Wahrheit',
  vote: 'Abstimmung',
  duel: 'Duell',
  group: 'Gruppe',
  decision: 'Entscheidung',
  surprise: 'Überraschung',
  minigame: 'Mini-Game',
};
