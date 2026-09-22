import React, { useState } from 'react';
import { View, Alert, TextInput, ActivityIndicator, TouchableOpacity, Text as RNText, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { YStack } from 'tamagui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useThemeContext } from '../../src/context/ThemeContext';
import { GradientBackground } from '../../src/components/ThemeComponents';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { ArrowRight, Lock, KeyRound, AlertCircle } from 'lucide-react-native';
import { TOKENS } from '../../src/theme/tokens';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function PasswordScreen() {
  const { phone } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { loginWithPassword, loginWithPhone } = useAuth();
  const { isDark } = useThemeContext();
  
  const buttonScale = useSharedValue(1);
  const shakeTranslateX = useSharedValue(0);

  const triggerShake = () => {
    shakeTranslateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleLogin = async () => {
    if (!password) {
      setErrorMessage('Please enter your password');
      triggerShake();
      return;
    }
    
    setErrorMessage('');
    setIsLoading(true);
    try {
      await loginWithPassword(phone as string, password);
      router.replace('/(main)/messages');
    } catch (error: any) {
      setErrorMessage(error.message || 'Incorrect password. Please try again.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithOtp = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await loginWithPhone(phone as string, 'sms');
      router.push({ pathname: '/(auth)/otp', params: { phone, isRecovery: 'true' } });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressIn = () => buttonScale.value = withSpring(0.96);
  const handlePressOut = () => buttonScale.value = withSpring(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));
  const shakeAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeTranslateX.value }] }));

  return (
    <GradientBackground style={styles.container}>
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" width="100%">
            <View style={styles.contentMaxWidth}>
              
              <View style={styles.headerContainer}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : '#ffffff', elevation: Platform.OS === 'web' ? 2 : 0, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 12 }]}>
                  <KeyRound size={40} color="#005eb8" strokeWidth={1.5} />
                </View>
                <RNText style={[styles.title, { color: isDark ? '#ffffff' : '#0f172a' }]}>Enter Password</RNText>
                <RNText style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.8)' : '#475569' }]}>
                  Welcome back! Please enter your password for {phone}
                </RNText>
              </View>

              <Animated.View style={[styles.formCard, shakeAnimatedStyle, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                <View style={styles.cardAccent} />
                <View style={styles.inputSection}>
                  <RNText style={[styles.label, { marginBottom: 8, color: isDark ? '#f8fafc' : '#334155' }]}>Password</RNText>
                  <View style={[styles.inputContainer, isFocused && styles.inputFocused, errorMessage ? { borderColor: '#ef4444', borderWidth: 1 } : null, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                    <View style={styles.iconWrap}><Lock size={20} color={errorMessage ? '#ef4444' : isFocused ? '#005eb8' : '#94a3b8'} /></View>
                    <TextInput
                      style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                      placeholder="Your Password"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                  </View>
                  {errorMessage ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <AlertCircle size={14} color="#ef4444" style={{ marginRight: 4 }} />
                      <RNText style={{ color: '#ef4444', fontSize: 13, fontWeight: '500' }}>{errorMessage}</RNText>
                    </View>
                  ) : null}
                </View>

                <AnimatedTouchableOpacity
                  onPress={handleLogin}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.9}
                  style={buttonAnimatedStyle}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ['#94a3b8', '#64748b'] : ['#007aff', '#005eb8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <RNText style={styles.buttonText}>Login</RNText>
                        <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                      </>
                    )}
                  </LinearGradient>
                </AnimatedTouchableOpacity>

                <TouchableOpacity 
                  style={{ marginTop: 20, alignItems: 'center' }} 
                  onPress={handleLoginWithOtp}
                  disabled={isLoading}
                >
                  <RNText style={{ color: '#005eb8', fontWeight: '600' }}>Forgot Password?</RNText>
                </TouchableOpacity>

              </Animated.View>

            </View>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, minHeight: '100%' },
  contentMaxWidth: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  formCard: { backgroundColor: '#ffffff', borderRadius: 32, padding: 28, paddingTop: 36, ...TOKENS.SHADOWS.ELEVATED, marginBottom: 32, overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: '25%', width: '50%', height: 4, backgroundColor: '#005eb8', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  inputSection: { marginBottom: 24 },
  label: { fontWeight: '600', color: '#334155', fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: TOKENS.RADIUS.MD, backgroundColor: '#f8fafc', overflow: 'hidden' },
  inputFocused: { borderColor: '#005eb8', backgroundColor: '#ffffff' },
  iconWrap: { width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0)' },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#0f172a', fontWeight: '600', paddingRight: 16 },
  button: { height: 56, borderRadius: TOKENS.RADIUS.MD, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 }
});
