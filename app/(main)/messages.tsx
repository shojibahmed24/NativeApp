import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, TextInput, TouchableOpacity, TouchableHighlight, View, Image,
  StyleSheet, RefreshControl, Platform, Alert, Animated as RNAnimated
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Search, Edit, Archive, Trash2, MessageSquare, Image as ImageIcon, Mic, FileText, X } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { decryptMessage } from '../../src/utils/cryptoUtils';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { api } from '../../src/services/api';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming } from 'react-native-reanimated';
import { GradientBackground } from '../../src/components/ThemeComponents';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { TOKENS } from '../../src/theme/tokens';


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

const getLastMessagePreview = (lastMessage: any) => {
  if (!lastMessage) return <Text style={styles.msgText} numberOfLines={1}>No messages yet</Text>;
  if (lastMessage.mediaType === 'image') return (
    <XStack space="$1.5" alignItems="center">
      <View style={[styles.chipBase, { backgroundColor: '#e0f2fe' }]}><ImageIcon size={10} color="#0284c7" /></View>
      <Text style={styles.msgText}>Photo</Text>
    </XStack>
  );
  if (lastMessage.mediaType === 'audio') return (
    <XStack space="$1.5" alignItems="center">
      <View style={[styles.chipBase, { backgroundColor: '#f3e8ff' }]}><Mic size={10} color="#9333ea" /></View>
      <Text style={styles.msgText}>Voice message</Text>
    </XStack>
  );
  if (lastMessage.mediaType === 'document') return (
    <XStack space="$1.5" alignItems="center">
      <View style={[styles.chipBase, { backgroundColor: '#ffedd5' }]}><FileText size={10} color="#ea580c" /></View>
      <Text style={styles.msgText}>Document</Text>
    </XStack>
  );
  return <Text style={styles.msgText} numberOfLines={1}>{lastMessage.text || 'Message'}</Text>;
};

const ScaleButton = ({ onPress, style, children }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={style}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const PulseDot = () => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.5, { duration: 1500 }), -1, true);
    opacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }], opacity: opacity.value
  }));
  return (
    <View style={styles.onlineDotWrapper}>
      <Animated.View style={[styles.onlineDotGlow, style]} />
      <View style={styles.onlineDot} />
    </View>
  );
};

const EmptyPulseIcon = ({ isSearch }: { isSearch: boolean }) => {
  const scale = useSharedValue(0.95);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.05, { duration: 2000 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.emptyIconBadge, style]}>
      <LinearGradient colors={['#e0e7ff', '#fae8ff']} style={StyleSheet.absoluteFillObject} />
      {isSearch ? <Search color="#6366f1" size={32} /> : <MessageSquare color="#6366f1" size={32} style={{ zIndex: 1 }} />}
    </Animated.View>
  );
};

