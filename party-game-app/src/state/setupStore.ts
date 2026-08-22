import { create } from 'zustand';
import type { GameMode } from '../types/content';

export interface DraftPlayer {
  id: string;
  name: string;
}

interface SetupStore {
  mode?: GameMode;
  players: DraftPlayer[];
  setMode: (mode: GameMode) => void;
  addPlayer: (name: string) => boolean;
  removePlayer: (id: string) => void;
  clearPlayers: () => void;
}

let idCounter = 0;

export const useSetupStore = create<SetupStore>((set, get) => ({
  mode: undefined,
  players: [],
  setMode: (mode) => set({ mode }),
  addPlayer: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const exists = get().players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;
    idCounter += 1;
    set({ players: [...get().players, { id: `player_${idCounter}`, name: trimmed }] });
    return true;
  },
  removePlayer: (id) => set({ players: get().players.filter((p) => p.id !== id) }),
  clearPlayers: () => set({ players: [] }),
}));
