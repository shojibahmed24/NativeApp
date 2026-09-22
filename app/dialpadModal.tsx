// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Phone, Delete, AlertCircle, PhoneCall } from 'lucide-react-native';
import { GlassCard } from '../src/components/ThemeComponents';
import { useRouter } from 'expo-router';
import { useCall } from '../src/context/CallContext';
import { useThemeContext } from '../src/context/ThemeContext';
import { api } from '../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { TOKENS } from '../src/theme/tokens';
import Animated, { 
  FadeInDown, FadeInUp, ZoomIn, 
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence,
  runOnJS
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const useButtonScale = (activeScale = 0.92, hapticStyle = Haptics.ImpactFeedbackStyle.Light) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  const onPressIn = () => {
    scale.value = withSpring(activeScale, { damping: 15 });
    if (Platform.OS !== 'web') Haptics.impactAsync(hapticStyle);
  };
  
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return { animatedStyle, onPressIn, onPressOut };
};

const BlinkingCursor = ({ isDark }: { isDark: boolean }) => {
  const opacity = useSharedValue(1);
  useEffect(() => { opacity.value = withRepeat(withTiming(0, { duration: 500 }), -1, true); }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.cursor, style, { backgroundColor: isDark ? '#38bdf8' : '#005eb8' }]} />;
};

const AnimatedDigit = ({ char, index, isClearing, isDark }: { char: string, index: number, isClearing: boolean, isDark: boolean }) => {
  const scale = useSharedValue(1.2);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  }, []);

  useEffect(() => {
    if (isClearing) {
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 100 });
      }, index * 30);
    }
  }, [isClearing, index]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.digitText, style, { color: isDark ? '#fff' : '#0f172a', textShadowColor: isDark ? 'rgba(56,189,248,0.5)' : 'rgba(0,94,184,0.1)' }]}>
      {char}
    </Animated.Text>
  );
};

const PulsingPlus = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.3, { duration: 400 }), withTiming(1, { duration: 400 })), 3, false);
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.5, { duration: 400 })), 3, false);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return <Animated.Text style={[styles.plusHint, style]}>+</Animated.Text>;
};

const DialButton = ({ number, letters, onPress, onLongPress, index, isDark }: any) => {
  const { animatedStyle, onPressIn, onPressOut } = useButtonScale(0.93, Haptics.ImpactFeedbackStyle.Light);
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePressIn = () => { setIsPressed(true); onPressIn(); };
  const handlePressOut = () => { setIsPressed(false); onPressOut(); };

  return (
    <Animated.View entering={FadeInUp.delay(50 + index * 20).springify()}>
      <AnimatedPressable 
        onPressIn={handlePressIn} onPressOut={handlePressOut} 
        onPress={onPress} onLongPress={onLongPress}
        style={[styles.dialBtnWrapper, animatedStyle]}
      >
        <LinearGradient 
          colors={isPressed ? (isDark ? ['#1e3a5f', '#2563eb'] : ['#e0f2fe', '#bae6fd']) : (isDark ? ['rgba(30,41,59,0.8)', 'rgba(51,65,85,0.8)'] : ['#ffffff', '#f8fafc'])} 
          start={{x:0, y:0}} end={{x:1, y:1}}
          style={styles.dialBtnGradient} 
        />
        <Text style={[styles.dialNum, { color: isDark ? '#f8fafc' : '#0f172a' }, isPressed && { color: isDark ? '#38bdf8' : '#0369a1' }]}>{number}</Text>
        <Text style={[styles.dialLetters, { color: isDark ? '#94a3b8' : '#64748b' }, isPressed && { color: isDark ? '#60a5fa' : '#0284c7' }]}>{letters}</Text>
        {number === '0' && <PulsingPlus />}
      </AnimatedPressable>
    </Animated.View>
  );
};

