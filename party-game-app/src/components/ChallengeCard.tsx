import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { CHALLENGE_TYPE_LABELS } from '../types/game';
import type { ChallengeType } from '../types/content';

interface Props {
  text: string;
  type: ChallengeType;
  cardKey: string | number;
}

export function ChallengeCard({ text, type, cardKey }: Props) {
  const flip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flip.setValue(0);
    Animated.spring(flip, {
      toValue: 1,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
    // Re-run the reveal animation whenever a new challenge is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey]);

  const scale = flip.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const opacity = flip;
  const translateY = flip.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ scale }, { translateY }] }]}>
      <LinearGradient colors={colors.gradientCard} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{CHALLENGE_TYPE_LABELS[type]}</Text>
        </View>
        <Text style={styles.text}>{text}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'center' },
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 280,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: colors.neonPurple,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
  },
  typeText: { ...typography.caption, color: colors.neonPurple },
  text: { ...typography.cardText, color: colors.textPrimary },
});
