# Chaosrunde

Ein eigenständiges Party-/Trinkspiel für iOS & Android (React Native + Expo + TypeScript). Alkohol ist optional, die Game Engine ist es nicht — Auswahl, Regeln, Rivalitäten und Dramaturgie laufen über einen echten Regelmotor statt über eine zufällige Textliste.

## Phase 1 — Analyse: Was funktioniert, was nervt

**Was bestehende Party-/Trinkspiel-Apps gut machen:** niedrige Einstiegshürde (App auf, Namen rein, los geht's), kurze lesbare Texte, ein einzelner geteilter Bildschirm reicht für die ganze Gruppe, Intensität ist wählbar.

**Was nach 20–30 Minuten typischerweise langweilig wird:**
- Die Auswahl wirkt nach einer Weile nicht mehr zufällig, sondern *ungerecht* — dieselben 2–3 Namen tauchen gefühlt ständig auf, weil reiner Zufall ohne Gedächtnis genau das erzeugt.
- Jede Karte ist ein isolierter Moment. Nichts von Runde 3 hat Auswirkung auf Runde 30. Die Gruppe merkt sich Insider, die App nicht.
- Der Schwierigkeits-/Intensitätsgrad bleibt über die ganze Session gleich flach — kein Spannungsbogen, kein "es wird jetzt wilder".
- Karten sind entweder Solo-Aufgaben oder Gruppen-Voting; echte Spieler-gegen-Spieler-Dynamik (Rivalität, Revanche) fehlt fast überall.
- Der Alkohol-Toggle ist oft ein reiner Textfilter, keine gleichwertige zweite Erfahrung.

**Wie wir das adressieren:** ein Regelmotor mit Gedächtnis (wer wurde gewählt, gegen wen, welche Regeln laufen gerade), eine Dramaturgie mit Phasen, echte Spieler-gegen-Spieler-Mechaniken (Rivalitäten, Duelle, Teams), und Secret Missions/Joker als asymmetrische, private Ebene on top of dem gemeinsamen Screen.

## Phase 2 — Produktkonzept

**Name:** *Chaosrunde* (Alternativen erwogen: „Funkenkreis", „Nachtzunder" — *Chaosrunde* transportiert das Kern-Feature, den unvorhersehbaren Chaos Mode, am direktesten und ist als Domain/Store-Name unbelastet).

**USP:** Eine Party-App mit Gedächtnis. Sie merkt sich, wer schon dran war, wer gegen wen gespielt hat und welche Regeln gerade laufen — und baut daraus Revanchen, temporäre Regeln und einen echten Spannungsbogen statt einer endlosen Zufallsliste.

**Zielgruppe:** Gruppen von 3–12 Personen, 16–35 Jahre, sowohl "wir kennen uns kaum" (Icebreaker) als auch "wir sind seit Jahren befreundet" (Best Friends) — die Modi differenzieren das explizit, statt eine Einheits-Erfahrung für alle zu erzwingen.

**Core Loop:** Karte zeigen → Gruppe führt aus → optional Ergebnis eintragen (wer hat verloren/gewonnen) → Engine aktualisiert Gedächtnis (Auswahl-Historie, Rivalitäten, Regeln, Missionen) → nächste Karte.

**Game Loop (Session):** Warm-up → Interaktion → Chaos → Peak → Finale → Endscreen mit Session-Stats, danach optional „Noch eine Runde".

**Spielmodi:** Classic Party, Icebreaker, Best Friends, Couples & Friends, Wild (mit Warnhinweis), Chaos Mode — siehe `src/content/packs.ts` für die Free/Premium-Zuordnung.

**Random Events:** Double Trouble, Revenge, Chaos Round, Team Battle, Boss Round — siehe `src/engine/RandomEvents.ts`.

## Ausgewählte Zusatz-Features (von 10+ eigenen Ideen)

Bewertet nach Spaßfaktor / Umsetzbarkeit / Einzigartigkeit / Wiederspielbarkeit / Aufwand. Die Top 5 sind umgesetzt, der Rest bewusst zurückgestellt, um die App in wenigen Sekunden verständlich zu halten (siehe Anforderung §28):

| # | Idee | Spaß | Umsetzbar | Einzigartig | Replay | Aufwand | Status |
|---|------|------|-----------|-------------|--------|---------|--------|
| 1 | Intelligente Spieler-Auswahl mit Cooldown/Fairness | hoch | hoch | hoch | hoch | mittel | ✅ umgesetzt |
| 2 | Rivalitäten & automatische Revanche-Events | hoch | mittel | hoch | hoch | mittel | ✅ umgesetzt |
| 3 | Temporäre Regeln mit automatischem Ablauf | hoch | mittel | hoch | mittel | mittel | ✅ umgesetzt |
| 4 | Secret Missions (privat, ein Gerät) | hoch | mittel | sehr hoch | hoch | mittel | ✅ umgesetzt |
| 5 | Dramaturgie-Phasen (Warmup→Finale) | mittel | hoch | mittel | mittel | niedrig | ✅ umgesetzt |
| 6 | Joker-System | mittel | hoch | mittel | mittel | niedrig | ✅ umgesetzt |
| 7 | Progressive-Intensity-Automatik | mittel | hoch | niedrig | niedrig | niedrig | ✅ umgesetzt |
| 8 | Eigene Packs/Custom-Content-Editor | hoch | niedrig | hoch | hoch | hoch | ⏳ Architektur vorbereitet, nicht gebaut |
| 9 | Foto-Beweise für Challenges | mittel | mittel | mittel | niedrig | hoch | ❌ zurückgestellt (braucht Kamera/Storage-Berechtigungen, sprengt Offline-First) |
| 10 | Team-Liga über mehrere Sessions | mittel | mittel | niedrig | mittel | hoch | ❌ zurückgestellt (braucht Cloud-Accounts, widerspricht §25 Datensparsamkeit) |
| 11 | Sprachsteuerung zur Mission-Auswertung | hoch | niedrig | sehr hoch | hoch | sehr hoch | ❌ zurückgestellt (Speech-to-Text offline unrealistisch für MVP) |
| 12 | Saisonale Content-Packs (Festival, Xmas, …) | mittel | hoch | niedrig | mittel | niedrig | ⏳ Architektur vorbereitet (`ContentPack`), keine Packs befüllt |

## Phase 3 — UX-Flow

```
Launch → Home → Modus wählen → Spieler eingeben → Einstellungen → Start
   → Game (Karte → optional Ergebnis → nächste Karte, wiederholt)
   → Endscreen (Stats, Noch eine Runde / Zurück zum Start)
```

Jeder Schritt ist ein einziger Tap-Screen; „Start" ist in maximal 4 Taps von „Home" erreichbar (Modus, mind. 3 Spielernamen, Los geht's).

## Phase 4 — Architektur

```
party-game-app/
  App.tsx                     Einstiegspunkt, Settings-Hydration
  src/
    types/                    content.ts, game.ts — die einzige Quelle der Wahrheit für Schemas
    content/
      challenges.data.ts       ~175 Challenges (Daten, keine Logik)
      scenarios.data.ts         Scenario-Bänke für {scenario}-Platzhalter
      contentLoader.ts         Filtert nach Modus/Spielerzahl/Content-Level/Premium
      packs.ts                 Free/Premium-Zuordnung, Grundgerüst für DLC-Packs
    engine/                    Reines TypeScript, kein React — unabhängig testbar
      GameEngine.ts             Orchestriert die gesamte Session
      PlayerSelector.ts         Gewichtete, cooldown-bewusste Spielerauswahl
      ChallengeSelector.ts      Gewichtete Challenge-Auswahl inkl. Cooldown & Phasen-Bias
      PhaseManager.ts           Warmup→Finale-Dramaturgie
      RuleEngine.ts             Lifecycle temporärer Regeln
      RivalryEngine.ts          Rivalitäts-Zähler, Revenge-Trigger
      MissionEngine.ts          Secret Missions
      JokerEngine.ts            Start-Joker-Zuteilung
      RandomEvents.ts           Double Trouble / Revenge / Chaos / Team Battle / Boss
      templateRenderer.ts       {player1}/{scenario}/… Platzhalter-Ersetzung
      sessionStats.ts           Endscreen-Zusammenfassung
    state/                     Zustand-Stores (dünne Wrapper um die Engine, kein Geschäftslogik-Duplikat)
    screens/, components/, navigation/, theme/, i18n/
```

**State Management:** [Zustand](https://github.com/pmndrs/zustand) statt Redux/Context. *Begründung:* kein Boilerplate (Reducer/Actions/Provider-Verschachtelung), native Selector-basierte Re-Renders ohne `useMemo`-Wrapper, und die eigentliche Logik lebt ohnehin in `GameEngine` — der Store ist bewusst nur ein dünner Adapter zwischen Engine und React, keine zweite Zustandsquelle.

**Content-System:** Challenges sind reine Daten (`Challenge`-Interface) mit Metadaten für Modus, Spieleranzahl, Intensität, Alkohol, Content-Level, Premium, Gewicht, Cooldown, benötigte Variablen und Folgeeffekt. Neue Inhalte oder ganze Packs (`ContentPack`) sind ein Datei-Diff, keine Code-Änderung — das ist die Grundlage, um später auf tausende Challenges zu skalieren.

**Lokalisierung:** `src/i18n` mit vollständigem Typ-Contract (`TranslationSchema`, aus `de.ts` abgeleitet, von `en.ts` erzwungen). Die Spielinhalte selbst (Challenges) sind aktuell nur Deutsch — eine zweite Sprachversion des Contents ist ein weiterer Daten-Layer, keine Architekturänderung.

**Persistenz:** Nur Einstellungen (Sprache, Alkohol-Toggle, Intensität, Sound/Haptics) werden über `AsyncStorage` persistiert. Spieler, Punkte und Session-Statistiken sind bewusst nur In-Memory (siehe §19/§25) — kein Namens-Tracking über Sessions hinweg, keine Registrierung nötig.

## Bewusste Abweichungen von der Vorgabe (Problem → Lösung → Grund)

1. **Problem:** „Secret Missions" sollen automatisch auswerten, ob jemand ein Wort gesagt hat — auf einem gemeinsamen Handy ohne Mikrofon-Dauerzugriff technisch nicht seriös umsetzbar (und würde Offline-First/Datenschutz verletzen). **Lösung:** Die App zeigt die Mission nur beim aktiven Antippen (Press-and-hold) an, damit niemand sonst am Tisch sie sieht; die ehrliche Selbstauskunft der Gruppe entscheidet über Erfolg/Misserfolg. **Grund:** einzige Lösung, die mit „nur ein gemeinsames Smartphone" (§8) und Offline-First (§24) vereinbar ist.
2. **Problem:** Wer bei einem Voting/Duell „verloren" hat, kann die App nicht wissen (das entscheidet die Gruppe live). **Lösung:** Nach Challenges mit Gewinner/Verlierer-Effekt erscheint ein optionaler „Wer hat verloren?"-Chooser (überspringbar), erst danach aktualisiert die Engine Statistiken/Rivalitäten. **Grund:** Ehrlicher als so zu tun, als könnte die App das Ergebnis erraten.
3. **Problem:** Echtes Payment sollte laut Vorgabe noch nicht gebaut werden, aber 3 von 6 Modi sind als Premium markiert — ein hartes Lock hätte sie im MVP unspielbar gemacht. **Lösung:** `ownedPremium` defaultet in der Engine auf `true`, das Flag bleibt aber vollständig durch Content/Mode/Store verdrahtet. **Grund:** MVP muss vollständig test- und spielbar sein; der Store-Anschluss ist ein einzeiliger Flip, keine Re-Architektur.
4. **Problem:** Zustand statt des in der Vorgabe nicht festgelegten State-Management-Ansatzes. **Lösung/Grund:** siehe „State Management" oben.

## Sicherheit & Verantwortung

Alkohol-Strafen sind immer moderat ("ein Schluck", "zwei Schlucke verteilen") — nie "trinke das Glas leer" oder Trink-Geschwindigkeit. Keine Inhalte zu Autofahren, Medikamenten, gefährlichen körperlichen Mutproben oder illegalen Handlungen. Jede alkoholbezogene Challenge hat eine vollwertige `noAlcoholAlternative`.

## Setup

```bash
npm install
npx expo start        # QR-Code mit Expo Go scannen, oder --ios / --android / --web
npm run typecheck
npm run lint
npm run test
```

## Bekannte Grenzen dieses MVP

- Chaos-Round-Event zeigt weiterhin eine einzelne Karte (gewichtet auf Gruppen-/Überraschungs-Typen) statt paralleler Karten pro Spieler — eine "alle bekommen gleichzeitig eine eigene Karte"-UI ist als nächster Schritt vorgesehen.
- Eigene Packs (Custom Content Editor) sind als Datenschema vorbereitet, aber ohne Editor-UI.
- Kein Sound-Asset-Set eingebunden — die Einstellungen und Hook-Punkte (`settings.soundEnabled`) existieren, Audiodateien fehlen noch.
- Kein App-Icon/Splash-Bild (`assets/icon.png`) eingebunden — für Expo Go/Metro-Bundling unkritisch (siehe QA-Ergebnisse unten), vor einem echten Store-Build muss ein Icon-Set ergänzt werden.

## Durchgeführte QA (siehe §30 der Anforderung)

- `npm install` — sauber (0 Fehler).
- `npm run typecheck` (`tsc --noEmit`, strict inkl. `noUncheckedIndexedAccess`) — 0 Fehler.
- `npm run lint` — 0 Fehler, 0 Warnungen.
- `npm test` (Jest) — 8/8 Tests grün, u. a.: 3 vs. 12 Spieler, Determinismus bei fixem Seed, Cooldown wird nie unterschritten, Session-Neustart setzt Runde/Historie/Stats zurück, No-Alcohol-Alternative wird tatsächlich verwendet, temporäre Regeln laufen ab, Endscreen-Summary entsteht korrekt.
- `expo export --platform ios` und `--platform android` (offline, ohne Simulator) — beide bündeln erfolgreich (1079 Module, keine Auflösungs-/Syntaxfehler).
- **Nicht möglich in dieser Umgebung:** ein echter Simulator/Emulator-Lauf mit visueller Prüfung (kein Display in dieser Session). Die App sollte vor dem ersten echten Release zusätzlich manuell in Expo Go durchgeklickt werden — Bundling-Erfolg beweist Ladbarkeit, aber keine UI-/UX-Korrektheit.
