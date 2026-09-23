// @ts-nocheck
import { GradientBackground } from '../../src/components/ThemeComponents';
import { TOKENS } from '../../src/theme/tokens';
import { useThemeContext } from '../../src/context/ThemeContext';
import React, {  useState, useEffect, useCallback , useMemo } from 'react';
import {  
  ScrollView, TextInput, TouchableOpacity, TouchableHighlight, View, Image,
  StyleSheet, RefreshControl, Platform, Alert, Animated as RNAnimated, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { YStack, XStack, Text } from 'tamagui';
import { Search, Edit, Archive, Trash2, MessageSquare, Image as ImageIcon, Mic, FileText, X, ArrowLeft } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useCallStore, useCall } from '../../src/context/CallContext';
import { decryptMessage } from '../../src/utils/cryptoUtils';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { api } from '../../src/services/api';
import Animated, { FadeInDown, FadeInUp, SlideInRight, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const getLastMessagePreview = (lastMessage: any, isDark?: boolean) => {
  if (!lastMessage) return <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', fontWeight: '500' }} numberOfLines={1}>No messages yet</Text>;
  if (lastMessage.mediaType === 'image') return (
    <XStack space="$1.5" alignItems="center">
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={10} color="#0284c7" /></View>
      <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', fontWeight: '500' }}>Photo</Text>
    </XStack>
  );
  if (lastMessage.mediaType === 'audio') return (
    <XStack space="$1.5" alignItems="center">
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#f3e8ff', alignItems: 'center', justifyContent: 'center' }}><Mic size={10} color="#9333ea" /></View>
      <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', fontWeight: '500' }}>Voice message</Text>
    </XStack>
  );
  if (lastMessage.mediaType === 'document') return (
    <XStack space="$1.5" alignItems="center">
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center' }}><FileText size={10} color="#ea580c" /></View>
      <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', fontWeight: '500' }}>Document</Text>
    </XStack>
  );
  return <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', fontWeight: '500' }} numberOfLines={1}>{lastMessage.text || 'Message'}</Text>;
};

// --- Animated Avatar Ring (reused from Calls) ---
const AnimatedAvatarRing = ({ children, status }: { children: React.ReactNode, status: 'online' | 'unread' | 'offline' }) => {
  const ringRotation = useSharedValue(0);
  
  useEffect(() => {
    ringRotation.value = 0; // Removed rotation
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }]
  }));

  const ringColors = status === 'online' 
    ? ['#06d6a0', '#38bdf8', '#06d6a0'] 
    : status === 'unread' 
      ? ['#f59e0b', '#ef4444', '#f59e0b'] 
      : ['#8b5cf6', '#c084fc', '#8b5cf6']; 

  return (
    <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 60, height: 60, borderRadius: 30 }, ringStyle]}>
        <LinearGradient
          colors={ringColors as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 60, height: 60, borderRadius: 30 }}
        />
      </Animated.View>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 50, height: 50, borderRadius: 25, overflow: 'hidden' }}>
          {children}
        </View>
      </View>
    </View>
  );
};

// --- Online Pulse Dot ---
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
    <View style={{ position: 'absolute', bottom: 1, right: 1, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', opacity: 0.6 }, style]} />
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' }} />
    </View>
  );
};

