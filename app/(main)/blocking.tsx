import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { ShieldAlert, ShieldBan, Trash2 } from 'lucide-react-native';
import { GradientBackground, GlassCard } from '../../src/components/ThemeComponents';
import { api } from '../../src/services/api';

export default function BlockingScreen() {
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
      setBlockedContacts(prev => prev.filter(c => c.id !== id && c.blocked_id !== id));
    } catch (err) {
      console.error('Error unblocking user', err);
    }
  };

  return (
    <GradientBackground paddingHorizontal="$4" paddingTop="$10">
      <YStack space="$4" flex={1}>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$8" fontWeight="bold" color="#005eb8">Blocking</Text>
          <ShieldBan color="#005eb8" size={24} />
        </XStack>

        <GlassCard padding="$4" alignItems="center" space="$2">
          <ShieldAlert color="#d9534f" size={32} />
          <Text fontWeight="bold" fontSize="$5" color="#333">Spam Protection Active</Text>
          <Text color="$colorSubtitle" textAlign="center" fontSize="$3">
            Calls from known spammers will be automatically blocked.
          </Text>
        </GlassCard>

        <Text fontSize="$5" fontWeight="bold" color="#333" marginTop="$4">Blocked Numbers</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color="#005eb8" size="large" style={{ marginTop: 20 }} />
          ) : blockedContacts.length === 0 ? (
            <Text color="#64748b" textAlign="center" marginTop="$4">No blocked numbers.</Text>
          ) : (
            <GlassCard padding="$0" overflow="hidden" marginBottom="$8">
              {blockedContacts.map((contact, index) => (
                <XStack 
                  key={contact.id} 
                  padding="$3" 
                  alignItems="center" 
                  justifyContent="space-between"
                  borderBottomWidth={index === blockedContacts.length - 1 ? 0 : 1}
                  borderBottomColor="rgba(0,0,0,0.05)"
                >
                  <YStack>
                    <Text fontWeight="bold" fontSize="$5" color="#333">{contact.phone || contact.phone_number || contact.blocked_user?.phone_number || 'Unknown'}</Text>
                    <Text color="#d9534f" fontSize="$3">{contact.reason || 'Blocked'}</Text>
                  </YStack>
                  <Button size="$3" circular backgroundColor="rgba(217, 83, 79, 0.1)" onPress={() => handleUnblock(contact.blocked_id || contact.blocked_user?.id || contact.id)}>
                    <Trash2 size={18} color="#d9534f" />
                  </Button>
                </XStack>
              ))}
            </GlassCard>
          )}
        </ScrollView>
      </YStack>
    </GradientBackground>
  );
}