const SkeletonRow = ({ index }: { index: number }) => {
  const translateX = useSharedValue(-200);
  useEffect(() => { translateX.value = withRepeat(withTiming(400, { duration: 1200 }), -1, false); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(index * 40)} style={styles.chatRow}>
       <View style={[styles.avatar, {backgroundColor: '#e2e8f0', overflow: 'hidden'}]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, style, { width: 200, left: -100 }]}>
            <LinearGradient colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
          </Animated.View>
       </View>
       <YStack flex={1} marginLeft="$3" space="$2" justifyContent="center">
         <View style={{width: '40%', height: 16, backgroundColor: '#e2e8f0', borderRadius: TOKENS.RADIUS.SM, overflow: 'hidden'}}>
            <Animated.View style={[StyleSheet.absoluteFillObject, style, { width: 200, left: -100 }]}>
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
            </Animated.View>
         </View>
         <View style={{width: '70%', height: 14, backgroundColor: '#f1f5f9', borderRadius: 7, overflow: 'hidden'}}>
            <Animated.View style={[StyleSheet.absoluteFillObject, style, { width: 200, left: -100 }]}>
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
            </Animated.View>
         </View>
       </YStack>
    </Animated.View>
  );
};

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const deleteChat = (id) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
         setConversations(prev => prev.filter(c => c.contact?.id !== id));
         setFiltered(prev => prev.filter(c => c.contact?.id !== id));
      } }
    ]);
  };

  const renderRightActions = (id, progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity style={styles.swipeActionBtn} onPress={() => {}}>
           <LinearGradient colors={TOKENS.GRADIENTS.GOLD} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
           <RNAnimated.View style={{ transform: [{ scale }], zIndex: 1 }}>
             <Archive color="#fff" size={22} />
           </RNAnimated.View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteChat(id)} style={[styles.swipeActionBtn, styles.swipeActionBtnRight]}>
           <LinearGradient colors={TOKENS.GRADIENTS.DANGER} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
           <RNAnimated.View style={{ transform: [{ scale }], zIndex: 1 }}>
             <Trash2 color="#fff" size={22} />
           </RNAnimated.View>
        </TouchableOpacity>
      </View>
    );
  };

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

  const searchScale = useSharedValue(1);
  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
    shadowColor: isSearchFocused ? '#005eb8' : '#64748b',
    shadowOpacity: isSearchFocused ? 0.2 : 0.08,
    shadowRadius: isSearchFocused ? 12 : 8,
    elevation: isSearchFocused ? 6 : 2,
    borderColor: isSearchFocused ? 'rgba(0, 94, 184, 0.3)' : '#e2e8f0',
  }));

  useEffect(() => {
    searchScale.value = withTiming(isSearchFocused ? 1.02 : 1, { duration: 200 });
  }, [isSearchFocused]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={TOKENS.GRADIENTS.SCREEN_BG} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>UniCom</Text>
          </View>
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: '#fff', borderColor: '#e2e8f0', shadowOpacity: 0.05 }]} />
          </View>
          <View style={{flex: 1}}>
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonRow key={i} index={i} />)}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={TOKENS.GRADIENTS.SCREEN_BG} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>UniCom</Text>
            <ScaleButton onPress={() => console.log('Edit pressed')} style={styles.headerIconBtnShadow}>
              <View style={styles.headerIconBtn}>
                <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
                <Edit color="#fff" size={20} style={{ zIndex: 1 }} />
              </View>
            </ScaleButton>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Animated.View style={[styles.searchBar, searchAnimatedStyle]}>
              <Search color={isSearchFocused ? "#005eb8" : "#94a3b8"} size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {search.length > 0 && (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} activeOpacity={0.6}>
                    <X color={TOKENS.COLORS.TEXT_SECONDARY} size={16} />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>
          </View>
        </Animated.View>

        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <EmptyPulseIcon isSearch={!!search} />
            <Text fontSize={22} fontWeight="800" color={TOKENS.COLORS.TEXT_PRIMARY} marginTop="$5">
              {search ? 'No results found' : 'No messages yet'}
            </Text>
            <Text fontSize={15} color={TOKENS.COLORS.TEXT_SECONDARY} marginTop="$2" textAlign="center" paddingHorizontal="$4" lineHeight={22}>
              {search ? `We couldn't find any chats matching "${search}"` : 'Your inbox is empty. Start a new conversation and experience seamless translation!'}
            </Text>
          </Animated.View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#005eb8" />}
            contentContainerStyle={{ paddingBottom: Math.max((insets?.bottom || 0) + 120, 140) }}
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
              const isUnread = unread > 0;

              return (
                <Animated.View key={conv.chatId || contact.id} entering={FadeInUp.delay(index * 60)}>
                  <Swipeable renderRightActions={(progress, dragX) => renderRightActions(contact.id, progress, dragX)} rightThreshold={40} overshootRight={false}>
                    <TouchableHighlight 
                      style={[styles.chatRow, isUnread && styles.chatRowUnread]}
                      onPress={() => router.push(`/chat/${contact.id}`)}
                      underlayColor="#e2e8f0"
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {/* Avatar */}
                        <View style={styles.avatarWrapper}>
                          {contact.avatar ? (
                            <Image source={{ uri: contact.avatar }} style={styles.avatar} />
                          ) : (
                            <View style={[styles.avatar, { backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' }]}>
                              <Text color="#fff" fontWeight="900" fontSize={20}>{initial}</Text>
                            </View>
                          )}
                          {isOnline && <PulseDot />}
                        </View>

                        {/* Content */}
                        <YStack flex={1} marginLeft="$3">
                          <XStack justifyContent="space-between" alignItems="center">
                            <Text fontWeight={isUnread ? '900' : '700'} fontSize={16} color={TOKENS.COLORS.TEXT_PRIMARY} numberOfLines={1} flex={1}>
                              {name}
                            </Text>
                            <Text fontSize={12} color={isUnread ? '#005eb8' : '#94a3b8'} fontWeight={isUnread ? '800' : '600'} marginLeft="$2">
                              {formatTime(lastMsg?.createdAt || '')}
                            </Text>
                          </XStack>
                          <XStack justifyContent="space-between" alignItems="center" marginTop={4}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              {getLastMessagePreview(lastMsg)}
                            </View>
                            {isUnread && (
                              <Animated.View key={unread} entering={FadeInDown.springify()} style={styles.unreadBadgeShadow}>
                                <LinearGradient colors={TOKENS.GRADIENTS.DANGER} start={{x:0, y:0}} end={{x:1, y:1}} style={[StyleSheet.absoluteFillObject, { borderRadius: TOKENS.RADIUS.MD }]} />
                                <Text color="#fff" fontSize={11} fontWeight="800" style={{ zIndex: 1 }}>{unread > 99 ? '99+' : unread}</Text>
                              </Animated.View>
                            )}
                          </XStack>
                        </YStack>
                      </View>
                    </TouchableHighlight>
                  </Swipeable>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  appTitle: {
    fontSize: 28, fontWeight: '900', color: '#005eb8', letterSpacing: -0.5,
    shadowColor: '#005eb8', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  headerIconBtnShadow: {
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, borderRadius: TOKENS.RADIUS.LG,
  },
  headerIconBtn: { width: 40, height: 40, borderRadius: TOKENS.RADIUS.LG, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  searchContainer: { marginHorizontal: 16, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    paddingHorizontal: 16, height: 46, borderRadius: 23, gap: 10,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '500', outlineStyle: 'none' } as any,
  clearBtn: { width: 24, height: 24, borderRadius: TOKENS.RADIUS.MD, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  chatRow: { 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, 
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: TOKENS.RADIUS.LG,
    ...TOKENS.SHADOWS.SUBTLE,
  },
  chatRowUnread: { backgroundColor: 'rgba(0, 94, 184, 0.035)' },
  avatarWrapper: { position: 'relative', width: 56, height: 56 },
  avatar: { width: 56, height: 56, borderRadius: TOKENS.RADIUS.XL, borderWidth: 2, borderColor: '#fff', ...TOKENS.SHADOWS.ELEVATED },
  onlineDotWrapper: { position: 'absolute', bottom: 1, right: 1, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  onlineDotGlow: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', opacity: 0.6 },
  msgText: { fontSize: 14, color: '#64748b', fontWeight: '500', flexShrink: 1 },
  chipBase: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeShadow: {
    minWidth: 24, height: 24, borderRadius: TOKENS.RADIUS.MD, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  swipeActionsContainer: { 
    flexDirection: 'row', width: 140, marginBottom: 10, marginRight: 16, 
    borderTopRightRadius: TOKENS.RADIUS.LG, borderBottomRightRadius: TOKENS.RADIUS.LG, overflow: 'hidden' 
  },
  swipeActionBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  swipeActionBtnRight: { borderTopRightRadius: TOKENS.RADIUS.LG, borderBottomRightRadius: TOKENS.RADIUS.LG },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: -40 },
  emptyIconBadge: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#6366f1', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
});