export default function DialpadModal() {
  const router = useRouter();
  const { startVoiceCall } = useCall();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  
  const shakeOffset = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeOffset.value }] }));

  const shakeError = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeOffset.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleLongPress = (num: string) => {
    if (num === '0') {
      setError('');
      setPhoneNumber(prev => prev + '+');
    }
  };

  const handlePress = (num: string) => {
    setError('');
    setPhoneNumber(prev => prev + num);
  };

  const handleDelete = () => {
    setError('');
    setPhoneNumber(prev => prev.slice(0, -1));
  };
  
  const handleClearAll = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');
    setIsClearing(true);
    setTimeout(() => {
      setPhoneNumber('');
      setIsClearing(false);
    }, phoneNumber.length * 30 + 100);
  };

  const handleCall = async () => {
    if (!phoneNumber) return;
    setIsCalling(true);
    setError('');
    
    try {
      let normalized = phoneNumber;
      if (!normalized.startsWith('+')) {
        if (normalized.startsWith('01')) normalized = '+88' + normalized;
        else if (normalized.startsWith('880')) normalized = '+' + normalized;
        else normalized = '+' + normalized;
      }

      const res = await api.syncContacts([normalized]);
      if (res.contacts && res.contacts.length > 0) {
        const peer = res.contacts[0];
        const callRes = await startVoiceCall(peer);
        router.replace(`/call/${callRes.call.id}`);
      } else {
        setError('User not found with this number');
        shakeError();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate call');
      shakeError();
    } finally {
      setIsCalling(false);
    }
  };

  const cancelScale = useButtonScale(0.92, Haptics.ImpactFeedbackStyle.Light);
  const delScale = useButtonScale(0.9, Haptics.ImpactFeedbackStyle.Light);
  const callScale = useButtonScale(0.92, Haptics.ImpactFeedbackStyle.Medium);
  
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  useEffect(() => {
    if (phoneNumber.length > 0) {
      glowScale.value = withRepeat(withTiming(1.3, { duration: 1500 }), -1, false);
      glowOpacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, false);
    } else {
      glowScale.value = 1;
      glowOpacity.value = 0;
    }
  }, [phoneNumber]);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? TOKENS.GRADIENTS.PRIMARY_DARK : ['#e0f2fe', '#dbeafe', '#f0f9ff']} locations={[0, 0.4, 0.7]} style={StyleSheet.absoluteFill} />
      
      {/* Background glow blobs (ambient color circles instead of unsupported filter:blur) */}
      <View style={styles.glowBlob1} />
      <View style={styles.glowBlob2} />

      <View style={{ flex: 1, paddingTop: Math.max(insets.top, 20) }}>
        
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AnimatedPressable 
            onPressIn={cancelScale.onPressIn} onPressOut={cancelScale.onPressOut}
            onPress={() => { if(router.canGoBack()) router.back(); else router.push('/(main)/calls'); }}
            style={[styles.cancelBtn, cancelScale.animatedStyle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,94,184,0.1)' }]}
          >
            <Text style={[styles.cancelText, { color: isDark ? '#fff' : '#005eb8' }]}>Cancel</Text>
          </AnimatedPressable>
          
          <XStack alignItems="center" space="$2">
            <PhoneCall color="#fff" size={18} opacity={0.9} />
            <Text style={styles.headerTitle}>Dialpad</Text>
          </XStack>
          <View style={{ width: 70 }} />
        </Animated.View>

        {/* Number Display Area */}
        <Animated.View style={shakeStyle}>
          <YStack alignItems="center" justifyContent="flex-end" minHeight={110} paddingHorizontal="$4" marginBottom="$6">
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.numberScrollContainer}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {phoneNumber ? (
                phoneNumber.split('').map((char, idx) => <AnimatedDigit key={`${idx}-${char}`} char={char} index={idx} isClearing={isClearing} isDark={isDark} />)
              ) : (
                <Text style={[styles.placeholderText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.3)' }]}>Enter number</Text>
              )}
              {phoneNumber.length > 0 && <BlinkingCursor isDark={isDark} />}
            </ScrollView>
            
            <View style={{ minHeight: 24, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}>
              {error ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <XStack alignItems="center" space="$1.5">
                    <AlertCircle color={TOKENS.COLORS.DANGER} size={14} />
                    <Text color={TOKENS.COLORS.DANGER} fontWeight="600" fontSize={13}>{error}</Text>
                  </XStack>
                </Animated.View>
              ) : null}
            </View>
          </YStack>
        </Animated.View>

        {/* Dialpad Grid */}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <GlassCard style={styles.glassCard} padding="$6">
          <View style={[styles.glassTopHighlight, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
          
          <YStack flex={1} justifyContent="space-between">
            <XStack justifyContent="space-around">
              <DialButton number="1" letters="" onPress={() => handlePress('1')} index={0} isDark={isDark} />
              <DialButton number="2" letters="ABC" onPress={() => handlePress('2')} index={1} isDark={isDark} />
              <DialButton number="3" letters="DEF" onPress={() => handlePress('3')} index={2} isDark={isDark} />
            </XStack>
            <XStack justifyContent="space-around">
              <DialButton number="4" letters="GHI" onPress={() => handlePress('4')} index={3} isDark={isDark} />
              <DialButton number="5" letters="JKL" onPress={() => handlePress('5')} index={4} isDark={isDark} />
              <DialButton number="6" letters="MNO" onPress={() => handlePress('6')} index={5} isDark={isDark} />
            </XStack>
            <XStack justifyContent="space-around">
              <DialButton number="7" letters="PQRS" onPress={() => handlePress('7')} index={6} isDark={isDark} />
              <DialButton number="8" letters="TUV" onPress={() => handlePress('8')} index={7} isDark={isDark} />
              <DialButton number="9" letters="WXYZ" onPress={() => handlePress('9')} index={8} isDark={isDark} />
            </XStack>
            <XStack justifyContent="space-around">
              <DialButton number="*" letters="" onPress={() => handlePress('*')} index={9} isDark={isDark} />
              <DialButton number="0" letters="+" onPress={() => handlePress('0')} onLongPress={() => handleLongPress('0')} index={10} isDark={isDark} />
              <DialButton number="#" letters="" onPress={() => handlePress('#')} index={11} isDark={isDark} />
            </XStack>
            
            {/* Bottom Actions */}
            <Animated.View entering={FadeInUp.delay(300)}>
              <XStack justifyContent="space-around" alignItems="center" marginTop="$2">
                <View style={{ width: 75 }} />
                
                {/* Call Button */}
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {phoneNumber.length > 0 && <Animated.View style={[styles.callBtnGlow, glowStyle]} />}
                  <AnimatedPressable
                    onPressIn={callScale.onPressIn} onPressOut={callScale.onPressOut} onPress={handleCall}
                    disabled={isCalling || !phoneNumber}
                    style={[styles.callBtnWrapper, callScale.animatedStyle]}
                  >
                    <LinearGradient 
                      colors={!phoneNumber ? ['rgba(148,163,184,0.6)', 'rgba(100,116,139,0.6)'] : ['#005eb8', '#22c55e']} 
                      start={{x:0, y:0}} end={{x:1, y:1}}
                      style={StyleSheet.absoluteFill} 
                    />
                    <View style={{ zIndex: 1 }}>
                      {isCalling ? (
                        <ActivityIndicator color="#fff" size="large" />
                      ) : (
                        <Phone color="white" size={34} fill={phoneNumber ? "white" : "transparent"} />
                      )}
                    </View>
                  </AnimatedPressable>
                </View>
                
                {/* Delete Button */}
                <View style={{ width: 75, alignItems: 'center' }}>
                  {phoneNumber.length > 0 && (
                    <AnimatedPressable
                      onPressIn={delScale.onPressIn} onPressOut={delScale.onPressOut} 
                      onPress={handleDelete} onLongPress={handleClearAll}
                      style={[styles.deleteBtn, delScale.animatedStyle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }]}
                    >
                      <Delete color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={26} />
                    </AnimatedPressable>
                  )}
                </View>
              </XStack>
            </Animated.View>
          </YStack>
        </GlassCard>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glowBlob1: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#38bdf8', opacity: 0.15 },
  glowBlob2: { position: 'absolute', top: 50, right: -100, width: 250, height: 250, borderRadius: 125, backgroundColor: '#818cf8', opacity: 0.1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: TOKENS.RADIUS.LG, backgroundColor: 'rgba(255,255,255,0.15)' },
  cancelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  numberScrollContainer: { alignItems: 'center', justifyContent: 'center', minWidth: '100%', paddingHorizontal: 20 },
  digitText: { fontSize: 48, fontWeight: '700', color: '#fff', marginHorizontal: 1 },
  placeholderText: { fontSize: 36, fontWeight: '400', color: 'rgba(255,255,255,0.4)' },
  cursor: { width: 3, height: 44, backgroundColor: '#38bdf8', borderRadius: 2, marginLeft: 4 },
  glassCard: { flex: 1, borderTopLeftRadius: 36, borderTopRightRadius: 36, ...TOKENS.SHADOWS.ELEVATED, overflow: 'hidden', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  glassTopHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 1 },
  dialBtnWrapper: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...TOKENS.SHADOWS.ELEVATED },
  dialBtnGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 38 },
  dialNum: { color: '#0f172a', fontSize: 38, fontWeight: '500', lineHeight: 42, zIndex: 1 },
  dialLetters: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, zIndex: 1 },
  plusHint: { position: 'absolute', bottom: 12, color: '#64748b', fontSize: 14, fontWeight: '800', zIndex: 1 },
  callBtnWrapper: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: Platform.OS === 'web' ? 8 : 0 },
  callBtnGlow: { position: 'absolute', width: 76, height: 76, borderRadius: 38, backgroundColor: '#22c55e' },
  deleteBtn: { width: 56, height: 56, borderRadius: TOKENS.RADIUS.XL, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
});