// --- Loading Skeleton ---
const SkeletonRow = ({ index }: { index: number }) => {
  const shimmerOpacity = useSharedValue(0.4);
  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }), 
      -1, true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmerOpacity.value }));
  return (
    <Animated.View style={[animatedStyle, { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' }]}>
      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(226,232,240,0.5)' }} />
      <YStack flex={1} marginLeft="$3" space="$2">
        <View style={{ width: 140, height: 16, borderRadius: 6, backgroundColor: 'rgba(226,232,240,0.5)' }} />
        <View style={{ width: '70%', height: 14, borderRadius: 7, backgroundColor: 'rgba(241,245,249,0.5)' }} />
      </YStack>
    </Animated.View>
  );
};

// --- Empty State ---
const EmptyPulseIcon = ({ isSearch }: { isSearch: boolean }) => {
  const scale = useSharedValue(0.95);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.05, { duration: 2000 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#6366f1', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: Platform.OS === 'web' ? 6 : 0 }]}>
      <LinearGradient colors={['#e0e7ff', '#fae8ff']} style={StyleSheet.absoluteFillObject} />
      {isSearch ? <Search color="#6366f1" size={32} /> : <MessageSquare color="#6366f1" size={32} style={{ zIndex: 1 }} />}
    </Animated.View>
  );
};

const FilterButton = ({ label, type, activeFilter, onSelect, gradientColors }: any) => {
  const { isDark } = useThemeContext();
  const isActive = activeFilter === type;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const inactiveBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';
  const inactiveBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)';
  const inactiveText = isDark ? '#94a3b8' : '#475569';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onSelect(type)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderColor: isActive ? gradientColors[0] : inactiveBorder,
            backgroundColor: isActive ? 'transparent' : inactiveBg,
          },
          isActive && {
            shadowColor: gradientColors[0],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: Platform.OS === 'web' ? 8 : 0,
          },
          animatedStyle
        ]}
      >
        {isActive && (
          <LinearGradient
            colors={gradientColors}
            start={{x:0,y:0}} end={{x:1,y:1}}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <Text style={{
          fontSize: 14,
          fontWeight: isActive ? '700' : '600',
          color: isActive ? '#ffffff' : inactiveText,
          zIndex: 2,
          letterSpacing: 0.3,
        }}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function MessagesScreen() {
  const { isDark } = useThemeContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useCallStore();
  const [conversations, setConversations] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Background floating particles
  const p1Y = useSharedValue(0);
  const p2Y = useSharedValue(0);
  const p3Y = useSharedValue(0);
  const p4Y = useSharedValue(0);
  const p5Y = useSharedValue(0);

  useEffect(() => {
    
  }, []);

  const p1Style = useAnimatedStyle(() => ({ transform: [{ translateY: p1Y.value }] }));
  const p2Style = useAnimatedStyle(() => ({ transform: [{ translateY: p2Y.value }] }));
  const p3Style = useAnimatedStyle(() => ({ transform: [{ translateY: p3Y.value }] }));
  const p4Style = useAnimatedStyle(() => ({ transform: [{ translateY: p4Y.value }] }));
  const p5Style = useAnimatedStyle(() => ({ transform: [{ translateY: p5Y.value }] }));

  const deleteChat = (id: string) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
         setConversations(prev => prev.filter(c => c.contact?.id !== id));
         
      } }
    ]);
  };

  const renderRightActions = (id: string, progress: any, dragX: any) => {
    return (
      <View style={{ flexDirection: 'row', width: 140, marginBottom: 12, marginRight: 16, borderTopRightRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' }}>
        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }} onPress={() => {
          setConversations(prev => prev.filter(c => c.contact?.id !== id));
          
          api.archiveChat(id).catch(console.error);
        }}>
           <LinearGradient colors={TOKENS.GRADIENTS.GOLD} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
           <View style={{ zIndex: 1, alignItems: 'center' }}>
             <Archive color="#fff" size={22} />
           </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteChat(id)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderTopRightRadius: 24, borderBottomRightRadius: 24 }}>
           <LinearGradient colors={TOKENS.GRADIENTS.DANGER} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
           <View style={{ zIndex: 1, alignItems: 'center' }}>
             <Trash2 color="#fff" size={22} />
           </View>
        </TouchableOpacity>
      </View>
    );
  };

  const loadConversations = async (isRefresh = false) => {
    if (!user?.id || !api.getToken()) return;
    if (isRefresh) setRefreshing(true);
    else if (conversations.length === 0) setLoading(true);
    try {
      const res = await api.getConversations();
      if (res.success && res.conversations) {
        let convs = res.conversations;
        if (user) {
           convs = await Promise.all(convs.map(async (c: any) => {
             if (c.lastMessage && c.contact) {
                const decrypted = await decryptMessage(c.lastMessage.text, user.id, c.contact.id);
                c.lastMessage.text = decrypted;
             }
             return c;
           }));
        }
        setConversations(convs);
        
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
    if (!socket) return;
    const handleMsg = () => loadConversations();
    socket.on('message:received', handleMsg);
    return () => { socket.off('message:received', handleMsg); };
  }, [socket]);

  // Filter logic
  const filtered = useMemo(() => {
    let result = conversations;
    
    if (filter === 'unread') {
      result = result.filter(c => (c.unreadCount || 0) > 0);
    } else if (filter === 'groups') {
      result = result.filter(c => c.isGroup);
    } else if (filter === 'archived') {
      result = result.filter(c => c.isArchived);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => 
        (c.contact?.name || '').toLowerCase().includes(q) || 
        (c.lastMessage?.text || '').toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [search, conversations, filter]);

  const onRefresh = () => loadConversations(true);

  const handleFilterChange = (newFilter: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    setFilter(newFilter);
  };

  const renderRow = (conv: any, index: number) => {
    const contact = conv.contact;
    if (!contact) return null;
    const name = contact.name || 'Unknown';
    const initial = name.charAt(0).toUpperCase();
    const avatarBg = getColor(name);
    const lastMsg = conv.lastMessage;
    const unread = conv.unreadCount || 0;
    const isOnline = contact.onlineStatus === 'online';
    const isUnread = unread > 0;

    const avatarStatus = isOnline ? 'online' : isUnread ? 'unread' : 'offline';

    return (
      <Animated.View key={conv.chatId || contact.id} entering={FadeInUp.duration(200)} style={[styles.cardContainer, isUnread && styles.cardContainerUnread]}>
        {/* Glassmorphic Gradient Background — theme-adaptive */}
        {!isUnread && (
          <LinearGradient 
            colors={isDark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.4)']} 
            start={{x:0, y:0}} end={{x:0, y:1}} style={StyleSheet.absoluteFillObject} />
        )}
        
        <Swipeable renderRightActions={(progress, dragX) => renderRightActions(contact.id, progress, dragX)} rightThreshold={40} overshootRight={false}>
          <TouchableHighlight
            style={styles.rowInner}
            onPress={() => router.push(`/chat/${contact.id}`)}
            underlayColor="rgba(255,255,255,0.05)"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Animated Avatar Ring */}
              <View style={{ position: 'relative' }}>
                <AnimatedAvatarRing status={avatarStatus}>
                  {contact.avatar ? (
                    <Image source={{ uri: contact.avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                  ) : (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Text color="#fff" fontWeight="900" fontSize={20}>{initial}</Text>
                    </View>
                  )}
                </AnimatedAvatarRing>
                {isOnline && <PulseDot />}
              </View>

              {/* Content */}
              <YStack flex={1} marginLeft="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight={isUnread ? '900' : '700'} fontSize={16} color={isDark ? (isUnread ? '#f1f5f9' : '#cbd5e1') : (isUnread ? '#0f172a' : '#334155')} numberOfLines={1} flex={1}>
                    {name}
                  </Text>
                  <Text fontSize={12} color={isUnread ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#64748b' : '#94a3b8')} fontWeight={isUnread ? '800' : '600'} marginLeft="$2">
                    {formatTime(lastMsg?.createdAt || '')}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between" alignItems="center" marginTop={4}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    {getLastMessagePreview(lastMsg, isDark)}
                  </View>
                  {isUnread && (
                    <Animated.View entering={FadeInDown.springify()} style={styles.unreadBadge}>
                      <LinearGradient colors={['#ef4444', '#dc2626']} start={{x:0, y:0}} end={{x:1, y:1}} style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]} />
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
  };

  const styles = useMemo(() => getStyles(isDark), [isDark]);

  return (
    <GradientBackground style={styles.container}>
      {/* Top Fixed Section (Search + Filters) */}
      <View style={{ paddingTop: insets.top + 10, zIndex: 10, paddingBottom: 10 }}>
        {/* Search Bar */}
        <XStack paddingHorizontal="$4" marginBottom="$4">
          <View style={[styles.searchContainer, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            borderColor: isSearchFocused ? (isDark ? '#38bdf8' : '#0ea5e9') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
            borderWidth: 1.5,
            shadowColor: isSearchFocused ? (isDark ? '#38bdf8' : '#0ea5e9') : (isDark ? '#000' : '#64748b'),
            shadowOffset: { width: 0, height: isSearchFocused ? 6 : 4 },
            shadowOpacity: isSearchFocused ? (isDark ? 0.3 : 0.2) : (isDark ? 0 : 0.1),
            shadowRadius: isSearchFocused ? 16 : 12,
            elevation: Platform.OS === 'web' ? (isDark ? 0 : 4) : 0,
          }]}>
            <Image source={require('../../assets/images/logo-icon-transparent.png')} style={{ width: 28, height: 28, marginLeft: 16 }} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#fff' : '#1e293b' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search chats..."
              placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 6 }}>
              <LinearGradient colors={['#38bdf8', '#818cf8']} style={styles.searchIconBtn}>
                {search.length > 0 ? <X color="#fff" size={18} /> : <Search color="#fff" size={18} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          <FilterButton label="All" type="all" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#0ea5e9', '#3b82f6']} />
          <FilterButton label="Unread" type="unread" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#f43f5e', '#ec4899']} />
          <FilterButton label="Groups" type="groups" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#10b981', '#14b8a6']} />
          <FilterButton label="Archived" type="archived" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#8b5cf6', '#6366f1']} />
        </ScrollView>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={{ paddingTop: 16 }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} index={i} />)}
        </View>
      ) : filtered.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: -40, zIndex: 5 }}>
          <EmptyPulseIcon isSearch={!!search} />
          <Text fontSize={22} fontWeight="800" color={isDark ? "#f1f5f9" : "#0f172a"} marginTop="$5">
            {search ? 'No results found' : filter === 'unread' ? 'All caught up!' : filter === 'groups' ? 'No groups yet' : filter === 'archived' ? 'No archived chats' : 'No messages yet'}
          </Text>
          <Text fontSize={15} color={isDark ? "#94a3b8" : "#64748b"} marginTop="$2" textAlign="center" paddingHorizontal="$4" lineHeight={22}>
            {search ? `We couldn't find any chats matching "${search}"` : 'Start a new conversation and experience seamless encrypted messaging!'}
          </Text>
        </Animated.View>
      ) : (
        <FlashList
  estimatedItemSize={80}
  data={filtered}
  keyExtractor={(item, index) => item.chatId || item.contact?.id || String(index)}
  renderItem={({ item, index }) => renderRow(item, index)}
  removeClippedSubviews={Platform.OS === 'android'}
  showsVerticalScrollIndicator={false}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
  contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}
  style={{ flex: 1, zIndex: 5 }}
/>
      )}


    </GradientBackground>
  );
}

function getStyles(isDark: boolean) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f0f4ff',
  },
  headerGradientAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#38bdf8',
    borderRadius: 3,
    opacity: 0.7,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  searchContainer: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  searchIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // ── THEME-ADAPTIVE CARD STYLES ──
  cardContainer: {
    marginBottom: 8,
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.7)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    overflow: 'hidden',
    shadowColor: isDark ? '#06b6d4' : '#818cf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.25 : 0.18,
    shadowRadius: 20,
    elevation: 0,
  },
  cardContainerUnread: {
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: isDark ? '#0284c7' : '#bae6fd',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'transparent',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: Platform.OS === 'web' ? 5 : 0,
  },
  particle: {
    position: 'absolute',
    borderRadius: 99,
    opacity: 0.5,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 20,
  },
  fabOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: Platform.OS === 'web' ? 10 : 0,
  },
  fabInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}); }
