import { create } from 'zustand';
import { GameEngine, type ChallengeOutcome, type RoundNotice } from '../engine/GameEngine';
import type { GameSessionState, GameSettings, JokerType } from '../types/game';
import { buildEndGameSummary, type EndGameSummary } from '../engine/sessionStats';

interface GameStore {
  engine?: GameEngine;
  session?: GameSessionState;
  lastNotices: RoundNotice[];
  summary?: EndGameSummary;
  startGame: (players: { id: string; name: string }[], settings: GameSettings) => void;
  nextChallenge: (outcome?: ChallengeOutcome) => void;
  useJoker: (playerId: string, joker: JokerType) => boolean;
  markDoubled: () => void;
  forceNextDecider: (playerId: string) => void;
  endGame: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: undefined,
  lastNotices: [],
  summary: undefined,

  startGame: (players, settings) => {
    const engine = new GameEngine(players, settings);
    const result = engine.start();
    set({ engine, session: { ...engine.state }, lastNotices: result.notices, summary: undefined });
  },

  nextChallenge: (outcome) => {
    const { engine } = get();
    if (!engine) return;
    engine.resolveChallenge(outcome);
    const result = engine.advanceRound();
    set({ session: { ...engine.state }, lastNotices: result.notices });
  },

  useJoker: (playerId, joker) => {
    const { engine } = get();
    if (!engine) return false;
    const ok = engine.useJoker(playerId, joker);
    if (ok) set({ session: { ...engine.state } });
    return ok;
  },

  markDoubled: () => {
    const { engine } = get();
    if (!engine) return;
    engine.markCurrentChallengeDoubled();
    set({ session: { ...engine.state } });
  },

  forceNextDecider: (playerId) => {
    const { engine } = get();
    if (!engine) return;
    engine.forceNextDecider(playerId);
  },

  endGame: () => {
    const { engine } = get();
    if (!engine) return;
    engine.endSession();
    const summary = buildEndGameSummary(engine.state);
    set({ session: { ...engine.state }, summary });
  },

  reset: () => set({ engine: undefined, session: undefined, lastNotices: [], summary: undefined }),
}));
