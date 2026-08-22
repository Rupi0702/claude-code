import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GradientBackground } from '../components/GradientBackground';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useSettingsStore } from '../state/settingsStore';
import { useGameStore } from '../state/gameStore';
import { useSetupStore } from '../state/setupStore';

type Props = NativeStackScreenProps<RootStackParamList, 'End'>;

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function EndScreen({ navigation }: Props) {
  const t = useSettingsStore((s) => s.t);
  const summary = useGameStore((s) => s.summary);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.reset);
  const setupMode = useSetupStore((s) => s.mode);
  const setupPlayers = useSetupStore((s) => s.players);
  const settings = useSettingsStore((s) => s.settings);

  if (!summary) {
    navigation.replace('Home');
    return null;
  }

  const minutes = Math.max(1, Math.round(summary.durationMs / 60000));

  const handlePlayAgain = () => {
    if (setupMode) {
      startGame(setupPlayers, { ...settings, mode: setupMode });
      navigation.replace('Game');
    } else {
      navigation.replace('ModeSelect');
    }
  };

  const handleBackHome = () => {
    resetGame();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>{t('end.title')}</Text>
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {summary.mvp && <StatCard emoji="🏆" label={t('end.mvp')} value={summary.mvp.name} />}
          {summary.chaosKing && (
            <StatCard emoji="🌀" label={t('end.chaosKing')} value={summary.chaosKing.name} />
          )}
          {summary.mostTargeted && (
            <StatCard emoji="🎯" label={t('end.mostTargeted')} value={summary.mostTargeted.name} />
          )}
          {summary.bestDuo && (
            <StatCard
              emoji="👯"
              label={t('end.bestDuo')}
              value={`${summary.bestDuo[0].name} & ${summary.bestDuo[1].name}`}
            />
          )}
          {summary.biggestRivalry && (
            <StatCard
              emoji="⚔️"
              label={t('end.biggestRivalry')}
              value={`${summary.biggestRivalry.players[0].name} vs. ${summary.biggestRivalry.players[1].name}`}
            />
          )}
          <StatCard emoji="🎲" label={t('end.totalChallenges')} value={String(summary.totalChallenges)} />
          <StatCard emoji="⏱️" label={t('end.duration')} value={`${minutes} Min`} />
        </ScrollView>

        <View style={styles.actions}>
          <Button label={t('end.playAgain')} onPress={handlePlayAgain} />
          <Button label={t('end.backHome')} variant="secondary" onPress={handleBackHome} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  title: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingVertical: spacing.lg },
  statCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statEmoji: { fontSize: 28 },
  statLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  statValue: { ...typography.bodyBold, color: colors.textPrimary, textAlign: 'center' },
  actions: { gap: spacing.sm, paddingBottom: spacing.md },
});
