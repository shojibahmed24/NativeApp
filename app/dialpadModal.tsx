import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator, StatusBar } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Phone, Delete, AlertCircle, PhoneCall } from 'lucide-react-native';
import { GlassCard } from '../src/components/ThemeComponents';
import { useRouter } from 'expo-router';
import { useCall } from '../src/context/CallContext';
import { api } from '../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, FadeInUp, ZoomIn, 
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence,
  runOnJS
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOKENS } from '../src/theme/tokens';
import { useThemeContext } from '../src/context/ThemeContext';


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

const BlinkingCursor = () => {
  const opacity = useSharedValue(1);
  useEffect(() => { opacity.value = withRepeat(withTiming(0, { duration: 500 }), -1, true); }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.cursor, style]} />;
};

const AnimatedDigit = ({ char, index, isClearing }: { char: string, index: number, isClearing: boolean }) => {
  const { isDark } = useThemeContext();
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
    <Animated.Text style={[styles.digitText, style, { color: isDark ? '#fff' : '#0f172a' }]}>
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

const DialButton = ({ number, letters, onPress, onLongPress, index }: any) => {
  const { isDark } = useThemeContext();
  const { animatedStyle, onPressIn, onPressOut } = useButtonScale(0.93, Haptics.ImpactFeedbackStyle.Light);
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePressIn = () => { setIsPressed(true); onPressIn(); };
  const handlePressOut = () => { setIsPressed(false); onPressOut(); };

  // Glass styles
  const btnBg = isPressed ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#1e293b' : '#f1f5f9');
    
  const numColor = isDark ? '#ffffff' : '#0f172a';
  const letterColor = isDark ? '#94a3b8' : '#64748b';
  const pressedColor = isDark ? '#38bdf8' : '#0ea5e9';

  return (
    <Animated.View entering={FadeInUp.delay(50 + index * 20).springify()}>
      <AnimatedPressable 
        onPressIn={handlePressIn} onPressOut={handlePressOut} 
        onPress={onPress} onLongPress={onLongPress}
        style={[
          styles.dialBtnWrapper, 
          animatedStyle, 
          { 
            backgroundColor: btnBg, 
            borderWidth: 0,
            shadowOpacity: 0, 
            elevation: 0 
          }
        ]}
      >
        <Text style={[styles.dialNum, { color: isPressed ? pressedColor : numColor }]}>{number}</Text>
        <Text style={[styles.dialLetters, { color: isPressed ? pressedColor : letterColor }]}>{letters}</Text>
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
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    setPhoneNumber(prev => prev + num);
  };

  const handleDelete = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        if (normalized.startsWith('01') && normalized.length === 11) normalized = '+880' + normalized.slice(1);
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
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      

      <View style={{ flex: 1, paddingTop: Math.max(insets.top, 20) }}>
        
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AnimatedPressable 
            onPressIn={cancelScale.onPressIn} onPressOut={cancelScale.onPressOut}
            onPress={() => { if(router.canGoBack()) router.back(); else router.push('/(main)/calls'); }}
            style={[styles.cancelBtn, cancelScale.animatedStyle, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
          >
            <Text style={[styles.cancelText, { color: isDark ? '#fff' : '#0f172a' }]}>Cancel</Text>
          </AnimatedPressable>
          
          <XStack alignItems="center" space="$2">
            <PhoneCall color={isDark ? "#fff" : "#0f172a"} size={18} opacity={0.9} />
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Dialpad</Text>
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
                phoneNumber.split('').map((char, idx) => <AnimatedDigit key={`${idx}-${char}`} char={char} index={idx} isClearing={isClearing} />)
              ) : (
                <Text style={[styles.placeholderText, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]}>Enter number</Text>
              )}
              {phoneNumber.length > 0 && <BlinkingCursor />}
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
        <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
          <YStack flex={1} justifyContent="space-evenly" paddingBottom="$4">
            <XStack justifyContent="space-around">
              <DialButton number="1" letters="" onPress={() => handlePress('1')} index={0} />
              <DialButton number="2" letters="ABC" onPress={() => handlePress('2')} index={1} />
              <DialButton number="3" letters="DEF" onPress={() => handlePress('3')} index={2} />
            </XStack>
            <XStack justifyContent="space-around">
              <DialButton number="4" letters="GHI" onPress={() => handlePress('4')} index={3} />
              <DialButton number="5" letters="JKL" onPress={() => handlePress('5')} index={4} />
              <DialButton number="6" letters="MNO" onPress={() => handlePress('6')} index={5} />
            </XStack>
            <XStack justifyContent="space-around">
              <DialButton number="7" letters="PQRS" onPress={() => handlePress('7')} index={6} />
              <DialButton number="8" letters="TUV" onPress={() => handlePress('8')} index={7} />
              <DialButton number="9" letters="WXYZ" onPress={() => handlePress('9')} index={8} />
            </XStack>
            <XStack justifyContent="space-around">
              <DialButton number="*" letters="" onPress={() => handlePress('*')} index={9} />
              <DialButton number="0" letters="+" onPress={() => handlePress('0')} onLongPress={() => handleLongPress('0')} index={10} />
              <DialButton number="#" letters="" onPress={() => handlePress('#')} index={11} />
            </XStack>
            
            {/* Bottom Actions */}
            <Animated.View entering={FadeInUp.delay(300)}>
              <XStack justifyContent="space-around" alignItems="center" marginTop="$4" paddingHorizontal="$6">
                <View style={{ width: 80 }} />
                
                {/* Call Button */}
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {phoneNumber.length > 0 && <Animated.View style={[styles.callBtnGlow, glowStyle, { backgroundColor: '#10b981' }]} />}
                  <AnimatedPressable
                    onPressIn={callScale.onPressIn} onPressOut={callScale.onPressOut} onPress={handleCall}
                    disabled={isCalling || !phoneNumber}
                    style={[
                      styles.callBtnWrapper, 
                      callScale.animatedStyle, 
                      { 
                        shadowColor: '#10b981',
                        elevation: phoneNumber ? 8 : 0,
                        shadowOpacity: phoneNumber ? 0.35 : 0,
                      }
                    ]}
                  >
                    <LinearGradient 
                      colors={!phoneNumber ? (isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.05)']) : ['#10b981', '#059669']} 
                      start={{x:0, y:0}} end={{x:1, y:1}}
                      style={StyleSheet.absoluteFillObject} 
                    />
                    <View style={{ zIndex: 1 }}>
                      {isCalling ? (
                        <ActivityIndicator color="#fff" size="large" />
                      ) : (
                        <Phone color={!phoneNumber ? (isDark ? '#94a3b8' : '#64748b') : "white"} size={34} fill={phoneNumber ? "white" : "transparent"} />
                      )}
                    </View>
                  </AnimatedPressable>
                </View>
                
                {/* Delete Button */}
                <View style={{ width: 80, alignItems: 'center' }}>
                  {phoneNumber.length > 0 && (
                    <AnimatedPressable
                      onPressIn={delScale.onPressIn} onPressOut={delScale.onPressOut} 
                      onPress={handleDelete} onLongPress={handleClearAll}
                      style={[
                        styles.deleteBtn, 
                        delScale.animatedStyle, 
                        { 
                          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'
                        }
                      ]}
                    >
                      <Delete color={isDark ? '#ffffff' : '#0f172a'} size={26} />
                    </AnimatedPressable>
                  )}
                </View>
              </XStack>
            </Animated.View>
          </YStack>
        </View>
        
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
  dialBtnWrapper: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dialBtnGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 38 },
  dialNum: { color: '#0f172a', fontSize: 38, fontWeight: '500', lineHeight: 42, zIndex: 1 },
  dialLetters: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, zIndex: 1 },
  plusHint: { position: 'absolute', bottom: 12, color: '#64748b', fontSize: 14, fontWeight: '800', zIndex: 1 },
  callBtnWrapper: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  callBtnGlow: { position: 'absolute', width: 76, height: 76, borderRadius: 38, backgroundColor: '#22c55e' },
  deleteBtn: { width: 56, height: 56, borderRadius: TOKENS.RADIUS.XL, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
});
