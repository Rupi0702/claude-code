import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from './Button';

interface Props {
  visible: boolean;
  title: string;
  description: string;
  onDismiss: () => void;
  dismissLabel: string;
}

export function EventOverlay({ visible, title, description, onDismiss, dismissLabel }: Props) {
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.7);
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    }
  }, [visible, scale]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.scrim}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient colors={colors.gradientChaos} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.desc}>{description}</Text>
            <Button label={dismissLabel} onPress={onDismiss} variant="secondary" style={styles.button} />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 340,
  },
  title: { ...typography.display, color: colors.bgBase, textAlign: 'center', marginBottom: spacing.sm },
  desc: {
    ...typography.body,
    color: colors.bgBase,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  button: { backgroundColor: 'rgba(11, 6, 32, 0.85)' },
});
