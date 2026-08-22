import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { GameMode } from '../types/content';
import type { GameSettings, SessionLength } from '../types/game';
import { translate, type Locale } from '../i18n';

const STORAGE_KEY = 'chaosrunde.settings.v1';

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'classic',
  alcoholEnabled: true,
  intensity: 2,
  progressiveMode: false,
  sessionLength: 'normal',
  contentLevel: 'all',
  soundEnabled: true,
  hapticsEnabled: true,
  language: 'de',
};

interface SettingsStore {
  settings: GameSettings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: GameMode) => void;
  setAlcoholEnabled: (enabled: boolean) => void;
  setIntensity: (intensity: GameSettings['intensity']) => void;
  setProgressiveMode: (enabled: boolean) => void;
  setSessionLength: (length: SessionLength) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setLanguage: (language: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

async function persist(settings: GameSettings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Local persistence is a convenience, not a requirement for offline play.
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GameSettings>;
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed }, hydrated: true });
        return;
      }
    } catch {
      // fall through to defaults
    }
    set({ hydrated: true });
  },
  setMode: (mode) => {
    const next = { ...get().settings, mode };
    set({ settings: next });
    void persist(next);
  },
  setAlcoholEnabled: (alcoholEnabled) => {
    const next = { ...get().settings, alcoholEnabled };
    set({ settings: next });
    void persist(next);
  },
  setIntensity: (intensity) => {
    const next = { ...get().settings, intensity };
    set({ settings: next });
    void persist(next);
  },
  setProgressiveMode: (progressiveMode) => {
    const next = { ...get().settings, progressiveMode };
    set({ settings: next });
    void persist(next);
  },
  setSessionLength: (sessionLength) => {
    const next = { ...get().settings, sessionLength };
    set({ settings: next });
    void persist(next);
  },
  setSoundEnabled: (soundEnabled) => {
    const next = { ...get().settings, soundEnabled };
    set({ settings: next });
    void persist(next);
  },
  setHapticsEnabled: (hapticsEnabled) => {
    const next = { ...get().settings, hapticsEnabled };
    set({ settings: next });
    void persist(next);
  },
  setLanguage: (language) => {
    const next = { ...get().settings, language };
    set({ settings: next });
    void persist(next);
  },
  t: (key, vars) => translate(get().settings.language, key, vars),
}));
