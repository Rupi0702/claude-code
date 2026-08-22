import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GradientBackground } from '../components/GradientBackground';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useSettingsStore } from '../state/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const t = useSettingsStore((s) => s.t);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.logo}>
            <Text style={styles.logoEmoji}>🎉</Text>
          </LinearGradient>
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.tagline}>{t('home.tagline')}</Text>
        </View>

        <View style={styles.actions}>
          <Button label={t('home.play')} onPress={() => navigation.navigate('ModeSelect')} />
          <Button
            label={t('home.settings')}
            variant="secondary"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing.xxl },
  hero: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.md, paddingHorizontal: spacing.lg },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoEmoji: { fontSize: 44 },
  title: { ...typography.display, color: colors.textPrimary },
  tagline: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  actions: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
