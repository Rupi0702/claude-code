import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GradientBackground } from '../components/GradientBackground';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useSettingsStore } from '../state/settingsStore';
import { useSetupStore } from '../state/setupStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Players'>;

const MIN_PLAYERS = 3;

export function PlayersScreen({ navigation }: Props) {
  const t = useSettingsStore((s) => s.t);
  const players = useSetupStore((s) => s.players);
  const addPlayer = useSetupStore((s) => s.addPlayer);
  const removePlayer = useSetupStore((s) => s.removePlayer);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const ok = addPlayer(name);
    if (!ok) {
      setError(t('players.duplicateName'));
      return;
    }
    setName('');
    setError(null);
  };

  const canContinue = players.length >= MIN_PLAYERS;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>{t('players.title')}</Text>
        <Text style={styles.subtitle}>{t('players.subtitle')}</Text>

        <View style={styles.inputRow}>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError(null);
            }}
            placeholder={t('players.placeholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            maxLength={20}
          />
          <Pressable onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}

        <FlatList
          data={players}
          keyExtractor={(p) => p.id}
          style={styles.flatList}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.playerRow}>
              <Text style={styles.playerName}>{item.name}</Text>
              <Pressable onPress={() => removePlayer(item.id)}>
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            </View>
          )}
        />

        {!canContinue && (
          <Text style={styles.hint}>
            {t('players.minPlayersHint', { number: MIN_PLAYERS - players.length })}
          </Text>
        )}

        <Button
          label={t('common.next')}
          disabled={!canContinue}
          onPress={() => navigation.navigate('Settings')}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.neonPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { ...typography.title, color: colors.bgBase },
  error: { ...typography.caption, color: colors.danger },
  flatList: { flex: 1 },
  list: { gap: spacing.sm, paddingVertical: spacing.sm },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  playerName: { ...typography.body, color: colors.textPrimary },
  remove: { ...typography.body, color: colors.textMuted },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
