import React, { useState } from 'react';
import { View, Alert, TextInput, TouchableOpacity, Text as RNText, StyleSheet , Image, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, H1, Paragraph } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { GradientBackground } from '../../src/components/ThemeComponents';

export default function OtpScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { phone } = useLocalSearchParams();
  const router = useRouter();
  const { verifyOtp } = useAuth();

  const handleVerify = async () => {
    if (!code || code.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }
    
    setIsLoading(true);
    try {
      await verifyOtp(phone as string, code);
      // Auto-redirect handled by AuthContext layout effect
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground paddingHorizontal="$0">
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      
      <YStack flex={1} padding="$6" justifyContent="center" space="$5">
        <YStack alignItems="center" space="$2" marginBottom="$6">
          <Image 
            source={require('../../assets/images/logo-icon-transparent.png')} 
            style={{ width: 100, height: 100, marginBottom: 10 }} 
            resizeMode="contain" 
          />
          
          <Paragraph textAlign="center" color="#475569" fontSize="$4" fontWeight="500" marginTop="$2">Premium Chat & Call Translation</Paragraph>
        </YStack>

        <View style={styles.formContainer}>
          <RNText style={styles.label}>Verification Code</RNText>
          <Paragraph color="#475569" marginBottom="$2" fontSize={14}>
            Enter the OTP sent to {phone}
          </Paragraph>
          <TextInput 
            style={styles.input}
            placeholder="000000" 
            placeholderTextColor="#94a3b8"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleVerify} 
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <RNText style={styles.buttonText}>Verify & Login</RNText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 12, alignItems: 'center' }}>
             <RNText style={{ color: '#005eb8', fontWeight: 'bold' }}>Change Phone Number</RNText>
          </TouchableOpacity>
        </View>
      </YStack>
      
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 80, 
    height: 80, 
    borderRadius: 24, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#005eb8', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 15, 
    elevation: 5, 
    marginBottom: 16
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  label: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: 16,
    marginBottom: 4
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 4
  },
  button: {
    height: 56,
    backgroundColor: '#005eb8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18
  }
});
