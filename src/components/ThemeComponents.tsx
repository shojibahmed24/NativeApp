import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { YStack, YStackProps } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';
import { TOKENS } from '../theme/tokens';

export const GradientBackground = ({ children, style, ...props }: { children: React.ReactNode } & YStackProps) => {
  const { isDark } = useThemeContext();
  return (
    <YStack 
      flex={1} 
      backgroundColor={isDark ? '#0f172a' : '#f0f4ff'}
      style={style}
      {...props}
    >
      <LinearGradient
        colors={isDark ? TOKENS.GRADIENTS.DARK_BG : TOKENS.GRADIENTS.LIGHT_BG}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {children}
    </YStack>
  );
};

export const GlassCard = ({ children, style, ...props }: { children: React.ReactNode } & YStackProps) => {
  const { isDark } = useThemeContext();
  return (
    <YStack
      backgroundColor={isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.75)"}
      borderRadius={TOKENS.RADIUS.LG}
      padding="$4"
      borderWidth={1}
      borderColor={isDark ? "rgba(255, 255, 255, 0.15)" : "#e2e8f0"}
      elevation={2}
      style={[
        Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any) : { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
        style
      ]}
      {...props}
    >
      {children}
    </YStack>
  );
};
