import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, intensityColors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { GamePhase } from '../types/game';

const PHASE_LABEL: Record<GamePhase, string> = {
  warmup: 'Warm-up',
  interaction: 'Interaktion',
  chaos: 'Chaos',
  peak: 'Peak',
  finale: 'Finale',
};

interface Props {
  round: number;
  phase: GamePhase;
  progress: number; // 0..1
  intensity: number;
  activeModifier?: string;
}

export function ProgressHeader({ round, phase, progress, intensity, activeModifier }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.roundText}>Runde {round}</Text>
        <View style={[styles.phasePill, { borderColor: intensityColors[intensity] ?? colors.neonPurple }]}>
          <Text style={styles.phaseText}>{PHASE_LABEL[phase]}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(4, progress * 100))}%` }]} />
      </View>
      {activeModifier ? (
        <View style={styles.modifierPill}>
          <Text style={styles.modifierText}>{activeModifier}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundText: { ...typography.subtitle, color: colors.textPrimary },
  phasePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  phaseText: { ...typography.caption, color: colors.textPrimary },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCardAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.neonPink,
    borderRadius: radius.pill,
  },
  modifierPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 210, 63, 0.15)',
    borderColor: colors.neonYellow,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  modifierText: { ...typography.caption, color: colors.neonYellow },
});
