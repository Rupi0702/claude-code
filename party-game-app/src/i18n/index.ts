import { de } from './de';
import { en } from './en';

export type Locale = 'de' | 'en';

const dictionaries = { de, en };

type Vars = Record<string, string | number>;

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const value = getPath(dictionaries[locale], key);
  if (typeof value !== 'string') {
    return key;
  }
  return interpolate(value, vars);
}

export { dictionaries };
