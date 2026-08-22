import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface Props extends ViewProps {
  variant?: 'base' | 'card';
}

export function GradientBackground({ style, children, variant = 'base', ...rest }: Props) {
  if (variant === 'card') {
    return (
      <LinearGradient
        colors={colors.gradientCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fill, style]}
        {...rest}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.base, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: colors.bgBase },
  fill: { flex: 1 },
});
