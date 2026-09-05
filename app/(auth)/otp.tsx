import React, { useState, useRef, useEffect } from 'react';
import { View, Alert, TextInput, ActivityIndicator, TouchableOpacity, Text as RNText, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import { ChevronLeft, MessageCircle, ArrowRight, Edit3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function OtpScreen() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [activeBox, setActiveBox] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [timer, setTimer] = useState(45);
  
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const { verifyOtp } = useAuth();
  const insets = useSafeAreaInsets();
  
  const inputRefs = useRef<TextInput[]>([]);
  
  const buttonScale = useSharedValue(1);
  const shakeOffset = useSharedValue(0);
  const messageGlow = useSharedValue(0.2);

  useEffect(() => {
    // Focus first input on mount
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 600);
    
    // Message icon glow animation
    messageGlow.value = withRepeat(
      withTiming(0.8, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const triggerErrorShake = () => {
    if (Platform.OS !== "web") { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(()=>{}); }
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleVerify = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || digits.join('');
    if (finalCode.length < 6) {
      triggerErrorShake();
      return;
    }
    
    setIsLoading(true);
    try {
      await verifyOtp(phone as string, finalCode);
    } catch (error: any) {
      triggerErrorShake();
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeText = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pasted = text.substring(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, i) => {
        if (index + i < 6) newDigits[index + i] = char;
      });
      setDigits(newDigits);
      
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (newDigits.join('').length === 6) {
        handleVerify(newDigits.join(''));
      }
      return;
    }
    
    const newDigits = [...digits];
    newDigits[index] = text;
    setDigits(newDigits);
    
    if (text !== '') {
      if (Platform.OS !== "web") { Haptics.selectionAsync().catch(()=>{}); }
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else if (index === 5) {
        // Auto verify if last digit
        handleVerify(newDigits.join(''));
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '') {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{}); }
    router.replace('/(auth)/login');
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(45);
      Alert.alert('Code Sent', 'A new verification code has been sent.');
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const rowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeOffset.value }],
    };
  });

  const messageIconStyle = useAnimatedStyle(() => {
    return {
      opacity: messageGlow.value,
      transform: [{ scale: 1 + (messageGlow.value * 0.1) }],
    };
  });

  const isComplete = digits.join('').length === 6;

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#091733', '#0f2f5c', '#005eb8', '#e8f1ff']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Background Blobs (Different positions from Login) */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      
      {/* Header / Back Navigation */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFillObject, { borderRadius: 22, overflow: 'hidden' }]} />
          <ChevronLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFillObject, { borderRadius: 40, overflow: 'hidden' }]} />
          <Image 
            source={require('../../assets/images/logo-icon-transparent.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>
        <View style={{ width: 44 }} />
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.contentMaxWidth}>
            
            {/* Heading Section */}
            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.titleSection}>
              <View style={styles.iconWrapper}>
                <Animated.View style={[styles.glowRing, messageIconStyle]} />
                <MessageCircle color="#005eb8" size={24} />
              </View>
              <RNText style={styles.title}>Verification Code</RNText>
              <RNText style={styles.subtitle}>
                Enter the OTP sent to <RNText style={styles.boldPhone}>{phone}</RNText>
              </RNText>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInUp.duration(600).delay(400).springify()}>
              <View style={styles.formCard}>
                <View style={styles.cardAccent} />
                
                {/* OTP Input Row */}
                <Animated.View style={[styles.otpRow, rowAnimatedStyle]}>
                  {digits.map((digit, index) => (
                    <View key={index} style={[styles.otpBoxWrapper, activeBox === index && styles.otpBoxWrapperActive]}>
                      <TextInput
                        ref={el => inputRefs.current[index] = el!}
                        style={[
                          styles.otpInput,
                          activeBox === index && styles.otpInputActive,
                          digit !== '' && styles.otpInputFilled
                        ]}
                        value={digit}
                        onChangeText={(text) => handleChangeText(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => setActiveBox(index)}
                        keyboardType="number-pad"
                        maxLength={6} // Allow paste up to 6
                        selectTextOnFocus
                      />
                    </View>
                  ))}
                </Animated.View>
                
                {/* Resend Row */}
                <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.resendRow}>
                  <RNText style={styles.resendText}>Didn't receive the code? </RNText>
                  <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                    <RNText style={[styles.resendAction, timer > 0 && styles.resendActionDisabled]}>
                      {timer > 0 ? `Resend in 0:${timer.toString().padStart(2, '0')}` : 'Resend Code'}
                    </RNText>
                  </TouchableOpacity>
                </Animated.View>
                
                {/* Verify Button */}
                <AnimatedTouchableOpacity 
                  style={[buttonAnimatedStyle, !isComplete && { opacity: 0.5 }]}
                  onPress={() => handleVerify()} 
                  onPressIn={() => { if(isComplete) buttonScale.value = withSpring(0.96); }}
                  onPressOut={() => { buttonScale.value = withSpring(1); }}
                  disabled={isLoading || !isComplete}
                  activeOpacity={1}
                >
                  <View style={isComplete ? styles.buttonShadow : {}}>
                    <LinearGradient
                      colors={isComplete ? ['#005eb8', '#3b82f6'] : ['#94a3b8', '#94a3b8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.button}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <RNText style={styles.buttonText}>Verify & Login</RNText>
                          {isComplete && <ArrowRight size={20} color="#ffffff" />}
                        </>
                      )}
                    </LinearGradient>
                  </View>
                </AnimatedTouchableOpacity>
                
                {/* Change Phone */}
                <TouchableOpacity style={styles.changePhoneRow} onPress={handleBack}>
                  <Edit3 size={14} color="#005eb8" />
                  <RNText style={styles.changePhoneText}>Change Phone Number</RNText>
                </TouchableOpacity>

              </View>
            </Animated.View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#091733',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: 50,
    left: -100, // Top left
    shadowColor: '#fff',
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 20,
  },
  blob2: {
    width: 350,
    height: 350,
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    bottom: -50,
    right: -150, // Bottom right
    shadowColor: '#0ff',
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: 40,
    height: 40,
  },
  scrollContent: {
    flexGrow: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  contentMaxWidth: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 16,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  glowRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#005eb8',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  boldPhone: {
    color: '#ffffff',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    paddingTop: 36,
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 12,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: '50%',
    height: 4,
    backgroundColor: '#005eb8',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBoxWrapper: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  otpBoxWrapperActive: {
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  otpInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  otpInputActive: {
    borderColor: '#005eb8',
    backgroundColor: '#ffffff',
  },
  otpInputFilled: {
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 13,
    color: '#64748b',
  },
  resendAction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#005eb8',
  },
  resendActionDisabled: {
    color: '#94a3b8',
  },
  buttonShadow: {
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  changePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  changePhoneText: {
    color: '#005eb8',
    fontWeight: '700',
    fontSize: 14,
  },
});
