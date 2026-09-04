import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Platform, TouchableOpacity, ScrollView, View, StyleSheet, TextInput, ActivityIndicator, Alert, Modal, Dimensions, RefreshControl , Image } from 'react-native';
import { YStack, XStack, Text, Avatar } from 'tamagui';
import { PhoneOutgoing, PhoneIncoming, PhoneMissed, Search, Phone, X, Trash2, Sparkles, XCircle } from 'lucide-react-native';
import { GradientBackground, GlassCard } from '../../src/components/ThemeComponents';
import { useAuth } from '../../src/context/AuthContext';
import { useCall } from '../../src/context/CallContext';
import { api } from '../../src/services/api';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInRight, FadeOutRight, SlideInDown, SlideOutDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FILTERS = ['All', 'Missed', 'Incoming', 'Outgoing'];
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const getAvatarColor = (name: string) => {
  if (!name) return '#cbd5e1';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatCallTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === now.toDateString()) return timeStr;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
  if (date >= startOfWeek) {
    const dayName = date.toLocaleDateString([], { weekday: 'long' });
    return `${dayName}, ${timeStr}`;
  }
  const shortDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${shortDate}, ${timeStr}`;
};

const AnimatedFAB = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.fabContainer, animatedStyle]}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => { Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }} style={styles.fab}>
        <Phone color="#fff" size={24} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Corner badge for avatar indicating call type
const CallTypeBadge = ({ type }: { type: 'incoming' | 'outgoing' | 'missed' }) => {
  const bg = type === 'missed' ? '#ef4444' : type === 'incoming' ? '#10b981' : '#005eb8';
  const Icon = type === 'missed' ? PhoneMissed : type === 'incoming' ? PhoneIncoming : PhoneOutgoing;
  return (
    <View style={[styles.callBadge, { backgroundColor: bg }]}>
      <Icon color="#fff" size={9} strokeWidth={2.5} />
    </View>
  );
};

export default function CallsScreen() {
  const { user } = useAuth();
  const { startVoiceCall } = useCall();
  const router = useRouter();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastMissedView, setLastMissedView] = useState<number>(0);
  
  useEffect(() => {
    const loadLastView = async () => {
      try {
        const val = await AsyncStorage.getItem('last_missed_view');
        if (val) setLastMissedView(parseInt(val, 10));
      } catch (e) {}
    };
    loadLastView();
  }, []);

  useEffect(() => {
    if (activeFilter === 'Missed') {
      const now = Date.now();
      setLastMissedView(now);
      AsyncStorage.setItem('last_missed_view', now.toString()).catch(() => {});
    }
  }, [activeFilter]);

  
  const [calls, setCalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<any>(null);

  const fetchCalls = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await api.getCallHistory();
      if (res.success && res.calls) setCalls(res.calls);
    } catch (err) {
      console.error('Failed to fetch call history:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCalls();
    }, [])
  );

  const handleCallUser = async (peer: any) => {
    if (!peer) return;
    try {
      const res = await startVoiceCall(peer);
      if (res && res.call && res.call.id) {
        console.log('Navigating to call:', res.call.id);
        router.push(`/call/${res.call.id}`);
      } else {
        console.error('Call initiated but no call ID returned:', res);
      }
    } catch (err) {
      console.error('Failed to call user:', err);
      Alert.alert('Error', 'Could not start call. Please try again.');
    }
  };

  const handleDeleteCall = async (callId: string) => {
    try {
      setCalls(calls.filter(c => c.id !== callId));
      await api.request(`/calls/${callId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete call log:', err);
    }
  };

  const filteredLogs = calls.filter((log: any) => {
    const isMissed = log.status !== 'completed' && log.durationSeconds === 0;
    const type = isMissed ? 'missed' : log.isOutgoing ? 'outgoing' : 'incoming';
    if (activeFilter !== 'All' && type !== activeFilter.toLowerCase()) return false;
    if (searchQuery && log.peer) {
      const nameMatch = log.peer.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const phoneMatch = log.peer.phone?.includes(searchQuery);
      if (!nameMatch && !phoneMatch) return false;
    }
    return true;
  });

  const groupedLogs = [];
  const groupedMap = new Map();
  for (const log of filteredLogs) {
     const peerId = log.peer?.id;
     if (!peerId) continue;
     if (!groupedMap.has(peerId)) {
       const clone = { ...log, callCount: 1 };
       groupedMap.set(peerId, clone);
       groupedLogs.push(clone);
     } else {
       groupedMap.get(peerId).callCount += 1;
     }
  }

  const missedCount = calls.filter(l => l.status !== 'completed' && l.durationSeconds === 0 && new Date(l.createdAt).getTime() > lastMissedView).length;

  const renderRightActions = (callId: string) => (
    <TouchableOpacity 
      style={styles.deleteAction} 
      onPress={() => {
        Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleDeleteCall(callId);
      }}
    >
      <Trash2 color="#fff" size={24} />
    </TouchableOpacity>
  );

  const renderRow = (log: any, index: number, total: number) => {
    const isMissed = log.status !== 'completed' && log.durationSeconds === 0;
    const type: 'missed' | 'incoming' | 'outgoing' = isMissed ? 'missed' : log.isOutgoing ? 'outgoing' : 'incoming';
    const name = log.peer?.name || 'Unknown Caller';
    const initial = name.charAt(0).toUpperCase();
    const avatarBg = getAvatarColor(name);
    const nameColor = type === 'missed' ? '#ef4444' : '#0f172a';

    return (
      <View key={log.id} style={[styles.logRow, index !== total - 1 && styles.logBorder]}>
        {/* Avatar with corner badge */}
        <TouchableOpacity
          onPress={(e) => { if (Platform.OS === 'web') (e as any).stopPropagation(); log.peer?.id && router.push(`/profile/${log.peer.id}`); }}
          style={styles.avatarWrapper}
        >
          <Avatar circular size={48} backgroundColor={avatarBg}>
            {log.peer?.avatar ? <Avatar.Image src={log.peer.avatar} /> : <Text color="#fff" fontWeight="bold" fontSize={20}>{initial}</Text>}
          </Avatar>
          <CallTypeBadge type={type} />
        </TouchableOpacity>

        {/* Name + Time */}
        <TouchableOpacity
          style={{ flex: 1, marginLeft: 14 }}
          activeOpacity={0.7}
          onPress={() => { log.peer?.id && router.push(`/call-info/${log.peer.id}`); }}
          {...(Platform.OS === 'web' ? { onClick: (e: any) => { e.stopPropagation(); log.peer?.id && router.push(`/call-info/${log.peer.id}`); } } : {})}
        >
          <XStack alignItems="center" space="$1" marginBottom={3}>
            <Text fontWeight="600" fontSize={16} color={nameColor} numberOfLines={1} flex={1}>{name}</Text>
            {log.isTranslated && (
              <View style={styles.aiBadge}>
                <Text color="#059669" fontSize={9} fontWeight="900" letterSpacing={0.5}>AI</Text>
              </View>
            )}
          </XStack>
          <Text color="#94a3b8" fontSize={13} fontWeight="400">{formatCallTime(log.createdAt)}</Text>
        </TouchableOpacity>

        {log.isTranslated && (
          <TouchableOpacity
            style={[styles.callButton, { backgroundColor: '#ecfdf5', marginRight: 8 }]}
            onPress={(e) => { if (Platform.OS === 'web') (e as any).stopPropagation(); setSelectedSummary(log); }}
          >
            <Sparkles color="#059669" size={18} />
          </TouchableOpacity>
        )}
        {/* Quick Call Button */}
        <TouchableOpacity
          style={styles.callButton}
          onPress={(e) => { if (Platform.OS === 'web') (e as any).stopPropagation(); handleCallUser(log.peer); }}
        >
          <Phone color="#005eb8" size={18} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <GradientBackground paddingHorizontal="$0" paddingTop="$10" style={{ flex: 1 }}>
      {/* Header */}
      <XStack paddingHorizontal="$4" justifyContent="space-between" alignItems="center" marginBottom="$4">
        {isSearchActive ? (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.searchBar}>
              <Search color="#64748b" size={18} />
              <TextInput autoFocus style={styles.searchInput} placeholder="Search calls..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
              <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(''); Platform.OS !== 'web' && Haptics.impactAsync(); }}>
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInRight} style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={require('../../assets/images/logo-icon-transparent.png')} style={{ width: 32, height: 32, resizeMode: 'contain', marginRight: 8 }} />
                <Text fontSize={28} fontWeight="900" color="#005eb8" letterSpacing={-0.5}>UniCom</Text>
              </View>
            <TouchableOpacity onPress={() => setIsSearchActive(true)}>
              <View style={styles.iconButton}><Search color="#005eb8" size={20} /></View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </XStack>

      {/* Segmented Filters */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((filter, index) => {
            const isActive = activeFilter === filter;
            const showBadge = filter === 'Missed' && missedCount > 0 && activeFilter !== 'Missed';
            return (
              <TouchableOpacity key={filter} activeOpacity={0.7} onPress={() => { setActiveFilter(filter); Platform.OS !== 'web' && Haptics.selectionAsync(); }}>
                <Animated.View entering={FadeInUp.delay(index * 50)} style={[styles.filterPill, isActive && styles.filterPillActive]}>
                  <XStack alignItems="center" space="$1">
                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter}</Text>
                    {showBadge && (
                      <View style={[styles.missedBadge, isActive && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                        <Text color="#fff" fontSize={10} fontWeight="700">{missedCount > 9 ? '9+' : missedCount}</Text>
                      </View>
                    )}
                  </XStack>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Call Logs */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCalls(true)} tintColor='#005eb8' />}>
        {isLoading ? (
          <YStack alignItems="center" justifyContent="center" marginTop="$10"><ActivityIndicator size="large" color="#005eb8" /></YStack>
        ) : groupedLogs.length === 0 ? (
          <Animated.View entering={FadeInUp}>
            <YStack alignItems="center" justifyContent="center" marginTop="$10" space="$3">
              <View style={styles.emptyIcon}>
                <PhoneMissed color="#94a3b8" size={32} />
              </View>
              <Text color="#64748b" fontSize={17} fontWeight="600">No calls found</Text>
              <Text color="#94a3b8" fontSize={14} textAlign="center">Your call history will appear here</Text>
            </YStack>
          </Animated.View>
        ) : (
          (() => {
            const groups: { [key: string]: any[] } = { Today: [], Yesterday: [], 'This Week': [], 'Older': [] };
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
            const thisWeek = new Date(today); thisWeek.setDate(thisWeek.getDate() - 7);
            
            groupedLogs.forEach(log => {
              const d = new Date(log.createdAt);
              if (d >= today) groups.Today.push(log);
              else if (d >= yesterday) groups.Yesterday.push(log);
              else if (d >= thisWeek) groups['This Week'].push(log);
              else groups.Older.push(log);
            });

            return Object.entries(groups).filter(([_, items]) => items.length > 0).map(([groupName, groupLogs], groupIndex) => (
              <YStack key={groupName} marginBottom="$4">
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginLeft: 16 }}>
                  {groupName}
                </Text>
                <GlassCard padding="$0" overflow="hidden" borderRadius={20}>
                  {groupLogs.map((log: any, index: number) => (
                    <Animated.View key={log.id} entering={FadeInUp.delay((groupIndex * 10 + index) * 40).springify()}>
                      {Platform.OS === 'web' ? (
                        renderRow(log, index, groupLogs.length)
                      ) : (
                        <Swipeable renderRightActions={() => renderRightActions(log.id)}>
                          {renderRow(log, index, groupLogs.length)}
                        </Swipeable>
                      )}
                    </Animated.View>
                  ))}
                </GlassCard>
              </YStack>
            ));
          })()
        )}
      </ScrollView>

      {/* AI Summary Modal */}
      <Modal visible={!!selectedSummary} transparent animationType="fade" onRequestClose={() => setSelectedSummary(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedSummary(null)} />
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <XStack space="$2" alignItems="center">
                <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: 8, borderRadius: 12 }}>
                  <Sparkles color="#8b5cf6" size={24} />
                </View>
                <YStack>
                  <Text fontSize={20} fontWeight="bold" color="#1e293b">AI Summary</Text>
                  <Text fontSize={12} color="#64748b">Call with {selectedSummary?.peer?.name}</Text>
                </YStack>
              </XStack>
              <TouchableOpacity onPress={() => setSelectedSummary(null)}>
                <XCircle color="#cbd5e1" size={28} />
              </TouchableOpacity>
            </XStack>
            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.5 }} showsVerticalScrollIndicator={false}>
              {selectedSummary?.aiSummary ? (
                <Text fontSize={15} color="#475569" lineHeight={24}>{selectedSummary.aiSummary}</Text>
              ) : (
                <YStack alignItems="center" paddingVertical="$6" space="$3">
                  <Text color="#94a3b8" fontSize={16} textAlign="center">No AI Summary was generated for this call.</Text>
                </YStack>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSummary(null)}>
              <Text color="#fff" fontWeight="bold" fontSize={16}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>


    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, height: 44, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#333', outlineStyle: 'none' } as any,
  iconButton: { backgroundColor: 'rgba(0, 94, 184, 0.1)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  filterPillActive: { backgroundColor: '#005eb8', borderColor: '#005eb8' },
  filterText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  filterTextActive: { color: '#fff' },
  missedBadge: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, justifyContent: 'space-between', backgroundColor: '#fff', minHeight: 72 },
  logBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarWrapper: { position: 'relative', width: 48, height: 48 },
  callBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff', zIndex: 1 },
  aiBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#d1fae5' },
  callButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f0f6ff', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  fabContainer: { position: 'absolute', bottom: 105, right: 24, zIndex: 10 },
  fab: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#005eb8', alignItems: 'center', justifyContent: 'center', shadowColor: '#005eb8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  deleteAction: { backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeButton: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 24 }
});



export function ErrorBoundary({ error, retry }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: 'red', fontSize: 18, marginBottom: 10 }}>Calls Screen Error</Text>
      <Text>{error?.message}</Text>
      <TouchableOpacity onPress={retry} style={{ marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 8 }}>
        <Text style={{ color: 'white' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}