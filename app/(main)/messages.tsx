import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, TextInput, TouchableOpacity, View, Image, ActivityIndicator,
  StyleSheet, RefreshControl, Platform, Alert
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Search, Edit, Archive, Trash2, MessageSquare } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { decryptMessage } from '../../src/utils/cryptoUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { api } from '../../src/services/api';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GradientBackground } from '../../src/components/ThemeComponents';

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const getColor = (name: string) => {
  if (!name) return '#64748b';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getLastMessageText = (lastMessage: any) => {
  if (!lastMessage) return 'No messages yet';
  if (lastMessage.mediaType === 'image') return '📷 Photo';
  if (lastMessage.mediaType === 'audio') return '🎤 Voice message';
  if (lastMessage.mediaType === 'document') return '📄 Document';
  return lastMessage.text || 'Message';
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const deleteChat = (id) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
         setConversations(prev => prev.filter(c => c.id !== id));
         setFiltered(prev => prev.filter(c => c.id !== id));
      } }
    ]);
  };

  const renderRightActions = (id) => (
    <View style={{ flexDirection: 'row', width: 140 }}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center' }}>
        <Archive color="#fff" size={24} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteChat(id)} style={{ flex: 1, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' }}>
        <Trash2 color="#fff" size={24} />
      </TouchableOpacity>
    </View>
  );


  const loadConversations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (conversations.length === 0) setLoading(true);
    try {
      const res = await api.getConversations();
      if (res.success && res.conversations) {
        let convs = res.conversations;
        if (user) {
           convs = await Promise.all(convs.map(async (c) => {
             if (c.lastMessage && c.contact) {
                const decrypted = await decryptMessage(c.lastMessage.text, user.id, c.contact.id);
                c.lastMessage.text = decrypted;
             }
             return c;
           }));
        }
        setConversations(convs);
        setFiltered(convs);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadConversations(); }, [user]));

  useEffect(() => {
    if (!search.trim()) { setFiltered(conversations); return; }
    const q = search.toLowerCase();
    setFiltered(conversations.filter(c => (c.contact?.name || '').toLowerCase().includes(q) || (c.lastMessage?.text || '').toLowerCase().includes(q)));
  }, [search, conversations]);

  const onRefresh = () => loadConversations(true);

  if (loading) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text fontSize={28} fontWeight="900" color="#005eb8" letterSpacing={-0.5}>UniCom</Text>
          </View>
          <View style={styles.searchContainer}>
            <View style={{width: '100%', height: 20, backgroundColor: '#f1f5f9', borderRadius: 10}} />
          </View>
          <View style={{flex: 1}}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 50)} style={[styles.chatRow, styles.chatRowBorder]}>
                <View style={[styles.avatar, {backgroundColor: '#f1f5f9'}]} />
                <YStack flex={1} marginLeft="$3" space="$2" justifyContent="center">
                  <View style={{width: '50%', height: 16, backgroundColor: '#f1f5f9', borderRadius: 8}} />
                  <View style={{width: '80%', height: 14, backgroundColor: '#f8fafc', borderRadius: 7}} />
                </YStack>
              </Animated.View>
            ))}
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.header}>
            <Text fontSize={28} fontWeight="900" color="#005eb8" letterSpacing={-0.5}>UniCom</Text>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => console.log('Edit pressed')}>
              <Edit color="#005eb8" size={22} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Search color="#94a3b8" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text color="#94a3b8" fontSize={18} lineHeight={20}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: '#eff6ff', shadowColor: '#005eb8', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 }]}>
              <MessageSquare color="#005eb8" size={42} strokeWidth={1.5} />
            </View>
            <Text fontSize={22} fontWeight="800" color="#0f172a" marginTop="$5">
              {search ? 'No results found' : 'No messages yet'}
            </Text>
            <Text fontSize={15} color="#64748b" marginTop="$2" textAlign="center" paddingHorizontal="$4" lineHeight={22}>
              {search ? `We couldn't find any chats matching "${search}"` : 'Your inbox is empty. Start a new conversation and experience seamless translation!'}
            </Text>
          </Animated.View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#005eb8" />}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {filtered.map((conv, index) => {
              const contact = conv.contact;
              if (!contact) return null;
              const name = contact.name || 'Unknown';
              const initial = name.charAt(0).toUpperCase();
              const avatarBg = getColor(name);
              const lastMsg = conv.lastMessage;
              const unread = conv.unreadCount || 0;
              const isOnline = contact.onlineStatus === 'online';

              return (
                <Animated.View key={conv.chatId} entering={FadeInUp.delay(index * 40)}>
                  <Swipeable renderRightActions={() => renderRightActions(contact.id)}>
                    <TouchableOpacity style={[styles.chatRow, index < filtered.length - 1 && styles.chatRowBorder]}
                    onPress={() => router.push(`/chat/${contact.id}`)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar with online dot */}
                    <View style={styles.avatarWrapper}>
                      {contact.avatar ? (
                        <Image source={{ uri: contact.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' }]}>
                          <Text color="#fff" fontWeight="900" fontSize={20}>{initial}</Text>
                        </View>
                      )}
                      {isOnline && <View style={styles.onlineDot} />}
                    </View>

                    {/* Content */}
                    <YStack flex={1} marginLeft="$3">
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontWeight={unread > 0 ? '800' : '600'} fontSize={16} color="#0f172a" numberOfLines={1} flex={1}>
                          {name}
                        </Text>
                        <Text fontSize={12} color={unread > 0 ? '#005eb8' : '#94a3b8'} fontWeight={unread > 0 ? '700' : '400'} marginLeft="$2">
                          {formatTime(lastMsg?.createdAt || '')}
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between" alignItems="center" marginTop={3}>
                        <Text fontSize={14} color={unread > 0 ? '#475569' : '#94a3b8'} numberOfLines={1} flex={1} fontWeight={unread > 0 ? '600' : '400'}>
                          {getLastMessageText(lastMsg)}
                        </Text>
                        {unread > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text color="#fff" fontSize={11} fontWeight="800">{unread > 99 ? '99+' : unread}</Text>
                          </View>
                        )}
                      </XStack>
                    </YStack>
                  </TouchableOpacity>
                  </Swipeable>
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
  loadingContainer: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f6ff', alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a' } as any,
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#fff', minHeight: 76 },
  chatRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  avatarWrapper: { position: 'relative', width: 52, height: 52 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  unreadBadge: { backgroundColor: '#ef4444', borderRadius: 12, paddingHorizontal: 6, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 6, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
});
