import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text as RNText, StyleSheet, RefreshControl, Dimensions, Alert, Platform, KeyboardAvoidingView, ScrollView, Modal, Pressable } from 'react-native';
import { YStack, XStack, Avatar } from 'tamagui';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Sparkles, XCircle, Trash2, Grid3x3, X, FileText } from 'lucide-react-native';
import Animated, { FadeInRight, FadeOutRight, FadeInUp, SlideInDown, SlideOutDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, interpolate, Extrapolate, runOnJS, withSequence, Easing } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Color palette for contact avatars
const AVATAR_PALETTE = [
  { bg: '#3b82f6', ring: '#93c5fd' }, // Blue
  { bg: '#8b5cf6', ring: '#c4b5fd' }, // Purple
  { bg: '#0d9488', ring: '#5eead4' }, // Teal
  { bg: '#f43f5e', ring: '#fda4af' }, // Rose / Coral
  { bg: '#f59e0b', ring: '#fcd34d' }, // Amber
  { bg: '#0284c7', ring: '#7dd3fc' }, // Sky
  { bg: '#6366f1', ring: '#a5b4fc' }, // Indigo
  { bg: '#10b981', ring: '#6ee7b7' }, // Emerald
];

const getAvatarTheme = (name: string) => {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

// --- Small Components for Polish ---

const PulseBadge = ({ count }: { count: number }) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      pulseScale.value = withRepeat(withTiming(1.3, { duration: 1000 }), -1, true);
      pulseOpacity.value = withRepeat(withTiming(0.4, { duration: 1000 }), -1, true);
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 1;
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (count === 0) return null;

  return (
    <View style={styles.missedBadgeContainer}>
      <Animated.View style={[styles.missedBadgeGlow, animatedStyle]} />
      <View style={styles.missedBadge}>
        <RNText style={styles.missedBadgeText}>{count}</RNText>
      </View>
    </View>
  );
};

const LoadingSkeleton = () => {
  const shimmerOpacity = useSharedValue(0.4);
  
  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }), 
      -1, 
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmerOpacity.value }));

  return (
    <YStack paddingHorizontal="$4" paddingTop="$4" space="$4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Animated.View key={i} style={[animatedStyle, { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }]}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#cbd5e1' }} />
          <YStack flex={1} marginLeft="$3" space="$2">
            <View style={{ width: 140, height: 16, borderRadius: 8, backgroundColor: '#cbd5e1' }} />
            <View style={{ width: 90, height: 12, borderRadius: 6, backgroundColor: '#e2e8f0' }} />
          </YStack>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0' }} />
        </Animated.View>
      ))}
    </YStack>
  );
};

// --- Main Screen ---

