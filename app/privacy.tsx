// @ts-nocheck
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, YStack } from 'tamagui';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../src/context/ThemeContext';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <YStack space="$4" paddingBottom="$8">
          <View style={styles.iconContainer}>
            <Lock size={64} color="#10b981" />
          </View>
          
          <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>UNICOM Privacy Policy</Text>
          
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            At UNICOM, your privacy is our core value. We have built this app to ensure your communications remain completely secure and private.
          </Text>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>1. End-to-End Encryption</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            All messages, voice calls, and video calls are secured with industry-standard End-to-End Encryption (E2EE). This means only you and the person you're communicating with can read or listen to them. No one else, not even UNICOM, has access to the content.
          </Text>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>2. AI Translation Data</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            Our real-time translation features process audio temporarily in memory. Audio data is streamed directly to our translation engine and is immediately discarded after the translated text or synthesized voice is returned. We do not use your personal conversations to train our AI models.
          </Text>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>3. Data Collection</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            We collect only the minimum data required to operate the service, such as your phone number for account verification, profile information (if provided), and technical logs necessary for troubleshooting and improving network connectivity.
          </Text>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>4. Information Sharing</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            We will never sell, rent, or trade your personal information to third parties. We may disclose data only if required by valid legal processes.
          </Text>

          <Text style={[styles.footerText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Last Updated: September 9, 2026
          </Text>
        </YStack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  paragraph: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  footerText: { fontSize: 13, textAlign: 'center', marginTop: 32, fontWeight: '500' }
});
