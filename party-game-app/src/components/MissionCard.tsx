import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useSettingsStore } from '../state/settingsStore';

interface Props {
  playerName: string;
  description: string;
  onDismiss: () => void;
}

/**
 * Secret missions run on a single shared device: the mission is hidden by
 * default and only shown while the intended player is actively pressing, so
 * nobody else at the table can casually see it in passing.
 */
export function MissionCard({ playerName, description, onDismiss }: Props) {
  const [revealed, setRevealed] = useState(false);
  const t = useSettingsStore((s) => s.t);

  return (
    <View style={styles.container}>
      <Text style={styles.playerName}>{playerName}</Text>
      <Pressable
        onPressIn={() => setRevealed(true)}
        onPressOut={() => setRevealed(false)}
        style={styles.revealArea}
      >
        {revealed ? (
          <Text style={styles.missionText}>{description}</Text>
        ) : (
          <Text style={styles.hint}>🤫 {t('game.tapToReveal')}</Text>
        )}
      </Pressable>
      <Pressable onPress={onDismiss}>
        <Text style={styles.dismiss}>OK, verstanden</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neonBlue,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  playerName: { ...typography.subtitle, color: colors.neonBlue },
  revealArea: {
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  missionText: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },
  hint: { ...typography.body, color: colors.textMuted },
  dismiss: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'underline' },
});
