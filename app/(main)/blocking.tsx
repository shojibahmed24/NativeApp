import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { ShieldAlert, ShieldBan, Trash2, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground, GlassCard } from '../../src/components/ThemeComponents';
import { useThemeContext } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';
import { TOKENS } from '../../src/theme/tokens';


export default function BlockingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const [blockedContacts, setBlockedContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const res = await api.getBlockedUsers();
        if (res.success && res.blockedUsers) {
          setBlockedContacts(res.blockedUsers);
        } else if (res.users) {
          setBlockedContacts(res.users);
        }
      } catch (err) {
        console.error('Error fetching blocked users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (id: string) => {
    try {
      await api.unblockUser(id);
      setBlockedContacts(prev => prev.filter(c => c.id !== id && c.blocked_id !== id && c.blocked_user?.id !== id));
    } catch (err) {
      console.error('Error unblocking user', err);
    }
  };

  return (
    <GradientBackground paddingHorizontal="$4">
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <XStack alignItems="center" space="$2">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4, marginRight: 8 }}
            activeOpacity={0.7}
          >
            <ChevronLeft color={isDark ? '#f8fafc' : '#0f172a'} size={28} />
          </TouchableOpacity>
          <Text fontSize="$7" fontWeight="bold" color={isDark ? '#f8fafc' : '#0f172a'}>
            Blocked Numbers
          </Text>
        </XStack>
        <ShieldBan color="#005eb8" size={24} />
      </View>

      <YStack space="$4" flex={1}>
        <GlassCard padding="$4" alignItems="center" space="$2">
          <ShieldAlert color="#d9534f" size={32} />
          <Text fontWeight="bold" fontSize="$5" color={isDark ? '#f8fafc' : '#0f172a'}>
            Spam Protection Active
          </Text>
          <Text color={isDark ? '#94a3b8' : '#64748b'} textAlign="center" fontSize="$3">
            Calls from known spammers will be automatically blocked.
          </Text>
        </GlassCard>

        <Text fontSize="$5" fontWeight="bold" color={isDark ? '#f8fafc' : '#0f172a'} marginTop="$4">
          Blocked Numbers
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color="#005eb8" size="large" style={{ marginTop: 20 }} />
          ) : blockedContacts.length === 0 ? (
            <Text color={isDark ? '#94a3b8' : '#64748b'} textAlign="center" marginTop="$4">
              No blocked numbers.
            </Text>
          ) : (
            <GlassCard padding="$0" overflow="hidden" marginBottom="$8">
              {blockedContacts.map((contact, index) => (
                <XStack 
                  key={contact.id} 
                  padding="$3" 
                  alignItems="center" 
                  justifyContent="space-between"
                  borderBottomWidth={index === blockedContacts.length - 1 ? 0 : 1}
                  borderBottomColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                >
                  <YStack>
                    <Text fontWeight="bold" fontSize="$5" color={isDark ? '#f8fafc' : '#0f172a'}>
                      {contact.phone || contact.phone_number || contact.blocked_user?.phone_number || 'Unknown'}
                    </Text>
                    <Text color="#d9534f" fontSize="$3">
                      {contact.reason || 'Blocked'}
                    </Text>
                  </YStack>
                  <TouchableOpacity
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isDark ? 'rgba(217, 83, 79, 0.2)' : 'rgba(217, 83, 79, 0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => handleUnblock(contact.blocked_id || contact.blocked_user?.id || contact.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color={isDark ? '#f87171' : '#d9534f'} />
                  </TouchableOpacity>
                </XStack>
              ))}
            </GlassCard>
          )}
        </ScrollView>
      </YStack>
    </GradientBackground>
  );
}
