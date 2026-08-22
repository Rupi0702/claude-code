import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GradientBackground } from '../components/GradientBackground';
import { EventOverlay } from '../components/EventOverlay';
import { colors, modeColors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useSettingsStore } from '../state/settingsStore';
import { useSetupStore } from '../state/setupStore';
import { MODE_DEFINITIONS } from '../content/packs';
import type { GameMode } from '../types/content';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeSelect'>;

const MODE_EMOJI: Record<GameMode, string> = {
  classic: '🎲',
  icebreaker: '🧊',
  bestfriends: '👯',
  couples: '💘',
  wild: '🔥',
  chaos: '🌀',
};

export function ModeSelectScreen({ navigation }: Props) {
  const t = useSettingsStore((s) => s.t);
  const setMode = useSetupStore((s) => s.setMode);
  const [pendingWildMode, setPendingWildMode] = useState<GameMode | null>(null);

  const chooseMode = (mode: GameMode) => {
    if (mode === 'wild') {
      setPendingWildMode(mode);
      return;
    }
    setMode(mode);
    navigation.navigate('Players');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.header}>{t('modes.chooseTitle')}</Text>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {MODE_DEFINITIONS.map((def) => (
            <Pressable
              key={def.id}
              onPress={() => chooseMode(def.id)}
              style={({ pressed }) => [
                styles.card,
                { borderColor: modeColors[def.id] },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emoji}>{MODE_EMOJI[def.id]}</Text>
              <View style={styles.textCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.modeTitle}>{t(`modes.${def.id}`)}</Text>
                  {def.premium && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t('modes.premiumBadge')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modeDesc}>{t(`modes.${def.id}Desc`)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
      <EventOverlay
        visible={pendingWildMode !== null}
        title={t('modes.wildWarningTitle')}
        description={t('modes.wildWarningBody')}
        dismissLabel={t('common.confirm')}
        onDismiss={() => {
          if (pendingWildMode) {
            setMode(pendingWildMode);
            setPendingWildMode(null);
            navigation.navigate('Players');
          }
        }}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: spacing.xl },
  header: {
    ...typography.title,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  emoji: { fontSize: 36 },
  textCol: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modeTitle: { ...typography.subtitle, color: colors.textPrimary },
  modeDesc: { ...typography.caption, color: colors.textSecondary },
  badge: {
    backgroundColor: 'rgba(255, 210, 63, 0.15)',
    borderColor: colors.neonYellow,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { ...typography.caption, color: colors.neonYellow, fontSize: 11 },
});
