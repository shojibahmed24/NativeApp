import React from 'react';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { YStack, YStackProps } from 'tamagui';

export const GradientBackground = ({ children, ...props }: { children: React.ReactNode } & YStackProps) => {
  const colorScheme = useColorScheme();
  return (
    <YStack flex={1} {...props}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#0f172a', '#1e293b', '#0f172a'] : ['#A8E0FF', '#DDF2FF', '#A8E0FF']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </YStack>
  );
};

export const GlassCard = ({ children, ...props }: { children: React.ReactNode } & YStackProps) => {
  const colorScheme = useColorScheme();
  return (
    <YStack
      backgroundColor={colorScheme === 'dark' ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.6)"}
      borderRadius="$6"
      padding="$4"
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.1}
      shadowRadius={10}
      {...props}
    >
      {children}
    </YStack>
  );
};
