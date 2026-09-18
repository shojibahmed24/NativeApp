import React, { useState, useCallback, useMemo } from 'react';
import { View, Alert, TextInput, ActivityIndicator, TouchableOpacity, Text as RNText, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Modal, FlatList } from 'react-native';
import { YStack } from 'tamagui';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useThemeContext } from '../../src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Phone, ArrowRight, Lock, ShieldCheck, ChevronDown, X } from 'lucide-react-native';
import { TOKENS } from '../../src/theme/tokens';


const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const COUNTRIES = [
  { name: 'Bangladesh', code: 'BD', dial: '+880', flag: '🇧🇩' },
  { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'India', code: 'IN', dial: '+91', flag: '🇮🇳' },
  { name: 'Pakistan', code: 'PK', dial: '+92', flag: '🇵🇰' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966', flag: '🇸🇦' },
  { name: 'UAE', code: 'AE', dial: '+971', flag: '🇦🇪' },
  { name: 'Malaysia', code: 'MY', dial: '+60', flag: '🇲🇾' },
  { name: 'Singapore', code: 'SG', dial: '+65', flag: '🇸🇬' },
  { name: 'Australia', code: 'AU', dial: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
];

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useThemeContext();
  const router = useRouter();
  const { loginWithPhone } = useAuth();
  
  const buttonScale = useSharedValue(1);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 6) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      const fullNumber = `${selectedCountry.dial}${phone}`;
      const res = await loginWithPhone(fullNumber, 'sms');
      if (res.devOtp) {
        Alert.alert('DEV MODE OTP', `Your test OTP is: ${res.devOtp}`);
        console.log('%c[DEV OTP] Your test OTP is: ' + res.devOtp, 'color: #005eb8; font-size: 16px; font-weight: bold;');
      }
      router.push({ pathname: '/(auth)/otp', params: { phone: fullNumber } });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Deep Rich Gradient Background */}
      <LinearGradient
        colors={isDark ? TOKENS.GRADIENTS.DARK_BG : TOKENS.GRADIENTS.LIGHT_BG}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Background Blobs (No full screen BlurView so we keep the rich colors) */}
      
      
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" width="100%">
            
            <View style={styles.contentMaxWidth}>
              
              {/* Logo Area */}
              <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.headerArea}>
                <View style={styles.logoShadow}>
                  {/* Made the logo container bigger and the logo bigger */}
                  <View style={styles.logoContainer}>
                    <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFillObject, { borderRadius: 80, overflow: 'hidden' }]} />
                    <Image 
                      source={require('../../assets/images/logo-icon-transparent.png')} 
                      style={styles.logo} 
                      resizeMode="contain" 
                    />
                  </View>
                </View>
                
                <Animated.View entering={FadeInUp.duration(600).delay(300)} style={{ alignItems: 'center' }}>
                  <View style={styles.badge}>
                    <ShieldCheck size={14} color="#005eb8" />
                    <RNText style={styles.badgeText}>End-to-End Encrypted</RNText>
                  </View>
                  <RNText style={[styles.tagline, { color: isDark ? '#ffffff' : '#0f172a', textShadowColor: isDark ? 'rgba(0,0,0,0.4)' : 'transparent' }]}>Premium Chat & Call Translation</RNText>
                </Animated.View>
              </Animated.View>

              {/* Form Card */}
              <Animated.View entering={FadeInUp.duration(700).delay(500).springify()}>
                <View style={[styles.formCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  {/* Top floating accent */}
                  <View style={styles.cardAccent} />
                  
                  <View style={styles.inputSection}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Phone size={14} color="#334155" style={{ marginRight: 6 }} />
                      <RNText style={[styles.label, { color: isDark ? '#f8fafc' : '#334155' }]}>Phone Number</RNText>
                    </View>
                    
                    <View style={[styles.inputContainer, isFocused && styles.inputFocused, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                      
                      {/* Interactive Country Chip */}
                      <TouchableOpacity 
                        style={styles.flagChip} 
                        onPress={() => setShowCountryPicker(true)}
                        activeOpacity={0.7}
                      >
                        <RNText style={styles.flagIcon}>{selectedCountry.flag}</RNText>
                        <RNText style={styles.dialCode}>{selectedCountry.dial}</RNText>
                        <ChevronDown size={14} color={TOKENS.COLORS.TEXT_SECONDARY} style={{ marginLeft: 4 }} />
                        <View style={styles.divider} />
                      </TouchableOpacity>
                      
                      <TextInput 
                        style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                        placeholder="1700000000" 
                        placeholderTextColor="#94a3b8"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      />
                    </View>
                  </View>
                  
                  <AnimatedTouchableOpacity 
                    style={buttonAnimatedStyle}
                    onPress={handleSendOtp} 
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isLoading}
                    activeOpacity={1}
                  >
                    <View style={styles.buttonShadow}>
                      <LinearGradient
                        colors={TOKENS.GRADIENTS.PRIMARY}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <RNText style={styles.buttonText}>Continue</RNText>
                            <ArrowRight size={20} color="#ffffff" />
                          </>
                        )}
                      </LinearGradient>
                    </View>
                  </AnimatedTouchableOpacity>
                  
                  <View style={styles.trustSection}>
                    <Lock size={12} color={TOKENS.COLORS.TEXT_SECONDARY} />
                    <RNText style={styles.trustText}>Your number is safe and never shared</RNText>
                  </View>
                </View>
              </Animated.View>

              {/* Bottom Terms */}
              <Animated.View entering={FadeInUp.duration(500).delay(800)}>
                <RNText style={styles.termsText}>
                  By continuing, you agree to our <RNText style={styles.linkText}>Terms</RNText> & <RNText style={styles.linkText}>Privacy Policy</RNText>
                </RNText>
              </Animated.View>
              
            </View>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Select Country</RNText>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)} style={styles.closeButton}>
                <X size={24} color="#334155" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryPicker(false);
                  }}
                >
                  <RNText style={styles.countryFlag}>{item.flag}</RNText>
                  <RNText style={styles.countryName}>{item.name}</RNText>
                  <RNText style={styles.countryDial}>{item.dial}</RNText>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
    width: 350,
    height: 350,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -100,
    right: -100,
    shadowColor: '#fff',
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 20,
  },
  blob2: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    bottom: -150,
    left: -150,
    shadowColor: '#0ff',
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 20,
  },
  scrollContent: {
    flexGrow: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentMaxWidth: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 8,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoShadow: {
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
    marginBottom: 24,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logo: {
    width: 125,
    height: 125,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TOKENS.RADIUS.LG,
    marginBottom: 16,
    ...TOKENS.SHADOWS.ELEVATED,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005eb8',
    marginLeft: 6,
  },
  tagline: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: TOKENS.RADIUS.XL,
    padding: 28,
    paddingTop: 36,
    ...TOKENS.SHADOWS.ELEVATED,
    marginBottom: 32,
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
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontWeight: '600',
    color: '#334155',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: TOKENS.RADIUS.MD,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: '#005eb8',
    backgroundColor: '#ffffff',
    ...TOKENS.SHADOWS.ELEVATED,
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    height: '100%',
  },
  flagIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  dialCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    paddingLeft: 10,
    paddingRight: 16,
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
    borderRadius: TOKENS.RADIUS.MD,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  linkText: {
    color: '#ffffff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: TOKENS.RADIUS.LG,
    borderTopRightRadius: TOKENS.RADIUS.LG,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  countryDial: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
});
