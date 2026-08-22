import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GradientBackground } from '../components/GradientBackground';
import { Button } from '../components/Button';
import { IntensitySlider } from '../components/IntensitySlider';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useSettingsStore } from '../state/settingsStore';
import { useSetupStore } from '../state/setupStore';
import { useGameStore } from '../state/gameStore';
import { dictionaries } from '../i18n';
import type { SessionLength } from '../types/game';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SESSION_LENGTHS: SessionLength[] = ['quick', 'normal', 'party', 'endless'];

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const t = useSettingsStore((s) => s.t);
  const settings = useSettingsStore((s) => s.settings);
  const setAlcoholEnabled = useSettingsStore((s) => s.setAlcoholEnabled);
  const setIntensity = useSettingsStore((s) => s.setIntensity);
  const setProgressiveMode = useSettingsStore((s) => s.setProgressiveMode);
  const setSessionLength = useSettingsStore((s) => s.setSessionLength);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const startGame = useGameStore((s) => s.startGame);
  const setupMode = useSetupStore((s) => s.mode);
  const setupPlayers = useSetupStore((s) => s.players);
  const isPreGame = setupMode != null && setupPlayers.length > 0;

  const handleStart = () => {
    if (isPreGame && setupMode) {
      startGame(setupPlayers, { ...settings, mode: setupMode });
      navigation.navigate('Game');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Row label={t('settings.alcoholMode')} description={t('settings.alcoholModeDesc')}>
            <Switch
              value={settings.alcoholEnabled}
              onValueChange={setAlcoholEnabled}
              trackColor={{ true: colors.neonPink, false: colors.bgCardAlt }}
            />
          </Row>
          {!settings.alcoholEnabled && (
            <Text style={styles.noAlcoholNote}>{t('settings.noAlcoholModeDesc')}</Text>
          )}

          <View style={styles.block}>
            <Text style={styles.blockLabel}>{t('settings.intensity')}</Text>
            <IntensitySlider
              value={settings.intensity}
              onChange={setIntensity}
              labels={dictionaries[settings.language].settings.intensityLevels}
            />
          </View>

          <Row label={t('settings.progressiveMode')} description={t('settings.progressiveModeDesc')}>
            <Switch
              value={settings.progressiveMode}
              onValueChange={setProgressiveMode}
              trackColor={{ true: colors.neonPurple, false: colors.bgCardAlt }}
            />
          </Row>

          <View style={styles.block}>
            <Text style={styles.blockLabel}>{t('settings.sessionLength')}</Text>
            <View style={styles.pillRow}>
              {SESSION_LENGTHS.map((length) => (
                <Pressable
                  key={length}
                  onPress={() => setSessionLength(length)}
                  style={[styles.pill, settings.sessionLength === length && styles.pillActive]}
                >
                  <Text
                    style={[styles.pillText, settings.sessionLength === length && styles.pillTextActive]}
                  >
                    {t(`settings.sessionLengths.${length}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Row label={t('settings.sound')}>
            <Switch
              value={settings.soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ true: colors.neonBlue, false: colors.bgCardAlt }}
            />
          </Row>
          <Row label={t('settings.haptics')}>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ true: colors.neonBlue, false: colors.bgCardAlt }}
            />
          </Row>

          <View style={styles.block}>
            <Text style={styles.blockLabel}>{t('settings.language')}</Text>
            <View style={styles.pillRow}>
              {(['de', 'en'] as const).map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[styles.pill, settings.language === lang && styles.pillActive]}
                >
                  <Text style={[styles.pillText, settings.language === lang && styles.pillTextActive]}>
                    {lang.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <Button
          label={isPreGame ? t('common.start') : t('common.save')}
          onPress={isPreGame ? handleStart : () => navigation.goBack()}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  title: { ...typography.title, color: colors.textPrimary },
  scroll: { gap: spacing.lg, paddingBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowText: { flex: 1, paddingRight: spacing.md, gap: 2 },
  rowLabel: { ...typography.bodyBold, color: colors.textPrimary },
  rowDesc: { ...typography.caption, color: colors.textSecondary },
  noAlcoholNote: { ...typography.caption, color: colors.neonGreen, marginTop: -spacing.sm },
  block: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  blockLabel: { ...typography.bodyBold, color: colors.textPrimary },
  pillRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { borderColor: colors.neonPink, backgroundColor: 'rgba(255,63,164,0.15)' },
  pillText: { ...typography.caption, color: colors.textSecondary },
  pillTextActive: { color: colors.neonPink },
});
