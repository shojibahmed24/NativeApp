// @ts-nocheck
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { YStack, YStackProps } from 'tamagui';
import { useThemeContext } from '../context/ThemeContext';
import { TOKENS } from '../theme/tokens';
import Animated, { 
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// ── Animated Aurora Blob ──
const AuroraBlob = ({ 
  color, fadeColor, size, posTop, posLeft, posRight, posBottom, 
  opacity, duration, delayMs, direction 
}: {
  color: string; fadeColor: string; size: number;
  posTop?: number; posLeft?: number; posRight?: number; posBottom?: number;
  opacity: number; duration: number; delayMs: number;
  direction: { x: number; y: number; endX: number; endY: number };
}) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const blobOpacity = useSharedValue(opacity * 0.7);

  useEffect(() => {
    // Floating Y movement
    translateY.value = withRepeat(
      withSequence(
        withTiming(20, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: duration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    );
    // Floating X movement
    translateX.value = withRepeat(
      withSequence(
        withTiming(15, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    );
    // Breathing scale
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    );
    // Breathing opacity
    blobOpacity.value = withRepeat(
      withSequence(
        withTiming(opacity, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) }),
        withTiming(opacity * 0.5, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: blobOpacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      width: size,
      height: size,
      top: posTop,
      left: posLeft,
      right: posRight,
      bottom: posBottom,
    }, animatedStyle]}>
      <LinearGradient
        colors={[color, fadeColor]}
        start={{ x: direction.x, y: direction.y }}
        end={{ x: direction.endX, y: direction.endY }}
        style={{ flex: 1, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
};

export const GradientBackground = ({ children, style, ...props }: { children: React.ReactNode } & YStackProps) => {
  const { isDark } = useThemeContext();

  // Light mode: soft warm gradient base instead of plain white
  // Dark mode: deep navy
  const baseColor = isDark ? '#020617' : '#f8fafc';
  
  return (
    <YStack 
      flex={1} 
      backgroundColor={baseColor}
      style={style}
      {...props}
    >
      {/* Subtle base gradient for light mode warmth */}
      {!isDark && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={['#f0f4ff', '#faf5ff', '#f0fdfa', '#fff7ed']}
            locations={[0, 0.35, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      
      {children}
    </YStack>
  );
};

export const GlassCard = ({ children, style, ...props }: { children: React.ReactNode } & YStackProps) => {
  const { isDark } = useThemeContext();
  return (
    <YStack
      backgroundColor={isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.65)"}
      borderRadius={TOKENS.RADIUS.LG}
      padding="$4"
      borderWidth={1}
      borderColor={isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)"}
      elevation={2}
      style={[
        Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any) : { backgroundColor: isDark ? 'rgba(30,41,59,0.65)' : 'rgba(255,255,255,0.7)' },
        style
      ]}
      {...props}
    >
      {/* Top shimmer line */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, borderTopLeftRadius: TOKENS.RADIUS.LG, borderTopRightRadius: TOKENS.RADIUS.LG, overflow: 'hidden' }}>
        <LinearGradient
          colors={['rgba(99,102,241,0)', 'rgba(99,102,241,0.3)', 'rgba(14,165,233,0.3)', 'rgba(14,165,233,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </View>
      {children}
    </YStack>
  );
};
