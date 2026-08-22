import type { Challenge, ScenarioBank, ScenarioCategory } from '../types/content';

const GENERIC_CATEGORIES = ['Reisen', 'Essen', 'Filme', 'Musik', 'Peinliche Momente', 'Serien'];

export interface RenderContext {
  player?: string;
  player1?: string;
  player2?: string;
  player3?: string;
  randomPlayer?: string;
  team?: string;
  number?: number;
  duration?: number;
  scenarioBanks: ScenarioBank[];
  rng: () => number;
}

function pickScenario(
  category: ScenarioCategory | undefined,
  banks: ScenarioBank[],
  rng: () => number
): string {
  if (!category) return '';
  const candidates = banks.filter((b) => b.category === category);
  const entries = candidates.flatMap((b) => b.entries);
  if (entries.length === 0) return '';
  const index = Math.floor(rng() * entries.length);
  return entries[index] ?? entries[0] ?? '';
}

/**
 * Fills a challenge's `{placeholder}` template with concrete values. Kept
 * separate from the selection logic so content authors only ever write
 * templates + variable lists, never string-concatenation code.
 */
export function renderTemplate(challenge: Challenge, ctx: RenderContext): string {
  const scenario = pickScenario(challenge.scenarioCategory, ctx.scenarioBanks, ctx.rng);
  const category = GENERIC_CATEGORIES[Math.floor(ctx.rng() * GENERIC_CATEGORIES.length)] ?? '';

  const values: Record<string, string> = {
    player: ctx.player ?? '',
    player1: ctx.player1 ?? '',
    player2: ctx.player2 ?? '',
    player3: ctx.player3 ?? '',
    randomPlayer: ctx.randomPlayer ?? '',
    team: ctx.team ?? '',
    number: ctx.number != null ? String(ctx.number) : '',
    duration: ctx.duration != null ? String(ctx.duration) : '',
    scenario,
    category,
  };

  return challenge.template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] ?? match : match
  );
}
