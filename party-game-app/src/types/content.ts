/**
 * Content type contracts for the challenge/content system.
 * Keeping content fully data-driven (no logic embedded in challenge text)
 * is what lets us scale from ~170 challenges to thousands later without
 * touching the game engine or UI.
 */

export type GameMode =
  | 'classic'
  | 'icebreaker'
  | 'bestfriends'
  | 'couples'
  | 'wild'
  | 'chaos';

export type ChallengeType =
  | 'dare' // eine Person muss etwas tun
  | 'truth' // eine Person muss etwas beantworten
  | 'vote' // alle stimmen über eine Person ab
  | 'duel' // zwei Spieler gegeneinander
  | 'group' // alle / fast alle machen mit
  | 'decision' // ein Spieler entscheidet etwas für andere
  | 'surprise' // Overlay / Random-Event getriggert
  | 'minigame'; // kurzes physisches oder verbales Mini-Game

export type ContentLevel = 'all' | '16+' | '18+';

/**
 * Effect that can follow a challenge (resolved by the engine, not by content).
 * Content only *requests* an effect by id; the engine decides how it plays out.
 */
export type FollowUpEffect =
  | 'none'
  | 'drink_penalty' // Party Mode: kleine Trink-Strafe für Verlierer
  | 'temp_rule' // erzeugt eine temporäre Regel (Text kommt aus `ruleTemplate`)
  | 'team_formed' // erzeugt ein temporäres 2er-Team
  | 'joker_award' // Verlierer/Gewinner bekommt einen Joker
  | 'secret_mission' // startet eine geheime Mission für eine Person
  | 'crown_role' // Spieler wird für n Runden "Queen/King/Boss"
  | 'protection_shield'; // Spieler ist für n Runden vor Strafen geschützt

export interface Challenge {
  id: string;
  type: ChallengeType;
  modes: GameMode[];
  minPlayers: number;
  maxPlayers?: number;
  /** 1 Chill … 5 Insane */
  intensity: 1 | 2 | 3 | 4 | 5;
  alcohol: boolean;
  /** No-Alcohol-Mode Ersatztext. Pflicht wenn alcohol=true. */
  noAlcoholAlternative?: string;
  contentLevel: ContentLevel;
  premium?: boolean;
  /** Text mit Platzhaltern, z.B. "{player1} fordert {player2} heraus: {scenario}" */
  template: string;
  /** Welche Variablen im Template vorkommen, damit der Renderer sie auflösen kann */
  variables: TemplateVariable[];
  /** Wenn eine Variable eine Scenario-Kategorie braucht, z.B. scenario:wouldYouRather */
  scenarioCategory?: ScenarioCategory;
  /** Basisgewicht für die Auswahl-Wahrscheinlichkeit (Standard 10) */
  weight: number;
  /** Anzahl Runden, die vergehen muss, bevor dieselbe Challenge wieder gezogen werden darf */
  cooldown: number;
  /** Für getimte Challenges, in Sekunden */
  duration?: number;
  followUpEffect?: FollowUpEffect;
  /** Nur relevant wenn followUpEffect temp_rule ist: Template für die neue Regel */
  ruleTemplate?: string;
  tags?: string[];
}

export type TemplateVariable =
  | 'player'
  | 'player1'
  | 'player2'
  | 'player3'
  | 'randomPlayer'
  | 'team'
  | 'number'
  | 'duration'
  | 'scenario'
  | 'category';

export type ScenarioCategory =
  | 'wouldYouRather'
  | 'mostLikelyTo'
  | 'confession'
  | 'embarrassingQuestion'
  | 'compliment'
  | 'guessing'
  | 'memory'
  | 'accent'
  | 'impression';

export interface ScenarioBank {
  category: ScenarioCategory;
  contentLevel: ContentLevel;
  intensity: 1 | 2 | 3 | 4 | 5;
  modes: GameMode[];
  entries: string[];
}

export interface ContentPack {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  challengeIds: string[];
}
