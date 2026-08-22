import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GradientBackground } from '../components/GradientBackground';
import { Button } from '../components/Button';
import { ProgressHeader } from '../components/ProgressHeader';
import { ChallengeCard } from '../components/ChallengeCard';
import { ActiveRulesBar } from '../components/ActiveRulesBar';
import { PlayerChip } from '../components/PlayerChip';
import { JokerBar } from '../components/JokerBar';
import { EventOverlay } from '../components/EventOverlay';
import { MissionCard } from '../components/MissionCard';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useSettingsStore } from '../state/settingsStore';
import { useGameStore } from '../state/gameStore';
import { getEstimatedTotalRounds } from '../engine/PhaseManager';
import type { JokerType } from '../types/game';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const OUTCOME_EFFECTS = new Set(['drink_penalty', 'joker_award']);

export function GameScreen({ navigation }: Props) {
  const t = useSettingsStore((s) => s.t);
  const session = useGameStore((s) => s.session);
  const lastNotices = useGameStore((s) => s.lastNotices);
  const nextChallenge = useGameStore((s) => s.nextChallenge);
  const consumeJoker = useGameStore((s) => s.useJoker);
  const markDoubled = useGameStore((s) => s.markDoubled);
  const forceNextDecider = useGameStore((s) => s.forceNextDecider);
  const endGame = useGameStore((s) => s.endGame);

  const [showOutcomePicker, setShowOutcomePicker] = useState(false);
  const [dismissedEventRound, setDismissedEventRound] = useState<number | null>(null);

  useEffect(() => {
    if (!session) navigation.replace('Home');
  }, [session, navigation]);

  const activeMission = useMemo(() => {
    const notice = lastNotices.find((n) => n.kind === 'new_mission' && n.mission);
    return notice?.mission;
  }, [lastNotices]);

  const randomEventNotice = useMemo(
    () => lastNotices.find((n) => n.kind === 'random_event'),
    [lastNotices]
  );

  if (!session) return null;

  const { currentChallenge, players, temporaryRules, round, phase, settings } = session;
  const showEvent =
    randomEventNotice != null && dismissedEventRound !== round && currentChallenge != null;

  const totalRounds = getEstimatedTotalRounds(settings.sessionLength);
  const progress = settings.sessionLength === 'endless' ? (round % totalRounds) / totalRounds : round / totalRounds;

  const involvedIds = currentChallenge?.involvedPlayerIds ?? [];
  const needsOutcome =
    currentChallenge != null && OUTCOME_EFFECTS.has(currentChallenge.challenge.followUpEffect ?? 'none');
  const outcomeCandidates = involvedIds.length > 0 ? players.filter((p) => involvedIds.includes(p.id)) : players;

  const handleNext = () => {
    if (needsOutcome) {
      setShowOutcomePicker(true);
      return;
    }
    nextChallenge();
  };

  const handlePickLoser = (loserId: string) => {
    const winnerId =
      currentChallenge?.challenge.type === 'duel' && involvedIds.length === 2
        ? involvedIds.find((id) => id !== loserId)
        : undefined;
    setShowOutcomePicker(false);
    nextChallenge({ loserId, winnerId });
  };

  const handleSkipOutcome = () => {
    setShowOutcomePicker(false);
    nextChallenge();
  };

  const handleUseJoker = (playerId: string, joker: JokerType) => {
    const ok = consumeJoker(playerId, joker);
    if (!ok) return;
    if (joker === 'skip') {
      nextChallenge();
    } else if (joker === 'double_or_nothing') {
      markDoubled();
    } else if (joker === 'choose_target' || joker === 'pass') {
      forceNextDecider(playerId);
    }
  };

  const handleEndGame = () => {
    Alert.alert(t('game.endGame'), t('game.endGameConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('game.endGame'),
        style: 'destructive',
        onPress: () => {
          endGame();
          navigation.replace('End');
        },
      },
    ]);
  };

  const jokerHolders = players.filter((p) => p.stats.jokersAvailable.length > 0);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <ProgressHeader
            round={round}
            phase={phase}
            progress={progress}
            intensity={settings.intensity}
            activeModifier={randomEventNotice?.text}
          />
          <Pressable onPress={handleEndGame} style={styles.endButton}>
            <Text style={styles.endButtonText}>✕</Text>
          </Pressable>
        </View>

        <ActiveRulesBar rules={temporaryRules} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersRow}>
          {players.map((p) => (
            <View key={p.id} style={styles.chipWrap}>
              <PlayerChip
                name={p.name}
                size="sm"
                highlighted={involvedIds.includes(p.id)}
                shielded={(p.stats.protectedUntilRound ?? 0) >= round}
                crownLabel={
                  p.stats.crownRole && p.stats.crownRole.untilRound >= round
                    ? p.stats.crownRole.label
                    : undefined
                }
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.cardArea}>
          {currentChallenge && (
            <ChallengeCard
              text={currentChallenge.renderedText}
              type={currentChallenge.challenge.type}
              cardKey={`${round}-${currentChallenge.challenge.id}`}
            />
          )}
        </View>

        {activeMission && (
          <View style={styles.missionWrap}>
            <MissionCard
              playerName={players.find((p) => p.id === activeMission.playerId)?.name ?? ''}
              description={activeMission.description}
              onDismiss={() => {
                /* notices clear automatically on next round draw */
              }}
            />
          </View>
        )}

        {jokerHolders.length > 0 && (
          <View style={styles.jokerSection}>
            {jokerHolders.map((p) => (
              <JokerBar
                key={p.id}
                jokers={p.stats.jokersAvailable}
                onUse={(joker) => handleUseJoker(p.id, joker)}
              />
            ))}
          </View>
        )}

        {showOutcomePicker ? (
          <View style={styles.outcomeBar}>
            <Text style={styles.outcomeLabel}>{t('game.whoLost')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.outcomeScroll}>
              {outcomeCandidates.map((p) => (
                <Pressable key={p.id} onPress={() => handlePickLoser(p.id)} style={styles.outcomeChip}>
                  <Text style={styles.outcomeChipText}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button label="Überspringen" variant="ghost" onPress={handleSkipOutcome} />
          </View>
        ) : (
          <Button label={t('common.next')} onPress={handleNext} style={styles.nextButton} />
        )}
      </SafeAreaView>

      <EventOverlay
        visible={showEvent}
        title={randomEventNotice?.text.split('!')[0] ?? ''}
        description={randomEventNotice?.text ?? ''}
        dismissLabel={t('common.confirm')}
        onDismiss={() => setDismissedEventRound(round)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, gap: spacing.sm },
  topBar: { flexDirection: 'row', alignItems: 'flex-start' },
  endButton: {
    marginRight: spacing.lg,
    marginTop: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: { color: colors.textSecondary, fontSize: 14 },
  playersRow: { maxHeight: 90, paddingLeft: spacing.lg },
  chipWrap: { marginRight: spacing.sm },
  cardArea: { flex: 1, paddingHorizontal: spacing.lg },
  missionWrap: { paddingHorizontal: spacing.lg },
  jokerSection: { gap: spacing.xs },
  nextButton: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  outcomeBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  outcomeLabel: { ...typography.bodyBold, color: colors.textPrimary },
  outcomeScroll: { maxHeight: 56 },
  outcomeChip: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neonRed,
  },
  outcomeChipText: { ...typography.caption, color: colors.textPrimary },
});
