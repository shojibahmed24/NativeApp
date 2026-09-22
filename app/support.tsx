// @ts-nocheck
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Linking } from 'react-native';
import { Text, YStack, XStack } from 'tamagui';
import { ArrowLeft, HeadphonesIcon, Mail, MessageCircle, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../src/context/ThemeContext';

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@unicom.app');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <YStack space="$4" paddingBottom="$8">
          <View style={styles.iconContainer}>
            <HeadphonesIcon size={64} color="#005eb8" />
          </View>
          
          <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>How can we help you?</Text>
          
          <Text style={[styles.paragraph, { color: isDark ? '#cbd5e1' : '#334155', textAlign: 'center' }]}>
            Our support team is available 24/7 to assist you with any issues regarding the UNICOM app.
          </Text>

          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Contact Methods</Text>
            
            <TouchableOpacity style={[styles.contactCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]} onPress={handleEmailSupport}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 94, 184, 0.1)' }]}>
                <Mail size={24} color="#005eb8" />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={[styles.cardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Email Support</Text>
                <Text style={[styles.cardSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>support@unicom.app</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]} onPress={() => router.push('/chat/support_bot')}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <MessageCircle size={24} color="#10b981" />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={[styles.cardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Live Chat</Text>
                <Text style={[styles.cardSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>Usually replies within 5 minutes</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginTop: 32 }]}>FAQ</Text>
          
          <View style={[styles.faqCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Text style={[styles.faqTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>How does live translation work?</Text>
            <Text style={[styles.faqAns, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              UNICOM uses advanced AI models to translate your voice in real-time during calls. Just select your preferred language in the settings.
            </Text>
          </View>

          <View style={[styles.faqCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Text style={[styles.faqTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Are my calls secure?</Text>
            <Text style={[styles.faqAns, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Yes, all calls and messages are End-to-End Encrypted. No one, including UNICOM, can intercept your communication.
            </Text>
          </View>

          <Text style={[styles.footerText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            UNICOM Support Team
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
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  paragraph: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 13, fontWeight: '500' },
  faqCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  faqTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  faqAns: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  footerText: { fontSize: 13, textAlign: 'center', marginTop: 32, fontWeight: '500' }
});