export default function CallsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [missedCount, setMissedCount] = useState(0);
  const [selectedSummary, setSelectedSummary] = useState<any>(null);

  // FAB Animation
  const fabGlowRotate = useSharedValue(0);
  const fabScale = useSharedValue(1);

  useEffect(() => {
    fetchCallLogs();
    checkMissedCalls();
    
    // Start FAB glow rotation
    fabGlowRotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const fabGlowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabGlowRotate.value}deg` }]
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }]
  }));

  const handleFabPressIn = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>{});
    fabScale.value = withSpring(0.9);
  };
  const handleFabPressOut = () => {
    fabScale.value = withSpring(1);
    router.push('/(main)/contacts'); // Assuming contacts acts as dialpad/new call
  };

  const toggleSearch = () => {
    if (!isSearching) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const fetchCallLogs = async () => {
    try {
      const res = await api.getCallHistory();
      if (res.success) {
        setLogs(res.calls || res.history || []);
      }
    } catch (e) {
      console.warn("Failed to fetch call logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCallLogs();
  };

  const checkMissedCalls = async () => {
    try {
      const stored = await AsyncStorage.getItem("@call_history_last_checked");
      const lastChecked = stored ? new Date(stored) : new Date(0);
      let newMissed = 0;
      
      const res = await api.getCallHistory();
      const historyList = res.calls || res.history || [];
      if (res.success && historyList) {
        historyList.forEach((log: any) => {
          if (log.status === "missed" && log.direction === "incoming") {
            const logDate = new Date(log.createdAt);
            if (logDate > lastChecked) {
              newMissed++;
            }
          }
        });
        setMissedCount(newMissed);
      }
    } catch (e) {}
  };

  const markMissedAsSeen = async () => {
    if (missedCount > 0) {
      await AsyncStorage.setItem("@call_history_last_checked", new Date().toISOString());
      setMissedCount(0);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(()=>{});
    setFilter(newFilter);
    if (newFilter === 'missed') {
      markMissedAsSeen();
    }
  };

  const handleDeleteCall = async (callId: string) => {
    try {
      setLogs(prev => prev.filter(l => l.id !== callId));
      await api.deleteCallLog(callId);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not delete call log");
      fetchCallLogs(); // restore on fail
    }
  };

  const renderRightActions = (progress: any, dragX: any, callId: string) => {
    const scale = dragX.interpolate({
      inputRange: [-80, -40, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });
    
    return (
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity style={styles.deleteAction} onPress={() => handleDeleteCall(callId)}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Trash2 color="#fff" size={24} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  // Filtering
  const filteredLogs = (logs || []).filter(log => {
    const isMissed = log.status === 'missed' && !log.isOutgoing;
    const isIncoming = !log.isOutgoing && log.status !== 'missed';
    const isOutgoing = log.isOutgoing;

    if (filter === 'missed' && !isMissed) return false;
    if (filter === 'incoming' && !isIncoming) return false;
    if (filter === 'outgoing' && !isOutgoing) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const peerName = (log.peer?.name || "Unknown").toLowerCase();
      const peerPhone = (log.peer?.phone || "").toLowerCase();
      if (!peerName.includes(q) && !peerPhone.includes(q)) return false;
    }
    return true;
  });

  const renderRow = (log: any, index: number, totalInGroup: number) => {
    const isMissed = log.status === 'missed' && !log.isOutgoing;
    const isIncoming = !log.isOutgoing && log.status !== 'missed';
    
    const date = new Date(log.createdAt);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let Icon = PhoneOutgoing;
    let iconColor = "#0284c7";
    let iconBg = "#e0f2fe";
    if (isMissed) {
      Icon = PhoneMissed;
      iconColor = "#ef4444";
      iconBg = "#fee2e2";
    } else if (isIncoming) {
      Icon = PhoneIncoming;
      iconColor = "#10b981";
      iconBg = "#d1fae5";
    }

    const peerName = log.peer?.name || log.peer?.phone || "Unknown";
    const initial = peerName.trim().charAt(0).toUpperCase() || 'U';
    const avatarTheme = getAvatarTheme(peerName);
    const hasCustomAvatar = !!log.peer?.avatar && !log.peer.avatar.includes('ui-avatars.com');

    const isFirst = index === 0;
    const isLast = index === totalInGroup - 1;

    return (
      <View style={[
        styles.logRowWrapper, 
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        isMissed && styles.logRowMissed
      ]}>
        <XStack flex={1} alignItems="center" space="$3">
          {/* Avatar with initial or real photo */}
          <View style={styles.avatarWrapper}>
            {hasCustomAvatar ? (
              <Image 
                source={{ uri: log.peer.avatar }} 
                style={[styles.avatarImage, { borderColor: avatarTheme.ring }]} 
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: avatarTheme.bg, borderColor: avatarTheme.ring }]}>
                <RNText style={styles.avatarInitial}>{initial}</RNText>
              </View>
            )}
            <View style={[styles.callBadge, { backgroundColor: iconBg, borderColor: '#ffffff' }]}>
              <Icon size={11} color={iconColor} strokeWidth={2.5} />
            </View>
          </View>
          
          <YStack flex={1}>
            <XStack alignItems="center" space="$2">
              <RNText style={[styles.peerName, isMissed && styles.peerNameMissed]} numberOfLines={1}>
                {peerName}
              </RNText>
              {log.aiSummary && (
                <View style={styles.aiBadge}>
                  <LinearGradient 
                    colors={['#10b981', '#059669']} 
                    start={{x:0,y:0}} 
                    end={{x:1,y:1}} 
                    style={StyleSheet.absoluteFillObject} 
                  />
                  <Sparkles size={10} color="#ffffff" style={{ marginRight: 3 }} />
                  <RNText style={styles.aiBadgeText}>AI</RNText>
                </View>
              )}
            </XStack>
            <XStack alignItems="center" space="$1.5" marginTop={3}>
              {log.type === "video" ? <Video size={13} color="#64748b" /> : <Phone size={13} color="#64748b" />}
              <RNText style={styles.timeText}>{timeStr}</RNText>
              {log.durationSeconds > 0 && (
                <RNText style={styles.durationText}>
                  • {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
                </RNText>
              )}
            </XStack>
          </YStack>
        </XStack>

        <XStack space="$2.5" alignItems="center">
          {log.aiSummary && (
            <TouchableOpacity 
              style={styles.actionBtnShadowAi}
              onPress={() => setSelectedSummary(log)}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#10b981', '#059669']} 
                start={{x:0,y:0}} 
                end={{x:1,y:1}} 
                style={styles.actionBtn}
              >
                <Sparkles size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionBtnShadow}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
              router.push({ pathname: '/(main)/call', params: { peerId: log.peer?.id || log.peer?.phone, isVideo: (log.type === 'video').toString(), isIncoming: 'false' } });
            }}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={['#005eb8', '#6366f1']} 
              start={{x:0,y:0}} 
              end={{x:1,y:1}} 
              style={styles.actionBtn}
            >
              {log.type === 'video' ? <Video size={16} color="#fff" strokeWidth={2.2} /> : <Phone size={16} color="#fff" strokeWidth={2.2} />}
            </LinearGradient>
          </TouchableOpacity>
        </XStack>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient - richer presence at top fading to clean soft surface */}
      <LinearGradient
        colors={['#dbeafe', '#eef2ff', '#f8fafc']}
        locations={[0, 0.28, 0.7]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Decorative Blur Blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) }]}>
        {!isSearching ? (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight} style={styles.headerContent}>
            <XStack alignItems="center" space="$2.5">
              <View style={styles.logoCircle}>
                <Image source={require('../../assets/images/logo-icon-transparent.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
              </View>
              <RNText style={styles.appTitle}>UniCom</RNText>
            </XStack>
            <TouchableOpacity style={styles.searchBtnShadow} onPress={toggleSearch} activeOpacity={0.85}>
              <LinearGradient 
                colors={['#005eb8', '#6366f1']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchBtn}
              >
                <Search color="#ffffff" size={19} strokeWidth={2.2} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight} style={[styles.headerContent, { width: '100%' }]}>
            <View style={styles.searchBar}>
              <Search color="#64748b" size={18} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search names or numbers..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <XCircle color="#94a3b8" size={18} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={toggleSearch} style={{ marginLeft: 12 }}>
              <RNText style={styles.cancelText}>Cancel</RNText>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Filter Pills */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {['all', 'missed', 'incoming', 'outgoing'].map((f) => {
            const isActive = filter === f;
            const isMissedFilter = f === 'missed';
            return (
              <TouchableOpacity 
                key={f} 
                activeOpacity={0.85}
                onPress={() => handleFilterChange(f)} 
                style={[
                  styles.filterPill, 
                  isActive ? (isMissedFilter ? styles.filterPillActiveMissed : styles.filterPillActive) : styles.filterPillInactive
                ]}
              >
                {isActive && (
                  <LinearGradient
                    colors={isMissedFilter ? ['#ef4444', '#f43f5e'] : ['#005eb8', '#6366f1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                  />
                )}
                <RNText style={[styles.filterText, isActive && styles.filterTextActive, !isActive && isMissedFilter && missedCount > 0 && { color: '#ef4444' }]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </RNText>
                {isMissedFilter && <PulseBadge count={missedCount} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Call Log Scroll View */}
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 120, 140) }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#005eb8" />}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : filteredLogs.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(600).delay(200)}>
            <YStack alignItems="center" justifyContent="center" marginTop="$10" space="$4">
              <View style={styles.emptyIconContainer}>
                <LinearGradient colors={['#dbeafe', '#e0e7ff']} style={StyleSheet.absoluteFillObject} />
                <PhoneMissed color="#6366f1" size={34} strokeWidth={2} />
              </View>
              <YStack alignItems="center" space="$1">
                <RNText style={styles.emptyTitle}>No calls found</RNText>
                <RNText style={styles.emptySub}>Your call history will appear here</RNText>
              </YStack>
            </YStack>
          </Animated.View>
        ) : (
          (() => {
            const groups: { [key: string]: any[] } = { Today: [], Yesterday: [], 'This Week': [], 'Older': [] };
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
            const thisWeek = new Date(today); thisWeek.setDate(thisWeek.getDate() - 7);
            
            filteredLogs.forEach(log => {
              const d = new Date(log.createdAt);
              if (d >= today) groups.Today.push(log);
              else if (d >= yesterday) groups.Yesterday.push(log);
              else if (d >= thisWeek) groups['This Week'].push(log);
              else groups.Older.push(log);
            });

            return Object.entries(groups).filter(([_, items]) => items.length > 0).map(([groupName, groupLogs], groupIndex) => (
              <View key={groupName} style={styles.groupCardWrapper}>
                {/* Group Header Label */}
                <XStack alignItems="center" marginBottom={12} marginLeft={4}>
                  <View style={styles.sectionDot} />
                  <RNText style={styles.sectionTitle}>{groupName}</RNText>
                </XStack>
                
                {/* Group Card with real soft drop shadow */}
                <View style={styles.cardContainer}>
                  {groupLogs.map((log: any, index: number) => (
                    <Animated.View key={log.id} entering={FadeInUp.delay((groupIndex * 10 + index) * 35).springify()}>
                      {Platform.OS === 'web' ? (
                        renderRow(log, index, groupLogs.length)
                      ) : (
                        <Swipeable renderRightActions={(prog, drag) => renderRightActions(prog, drag, log.id)}>
                          {renderRow(log, index, groupLogs.length)}
                        </Swipeable>
                      )}
                    </Animated.View>
                  ))}
                </View>
              </View>
            ));
          })()
        )}
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fabContainer, { bottom: Math.max(insets.bottom + 115, 125) }]}>
        <Animated.View style={[styles.fabGlow, fabGlowStyle]} />
        <AnimatedPressable 
          style={fabAnimatedStyle}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
        >
          <LinearGradient colors={['#005eb8', '#6366f1']} style={styles.fab} start={{x:0, y:0}} end={{x:1, y:1}}>
            <Grid3x3 color="#fff" size={24} strokeWidth={2.3} />
          </LinearGradient>
        </AnimatedPressable>
      </View>

      {/* AI Summary Bottom Sheet Modal */}
      <Modal visible={!!selectedSummary} transparent animationType="fade" onRequestClose={() => setSelectedSummary(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedSummary(null)} activeOpacity={1} />
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom + 20, 24) }]}>
            
            <LinearGradient colors={['#eef2ff', '#ffffff']} locations={[0, 0.35]} style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]} />
            
            <View style={styles.sheetHandle} />
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4" paddingHorizontal="$4" zIndex={2}>
              <XStack space="$3" alignItems="center">
                <View style={styles.sheetSparkleBadge}>
                  <LinearGradient colors={['#10b981', '#059669']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
                  <Sparkles color="#fff" size={20} />
                </View>
                <YStack>
                  <RNText style={styles.sheetTitle}>AI Call Summary</RNText>
                  <RNText style={styles.sheetSubtitle}>Call with {selectedSummary?.peer?.name || 'Contact'}</RNText>
                </YStack>
              </XStack>
              <TouchableOpacity onPress={() => setSelectedSummary(null)} style={styles.sheetCloseIconBtn}>
                <X color="#64748b" size={20} strokeWidth={2.5} />
              </TouchableOpacity>
            </XStack>
            
            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.45, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
              {selectedSummary?.aiSummary ? (
                <View style={styles.summaryBox}>
                  <RNText style={styles.summaryText}>{selectedSummary.aiSummary}</RNText>
                </View>
              ) : (
                <YStack alignItems="center" paddingVertical="$6" space="$3">
                  <FileText color="#cbd5e1" size={44} style={{ marginBottom: 8 }} />
                  <RNText style={styles.emptySub}>No AI Summary was generated for this call.</RNText>
                </YStack>
              )}
            </ScrollView>
            
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setSelectedSummary(null)}>
              <RNText style={styles.sheetCloseBtnText}>Done</RNText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 360,
    height: 360,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    top: -80,
    right: -80,
  },
  blob2: {
    width: 280,
    height: 280,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    bottom: 120,
    left: -60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  searchBtnShadow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    outlineStyle: 'none',
  } as any,
  cancelText: {
    color: '#005eb8',
    fontWeight: '700',
    fontSize: 15,
  },
  filterWrapper: {
    marginBottom: 8,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  filterPillInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  filterPillActive: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  filterPillActiveMissed: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  filterText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  filterTextActive: {
    color: '#ffffff',
    zIndex: 1,
  },
  missedBadgeContainer: {
    marginLeft: 8,
    position: 'relative',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  missedBadgeGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
  },
  missedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  missedBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  groupCardWrapper: {
    marginBottom: 20,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#005eb8',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  logRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowFirst: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  rowLast: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderBottomWidth: 0,
  },
  logRowMissed: {
    backgroundColor: 'rgba(239, 68, 68, 0.035)',
  },
  avatarWrapper: {
    position: 'relative',
    width: 46,
    height: 46,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  callBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  peerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: 160,
  },
  peerNameMissed: {
    color: '#ef4444',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  timeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  durationText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actionBtnShadow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnShadowAi: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionContainer: {
    width: 80,
    height: '100%',
    backgroundColor: '#ef4444',
  },
  deleteAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 14,
    color: '#64748b',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  fabGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
    filter: 'blur(14px)' as any,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
    zIndex: 2,
  },
  sheetSparkleBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  sheetCloseIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    fontWeight: '400',
  },
  sheetCloseBtn: {
    marginTop: 20,
    marginHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#005eb8',
    shadowColor: '#005eb8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  sheetCloseBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});