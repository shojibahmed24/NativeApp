import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, TouchableOpacity, Image } from 'react-native';
import { Text, YStack, XStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Languages, Shield, Zap, CheckCircle2, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { TOKENS } from '../src/theme/tokens';
import { useThemeContext } from '../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to UNICOM',
    description: 'The world\'s most advanced AI-powered communication platform. Break language barriers instantly.',
    icon: (color) => <Languages color={color} size={80} strokeWidth={1.5} />,
    colors: ['#3b82f6', '#8b5cf6']
  },
  {
    id: '2',
    title: 'Live AI Translation',
    description: 'Speak in your native language. They hear it in theirs. Seamless, real-time voice translation powered by Gemini AI.',
    icon: (color) => <Zap color={color} size={80} strokeWidth={1.5} />,
    colors: ['#0ea5e9', '#10b981']
  },
  {
    id: '3',
    title: 'Military-Grade Security',
    description: 'Your conversations are yours alone. Protected by End-to-End Encryption and strictly peer-to-peer WebRTC connections.',
    icon: (color) => <Shield color={color} size={80} strokeWidth={1.5} />,
    colors: ['#f59e0b', '#ef4444']
  },
  {
    id: '4',
    title: 'Ready to Connect',
    description: 'Setup your profile, allow permissions for the best experience, and start calling the world.',
    icon: (color) => <CheckCircle2 color={color} size={80} strokeWidth={1.5} />,
    colors: ['#6366f1', '#ec4899']
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { isDark } = useThemeContext();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finish onboarding
      try {
        await AsyncStorage.setItem('has_seen_onboarding', 'true');
        router.replace('/(main)/messages');
      } catch (e) {
        console.error('Failed to save onboarding state:', e);
        router.replace('/(main)/messages');
      }
    }
  };

  const slide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={TOKENS.GRADIENTS.PRIMARY_DARK}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View key={slide.id} entering={SlideInRight.duration(400)} exiting={SlideOutLeft.duration(300)} style={styles.slideContent}>
          <View style={styles.iconShadowWrapper}>
            <View style={styles.iconContainer}>
              <LinearGradient colors={slide.colors} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.innerIconWrapper, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
                {slide.icon(slide.colors[0])}
              </View>
            </View>
          </View>

          <YStack alignItems="center" marginTop={40} paddingHorizontal={32}>
            <Text fontSize={32} fontWeight="900" textAlign="center" color="#ffffff">
              {slide.title}
            </Text>
            <Text fontSize={17} fontWeight="500" textAlign="center" color="rgba(255, 255, 255, 0.85)" marginTop={20} lineHeight={26}>
              {slide.description}
            </Text>
          </YStack>
        </Animated.View>

        <View style={styles.footer}>
          <XStack space={8} justifyContent="center" marginBottom={40}>
            {SLIDES.map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === currentIndex ? slide.colors[0] : 'rgba(255, 255, 255, 0.35)' },
                  i === currentIndex && { width: 24 }
                ]}
              />
            ))}
          </XStack>

          <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={styles.btnWrapper}>
            <LinearGradient colors={slide.colors} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.nextBtn}>
              <Text color="#ffffff" fontSize={18} fontWeight="800">
                {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              {currentIndex !== SLIDES.length - 1 && <ChevronRight color="#ffffff" size={20} style={{ marginLeft: 8 }} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#091733' },
  slideContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconShadowWrapper: { width: 160, height: 160, borderRadius: 80, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  iconContainer: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  innerIconWrapper: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center' },
  footer: { padding: 32, paddingBottom: Platform.OS === 'ios' ? 0 : 32 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  btnWrapper: { borderRadius: 100, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, width: '100%' }
});
