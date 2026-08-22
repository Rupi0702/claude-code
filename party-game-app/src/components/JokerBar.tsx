import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { JokerType } from '../types/game';

const JOKER_ICON: Record<JokerType, string> = {
  skip: '⏭️',
  pass: '↪️',
  choose_target: '🎯',
  double_or_nothing: '✖️2',
  shield: '🛡️',
};

const JOKER_LABEL: Record<JokerType, string> = {
  skip: 'Ablehnen',
  pass: 'Weitergeben',
  choose_target: 'Ziel wählen',
  double_or_nothing: 'Verdoppeln',
  shield: 'Schutzschild',
};

interface Props {
  jokers: JokerType[];
  onUse: (joker: JokerType) => void;
  disabled?: boolean;
}

export function JokerBar({ jokers, onUse, disabled }: Props) {
  if (jokers.length === 0) return null;
  return (
    <View style={styles.row}>
      {jokers.map((joker) => (
        <Pressable
          key={joker}
          disabled={disabled}
          onPress={() => onUse(joker)}
          style={({ pressed }) => [styles.pill, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <Text style={styles.icon}>{JOKER_ICON[joker]}</Text>
          <Text style={styles.label}>{JOKER_LABEL[joker]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCardAlt,
    borderColor: colors.neonYellow,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.3 },
  icon: { fontSize: 14 },
  label: { ...typography.caption, color: colors.textPrimary },
});
