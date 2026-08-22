import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { TemporaryRule } from '../types/game';

interface Props {
  rules: TemporaryRule[];
}

export function ActiveRulesBar({ rules }: Props) {
  if (rules.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.container}
    >
      {rules.map((rule) => (
        <View key={rule.id} style={styles.pill}>
          <Text style={styles.text} numberOfLines={2}>
            {rule.description}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 60 },
  row: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  pill: {
    maxWidth: 220,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: colors.neonPurple,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  text: { ...typography.caption, color: colors.textPrimary },
});
