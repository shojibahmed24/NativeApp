// @ts-nocheck
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, YStack } from 'tamagui';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../src/context/ThemeContext';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <YStack space="$4" paddingBottom="$8">
          <View style={styles.iconContainer}>
            <ShieldCheck size={64} color="#005eb8" />
          </View>
          
          <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>UNICOM Terms of Service</Text>
          
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            Welcome to UNICOM. By using our application, you agree to comply with and be bound by the following terms and conditions of use.
          </Text>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            By accessing or using the UNICOM app, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
          </Text>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>2. Privacy and Security</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            Your privacy is our priority. UNICOM employs end-to-end encryption for all calls and messages. We do not store your private communication data. AI translation services process audio streams in real-time without permanent retention.
          </Text>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>3. Acceptable Use</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            You agree to use UNICOM only for lawful purposes. You must not use the app to transmit spam, harass others, distribute malware, or engage in any fraudulent activities.
          </Text>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>4. Subscriptions and Payments</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            Premium features require an active subscription. Payments are processed securely. Subscriptions auto-renew unless canceled prior to the renewal date. Refund requests are subject to our refund policy and applicable local laws.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>5. Account Termination</Text>
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155' }]}>
            We reserve the right to terminate or suspend your account immediately, without prior notice, for any breach of these Terms or for any conduct that we determine is inappropriate or harmful to the platform or other users.
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
