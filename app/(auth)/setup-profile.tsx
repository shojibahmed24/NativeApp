import React, { useState } from 'react';
import { View, Alert, TextInput, ActivityIndicator, TouchableOpacity, Text as RNText, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { YStack } from 'tamagui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ArrowRight, Lock, User, UserPlus } from 'lucide-react-native';
import { TOKENS } from '../../src/theme/tokens';
import { GradientBackground } from '../../src/components/ThemeComponents';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function SetupProfileScreen() {
  const { phone, registrationToken } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { registerWithPassword } = useAuth();
  
  const buttonScale = useSharedValue(1);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      await registerWithPassword(phone as string, name.trim(), password, registrationToken as string);
      router.replace('/(main)/messages');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressIn = () => buttonScale.value = withSpring(0.96);
  const handlePressOut = () => buttonScale.value = withSpring(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  return (
    <GradientBackground style={styles.container}>
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" width="100%">
            <View style={styles.contentMaxWidth}>
              
              <View style={styles.headerContainer}>
                <View style={styles.iconCircle}>
                  <UserPlus size={40} color="#005eb8" strokeWidth={1.5} />
                </View>
                <RNText style={styles.title}>Setup Profile</RNText>
                <RNText style={styles.subtitle}>
                  Almost there! Set your name and password to complete registration.
                </RNText>
              </View>

              <View style={styles.formCard}>
                <View style={styles.cardAccent} />
                
                <View style={styles.inputSection}>
                  <RNText style={[styles.label, { marginBottom: 8 }]}>Full Name</RNText>
                  <View style={[styles.inputContainer, focusedInput === 'name' && styles.inputFocused]}>
                    <View style={styles.iconWrap}><User size={20} color={focusedInput === 'name' ? '#005eb8' : '#94a3b8'} /></View>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#94a3b8"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <RNText style={[styles.label, { marginBottom: 8 }]}>Password</RNText>
                  <View style={[styles.inputContainer, focusedInput === 'pass' && styles.inputFocused]}>
                    <View style={styles.iconWrap}><Lock size={20} color={focusedInput === 'pass' ? '#005eb8' : '#94a3b8'} /></View>
                    <TextInput
                      style={styles.input}
                      placeholder="Create Password"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedInput('pass')}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <RNText style={[styles.label, { marginBottom: 8 }]}>Confirm Password</RNText>
                  <View style={[styles.inputContainer, focusedInput === 'cpass' && styles.inputFocused]}>
                    <View style={styles.iconWrap}><Lock size={20} color={focusedInput === 'cpass' ? '#005eb8' : '#94a3b8'} /></View>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#94a3b8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setFocusedInput('cpass')}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
                    />
                  </View>
                </View>

                <AnimatedTouchableOpacity
                  onPress={handleRegister}
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
                        <RNText style={styles.buttonText}>Complete Registration</RNText>
                        <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                      </>
                    )}
                  </LinearGradient>
                </AnimatedTouchableOpacity>

              </View>

            </View>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, minHeight: '100%', paddingVertical: 20 },
  contentMaxWidth: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  formCard: { backgroundColor: '#ffffff', borderRadius: 32, padding: 28, paddingTop: 36, ...TOKENS.SHADOWS.ELEVATED, marginBottom: 32, overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: '25%', width: '50%', height: 4, backgroundColor: '#005eb8', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  inputSection: { marginBottom: 20 },
  label: { fontWeight: '600', color: '#334155', fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: TOKENS.RADIUS.MD, backgroundColor: '#f8fafc', overflow: 'hidden' },
  inputFocused: { borderColor: '#005eb8', backgroundColor: '#ffffff' },
  iconWrap: { width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0)' },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#0f172a', fontWeight: '600', paddingRight: 16 },
  button: { height: 56, borderRadius: TOKENS.RADIUS.MD, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 }
});
