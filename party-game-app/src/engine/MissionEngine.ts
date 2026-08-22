import type { Player, SecretMission } from '../types/game';

let missionCounter = 0;

const MISSION_TEMPLATES = [
  'Bring jemanden dazu, das Wort "{word}" zu sagen.',
  'Bring jemanden dazu, dich für die nächsten {number} Runden anzustarren, wenn du sprichst.',
  'Schaff es, unbemerkt dreimal zu klatschen, ohne dass es jemand kommentiert.',
  'Bring die Gruppe dazu, gemeinsam zu lachen, ohne selbst einen Witz zu erzählen.',
  'Verstecke deine Hände für {number} Runden möglichst oft unter dem Tisch, ohne dass es auffällt.',
];

const MISSION_WORDS = ['Urlaub', 'Pizza', 'ehrlich', 'eigentlich', 'krass', 'Wochenende'];

export function createSecretMission(
  players: Player[],
  round: number,
  rng: () => number,
  durationRounds = 5
): SecretMission | undefined {
  if (players.length === 0) return undefined;
  missionCounter += 1;
  const player = players[Math.floor(rng() * players.length)];
  if (!player) return undefined;
  const template = MISSION_TEMPLATES[Math.floor(rng() * MISSION_TEMPLATES.length)] ?? MISSION_TEMPLATES[0]!;
  const word = MISSION_WORDS[Math.floor(rng() * MISSION_WORDS.length)] ?? MISSION_WORDS[0]!;
  const description = template
    .replace('{word}', word)
    .replace('{number}', String(durationRounds));

  return {
    id: `mission_${round}_${missionCounter}`,
    playerId: player.id,
    description,
    startedRound: round,
    expiresRound: round + durationRounds,
    status: 'active',
  };
}

export function resolveExpiredMissions(
  missions: SecretMission[],
  round: number
): { stillActive: SecretMission[]; justExpired: SecretMission[] } {
  const stillActive: SecretMission[] = [];
  const justExpired: SecretMission[] = [];
  for (const mission of missions) {
    if (mission.status === 'active' && mission.expiresRound <= round) {
      justExpired.push(mission);
    } else {
      stillActive.push(mission);
    }
  }
  return { stillActive, justExpired };
}
