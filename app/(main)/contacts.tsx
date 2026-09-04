import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, TextInput, TouchableOpacity, View, Image, ActivityIndicator,
  StyleSheet, RefreshControl, Platform, Alert
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Search, Phone, Video, UserPlus, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useCall } from '../../src/context/CallContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { GradientBackground } from '../../src/components/ThemeComponents';

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const getColor = (name: string) => {
  if (!name) return '#64748b';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

export default function ContactsScreen() {
  const router = useRouter();
  const { startVoiceCall } = useCall();
  const [contacts, setContacts] = useState<any[]>([]);
  const [nonUnicomContacts, setNonUnicomContacts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const loadContacts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      // Try device contacts sync first
      if (Platform.OS !== 'web') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          setPermissionDenied(false);
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
          });
          const phones = data
            .flatMap(c => c.phoneNumbers || [])
            .map(p => p.number?.replace(/\s|-|\(|\)/g, '') || '')
            .filter(p => p.length >= 7);

          if (phones.length > 0) {
            setSyncing(true);
            const res = await api.syncContacts(phones);
            setSyncing(false);
            if (res.success && res.contacts) {
              setContacts(res.contacts);
              
              // Find non-UNICOM contacts
              const registeredPhones = new Set(res.contacts.map((c: any) => c.phone?.replace(/\s|-|\(|\)/g, '') || ''));
              const validDeviceContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
              const nonReg = validDeviceContacts.filter(dc => {
                const p = dc.phoneNumbers?.[0]?.number?.replace(/\s|-|\(|\)/g, '');
                return p && !registeredPhones.has(p) && !registeredPhones.has('+88' + p);
              }).map(dc => ({
                id: 'non_' + dc.id,
                name: dc.name,
                phone: dc.phoneNumbers?.[0]?.number,
                isNonUnicom: true
              })).slice(0, 50); // Limit to 50 to avoid massive lists
              
              setNonUnicomContacts(nonReg);
              setFiltered([...res.contacts, ...nonReg]);
              return;
            }
          }
        } else {
          setPermissionDenied(true);
        }
      }

      // Web fallback — use syncContacts with a dummy call to get registered users
      const res = await api.syncContacts([]);
      if (res.success && res.contacts) {
        setContacts(res.contacts);
        setFiltered(res.contacts);
      }
    } catch (e) {
      console.error('Failed to load contacts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  };

  useEffect(() => { loadContacts(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered([...contacts, ...nonUnicomContacts]); return; }
    const q = search.toLowerCase();
    const all = [...contacts, ...nonUnicomContacts];
    setFiltered(all.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q)));
  }, [search, contacts, nonUnicomContacts]);

  const handleCall = async (contact: any) => {
    Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (contact.isNonUnicom) {
       Linking.openURL(`sms:${contact.phone}?body=Let's chat on UNICOM! Download the app: https://unicom.app`);
       return;
    }
    router.push(`/chat/${contact.id}`);
  };

  const initial = (name: string) => (name || '?').charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#005eb8" size="large" />
        <Text color="#94a3b8" marginTop="$3">{syncing ? 'Syncing contacts...' : 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <GradientBackground style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.header}>
            <Text fontSize={28} fontWeight="900" color="#005eb8" letterSpacing={-0.5}>Contacts</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={() => loadContacts(true)}>
              <Users color="#005eb8" size={22} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Search color="#94a3b8" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text color="#94a3b8" fontSize={18}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {permissionDenied && filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Users color="#ef4444" size={36} />
            </View>
            <Text fontSize={18} fontWeight="700" color="#0f172a" marginTop="$4">Contacts Access Denied</Text>
            <Text fontSize={14} color="#94a3b8" marginTop="$2" textAlign="center">
              Please enable contacts permission in your settings to easily find friends on UNICOM.
            </Text>
          </Animated.View>
        ) : filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Users color="#94a3b8" size={36} />
            </View>
            <Text fontSize={18} fontWeight="700" color="#0f172a" marginTop="$4">
              {search ? 'No results found' : 'No UNICOM contacts'}
            </Text>
            <Text fontSize={14} color="#94a3b8" marginTop="$2" textAlign="center">
              {search ? `No contacts matching "${search}"` : 'Your phone contacts who use UNICOM will appear here'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.syncBtn} onPress={() => loadContacts(true)}>
                <UserPlus color="#fff" size={18} />
                <Text color="#fff" fontWeight="700" marginLeft="$2">Sync Contacts</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadContacts(true)} tintColor="#005eb8" />}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Count */}
            <Text style={styles.countLabel}>{filtered.length} UNICOM contact{filtered.length !== 1 ? 's' : ''}</Text>

            {filtered.map((contact, index) => {
              const name = contact.name || 'Unknown';
              const avatarBg = getColor(name);
              const isOnline = contact.onlineStatus === 'online';

              return (
                <Animated.View key={contact.id || index} entering={FadeInUp.delay(index * 40)}>
                  <TouchableOpacity
                    style={[styles.contactRow, index < filtered.length - 1 && styles.rowBorder]}
                    onPress={() => router.push(`/profile/${contact.id}`)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar */}
                    <View style={styles.avatarWrapper}>
                      {contact.avatar ? (
                        <Image source={{ uri: contact.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' }]}>
                          <Text color="#fff" fontWeight="900" fontSize={20}>{initial(name)}</Text>
                        </View>
                      )}
                      {isOnline && <View style={styles.onlineDot} />}
                    </View>

                    {/* Info */}
                    <YStack flex={1} marginLeft="$3">
                      <Text fontWeight="700" fontSize={16} color="#0f172a">{name}</Text>
                      <Text fontSize={13} color="#94a3b8" marginTop={2}>
                        {contact.phone || contact.about || 'UNICOM user'}
                      </Text>
                    </YStack>

                    {/* Actions */}
                    <XStack space="$2">
                      <TouchableOpacity
                        style={[styles.actionBtn, contact.isNonUnicom && { backgroundColor: '#10b981' }]}
                        onPress={(e) => { if (Platform.OS === 'web') (e as any).stopPropagation(); handleCall(contact); }}
                      >
                        {contact.isNonUnicom ? <Send color="#fff" size={16} /> : <MessageSquare color="#005eb8" size={20} />}
                        {contact.isNonUnicom && <Text color="#fff" fontSize={12} fontWeight="bold" marginLeft="$2">Invite</Text>}
                      </TouchableOpacity>
                    </XStack>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
      </GradientBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f6ff', alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a' } as any,
  countLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, paddingVertical: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#fff', minHeight: 76 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  avatarWrapper: { position: 'relative', width: 52, height: 52 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  actionBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f0f6ff', alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#005eb8', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, marginTop: 24, shadowColor: '#005eb8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});
