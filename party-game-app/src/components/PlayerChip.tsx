import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  name: string;
  highlighted?: boolean;
  crownLabel?: string;
  shielded?: boolean;
  size?: 'sm' | 'md';
}

export function PlayerChip({ name, highlighted, crownLabel, shielded, size = 'md' }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.chip, size === 'sm' && styles.chipSm, highlighted && styles.highlighted]}>
      <View style={[styles.avatar, size === 'sm' && styles.avatarSm]}>
        <Text style={styles.avatarText}>{initial}</Text>
        {shielded && <Text style={styles.badge}>🛡️</Text>}
      </View>
      <Text numberOfLines={1} style={[styles.name, size === 'sm' && styles.nameSm]}>
        {name}
      </Text>
      {crownLabel ? <Text style={styles.crown}>👑 {crownLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    width: 76,
  },
  chipSm: {
    width: 60,
    paddingVertical: spacing.xs,
  },
  highlighted: {
    borderColor: colors.neonPink,
    shadowColor: colors.neonPink,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarSm: { width: 30, height: 30 },
  avatarText: { ...typography.bodyBold, color: colors.textPrimary },
  badge: { position: 'absolute', right: -6, top: -6, fontSize: 12 },
  name: { ...typography.caption, color: colors.textPrimary, textAlign: 'center' },
  nameSm: { fontSize: 11 },
  crown: { ...typography.caption, color: colors.neonYellow, marginTop: 2 },
});
