import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, intensityColors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
  labels: string[];
}

const LEVELS = [1, 2, 3, 4, 5] as const;

export function IntensitySlider({ value, onChange, labels }: Props) {
  return (
    <View>
      <View style={styles.row}>
        {LEVELS.map((level) => {
          const active = level <= value;
          return (
            <Pressable
              key={level}
              onPress={() => onChange(level)}
              style={[
                styles.segment,
                { backgroundColor: active ? intensityColors[level] : colors.bgCardAlt },
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.label}>{labels[value - 1]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  segment: {
    flex: 1,
    height: 14,
    borderRadius: radius.pill,
  },
  label: { ...typography.bodyBold, color: colors.textPrimary, marginTop: spacing.sm },
});
