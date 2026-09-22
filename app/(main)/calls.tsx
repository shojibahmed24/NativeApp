import { GradientBackground } from '../../src/components/ThemeComponents';
import { TOKENS } from '../../src/theme/tokens';
import { useThemeContext } from '../../src/context/ThemeContext';
import React, {  useState, useEffect, useCallback , useMemo } from 'react';
import {  View, TextInput, TouchableOpacity, Text as RNText, StyleSheet, RefreshControl, Dimensions, Alert, Platform, KeyboardAvoidingView, ScrollView, Modal, Pressable, Image, Animated as RNAnimated  } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { YStack, XStack } from 'tamagui';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Sparkles, XCircle, Trash2, ArrowLeft, MessageSquare, ArrowUpRight, ArrowDownLeft, X, FileText } from 'lucide-react-native';
import Animated, { FadeInRight, FadeInDown, FadeOutRight, FadeInUp, SlideInRight, SlideInDown, SlideOutDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, interpolate, Extrapolate, runOnJS, withSequence, Easing } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useCall } from '../../src/context/CallContext';
import { api } from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Color palette for contact avatars
const AVATAR_PALETTE = [
  { bg: '#3b82f6', ring: '#93c5fd' },
  { bg: '#8b5cf6', ring: '#c4b5fd' },
  { bg: '#0d9488', ring: '#5eead4' },
  { bg: '#f43f5e', ring: '#fda4af' },
  { bg: '#f59e0b', ring: '#fcd34d' },
  { bg: '#0284c7', ring: '#7dd3fc' },
  { bg: '#6366f1', ring: '#a5b4fc' },
  { bg: '#10b981', ring: '#6ee7b7' },
];

const getAvatarTheme = (name: string) => {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

// --- Animated Avatar Ring ---
const AnimatedAvatarRing = ({ children, callType }: { children: React.ReactNode, callType: 'missed' | 'incoming' | 'outgoing' }) => {
  const ringRotation = useSharedValue(0);
  
  useEffect(() => {
    // Removed animation for performance
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }]
  }));

  const ringColors = callType === 'missed' 
    ? ['#ef4444', '#f97316', '#ef4444'] 
    : callType === 'incoming' 
      ? ['#06d6a0', '#38bdf8', '#06d6a0'] 
      : ['#8b5cf6', '#c084fc', '#8b5cf6']; 

  return (
    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 64, height: 64, borderRadius: 32 }, ringStyle]}>
        <LinearGradient
          colors={ringColors as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 64, height: 64, borderRadius: 32 }}
        />
      </Animated.View>
      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, overflow: 'hidden' }}>
          {children}
        </View>
      </View>
    </View>
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

  const inactiveBorder = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
  const inactiveBg = isDark ? '#1e293b' : '#ffffff';
  const inactiveText = isDark ? '#94a3b8' : '#475569';

  return (
    <AnimatedPressable
      onPress={() => onSelect(type)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
          elevation: 8,
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
      <RNText style={{
        fontSize: 14,
        fontWeight: isActive ? '700' : '600',
        color: isActive ? '#ffffff' : inactiveText,
        zIndex: 2,
        letterSpacing: 0.3,
      }}>
        {label}
      </RNText>
    </AnimatedPressable>
  );
};

const LoadingSkeleton = () => {
  const { isDark } = useThemeContext();
  const shimmerOpacity = useSharedValue(0.4);
  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }), 
      -1, true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmerOpacity.value }));
  return (
    <YStack paddingHorizontal="$4" paddingTop="$4" space="$4">
      {[1, 2, 3, 4].map(i => (
        <Animated.View key={i} style={[animatedStyle, { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.85)', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)' }]} >
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(226,232,240,0.5)' }} />
          <YStack flex={1} marginLeft="$4" space="$2">
            <View style={{ width: 140, height: 18, borderRadius: 6, backgroundColor: 'rgba(226,232,240,0.5)' }} />
            <View style={{ width: 90, height: 14, borderRadius: 6, backgroundColor: 'rgba(241,245,249,0.5)' }} />
          </YStack>
        </Animated.View>
      ))}
    </YStack>
  );
};

export default function CallsScreen() {
  const { isDark } = useThemeContext();
  const styles = useMemo(() => getStyles(isDark), [isDark]);
  const { user } = useAuth();
  const { startVoiceCall } = useCall();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const [missedCount, setMissedCount] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ log: any; x: number; y: number } | null>(null);

  const p1Y = useSharedValue(0);
  const p2Y = useSharedValue(0);
  const p3Y = useSharedValue(0);
  const p4Y = useSharedValue(0);
  const p5Y = useSharedValue(0);

  useEffect(() => {
    fetchCallLogs();
    
  }, []);

  const p1Style = useAnimatedStyle(() => ({ transform: [{ translateY: p1Y.value }] }));
  const p2Style = useAnimatedStyle(() => ({ transform: [{ translateY: p2Y.value }] }));
  const p3Style = useAnimatedStyle(() => ({ transform: [{ translateY: p3Y.value }] }));
  const p4Style = useAnimatedStyle(() => ({ transform: [{ translateY: p4Y.value }] }));
  const p5Style = useAnimatedStyle(() => ({ transform: [{ translateY: p5Y.value }] }));

  const fetchCallLogs = async () => {
    try {
      const res = await api.getCallHistory();
      const historyList = res.calls || res.history || [];
      if (res.success) {
        setLogs(historyList);
        
        const stored = await AsyncStorage.getItem("@call_history_last_checked");
        const lastChecked = stored ? new Date(stored) : new Date(0);
        let newMissed = 0;
        
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
      fetchCallLogs();
    }
  };

  const renderRightActions = (progress: any, dragX: any, callId: string) => {
    return (
      <LinearGradient colors={['#ef4444', '#dc2626']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.deleteActionContainer}>
        <TouchableOpacity style={styles.deleteAction} onPress={() => handleDeleteCall(callId)}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 color="#fff" size={24} />
            <RNText style={{ color: '#fff', fontSize: 11, marginTop: 4, fontWeight: '600' }}>Delete</RNText>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    );
  };

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

  const renderRow = (log: any, index: number) => {
    const isMissed = log.status === 'missed' && !log.isOutgoing;
    const isIncoming = !log.isOutgoing && log.status !== 'missed';
    const isOutgoing = log.isOutgoing;

    const peerName = log.peer?.name || log.peer?.phone || 'Unknown Caller';
    const initial = peerName.charAt(0).toUpperCase();
    const avatarTheme = getAvatarTheme(peerName);
    const hasCustomAvatar = Boolean(log.peer?.avatar);

    const callDate = new Date(log.createdAt);
    const timeString = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let iconColor = '#10b981'; 
    let directionText = 'Incoming';
    let DirectionIcon = ArrowUpRight;

    if (isMissed) {
      iconColor = '#ef4444';
      directionText = 'Missed';
      DirectionIcon = ArrowDownLeft;
    } else if (isOutgoing) {
      iconColor = '#3b82f6';
      directionText = 'Outgoing';
      DirectionIcon = ArrowUpRight;
    }

    return (
      <Animated.View key={log.id} entering={FadeInUp.duration(200)} style={[styles.cardContainer, isMissed && styles.cardContainerMissed]}>
        {/* Glassmorphic Gradient Background — theme-adaptive */}
        <LinearGradient 
          colors={isDark ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.4)']} 
          start={{x:0, y:0}} end={{x:0, y:1}} style={StyleSheet.absoluteFillObject} />
        
        <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, log.id)} rightThreshold={40} friction={2}>
          <TouchableOpacity 
            style={styles.logRowWrapper} 
            activeOpacity={0.8}
            onLongPress={(e) => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(()=>{});
              setContextMenu({ log, x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
            }}
            onPress={() => {
              if (log.peer?.id) {
                router.push(`/profile/${log.peer.id}`);
              }
            }}
          >
            <XStack flex={1} alignItems="center">
              <AnimatedAvatarRing callType={isMissed ? 'missed' : isIncoming ? 'incoming' : 'outgoing'}>
                {hasCustomAvatar ? (
                  <Image source={{ uri: log.peer.avatar }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: avatarTheme.bg }]}>
                    <RNText style={styles.avatarInitial}>{initial}</RNText>
                  </View>
                )}
              </AnimatedAvatarRing>
              
              <YStack flex={1} marginLeft="$4" justifyContent="center">
                <RNText style={[styles.peerName, isMissed && { color: '#ef4444' }]} numberOfLines={1}>{peerName}</RNText>
                <XStack alignItems="center" marginTop={4} space="$1.5">
                  <DirectionIcon size={14} color={iconColor} strokeWidth={3} />
                  <RNText style={[styles.directionText, { color: iconColor }]}>{directionText}</RNText>
                </XStack>
              </YStack>

              <YStack alignItems="flex-end" justifyContent="space-between" height={54}>
                <RNText style={styles.timeText}>{timeString}</RNText>
                <TouchableOpacity 
                  style={styles.callBackBtn}
                  onPress={async (e) => {
                    e.stopPropagation();
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
                    if (log.peer) {
                      try {
                        const res = await startVoiceCall(log.peer, false);
                        if (res?.call?.id) router.push(`/call/${res.call.id}`);
                      } catch(err) {}
                    }
                  }}
                >
                  <RNText style={styles.callBackText}>Call back</RNText>
                </TouchableOpacity>
              </YStack>
            </XStack>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  };

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
            elevation: isDark ? 0 : 4,
          }]}>
            <Image source={require('../../assets/images/logo-icon-transparent.png')} style={{ width: 28, height: 28, marginLeft: 16 }} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#fff' : '#1e293b' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search calls..."
              placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 6 }}>
              <LinearGradient colors={['#38bdf8', '#818cf8']} style={styles.searchIconBtn}>
                {searchQuery.length > 0 ? <X color="#fff" size={18} /> : <Search color="#fff" size={18} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          <FilterButton label="All" type="all" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#0ea5e9', '#3b82f6']} />
          <FilterButton label="Missed" type="missed" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#f43f5e', '#ec4899']} />
          <FilterButton label="Incoming" type="incoming" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#10b981', '#14b8a6']} />
          <FilterButton label="Outgoing" type="outgoing" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#8b5cf6', '#6366f1']} />
        </ScrollView>
      </View>

      {/* Background Particles below header, rendered behind ScrollView */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 1, pointerEvents: 'none' }]}>
        <Animated.View style={[styles.particle, { backgroundColor: '#8b5cf6', top: 380, left: 20, width: 8, height: 8 }, p1Style]} />
        <Animated.View style={[styles.particle, { backgroundColor: '#06b6d4', top: 580, right: 30, width: 12, height: 12 }, p2Style]} />
        <Animated.View style={[styles.particle, { backgroundColor: '#ec4899', top: 780, left: 40, width: 6, height: 6 }, p3Style]} />
        <Animated.View style={[styles.particle, { backgroundColor: '#3b82f6', top: 480, right: 60, width: 9, height: 9 }, p4Style]} />
        <Animated.View style={[styles.particle, { backgroundColor: '#a855f7', top: 680, left: 80, width: 10, height: 10 }, p5Style]} />
      </View>

      {/* Main Content (Cards scroll over the dark header) */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredLogs.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" opacity={0.8} zIndex={5}>
          <Phone color={isDark ? "#94a3b8" : "#64748b"} size={64} style={{ marginBottom: 16 }} />
          <RNText style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a' }}>No calls found</RNText>
          <RNText style={{ fontSize: 14, fontWeight: '500', color: isDark ? '#94a3b8' : '#64748b', marginTop: 8 }}>Your call history will appear here</RNText>
        </YStack>
      ) : (
        <FlashList
          estimatedItemSize={70}
          data={filteredLogs}
          keyExtractor={(item) => item.id || String(Math.random())}
          renderItem={({ item, index }) => renderRow(item, index)}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          contentContainerStyle={styles.scrollContent}
          style={{ flex: 1, zIndex: 5 }}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* Context Menu Modal */}
      <Modal visible={!!contextMenu} transparent animationType="fade" onRequestClose={() => setContextMenu(null)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setContextMenu(null)}>
          <Animated.View entering={FadeInUp.duration(200)} style={[styles.contextMenu, { top: (contextMenu?.y || 200) - 60, left: Math.min(contextMenu?.x || 100, SCREEN_WIDTH - 200) }]}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={async () => { setContextMenu(null); if (contextMenu?.log?.peer) { try { const res = await startVoiceCall(contextMenu.log.peer, false); if (res?.call?.id) router.push(`/call/${res.call.id}`); } catch(e) {} } }}>
              <Phone size={16} color="#005eb8" />
              <RNText style={styles.contextMenuText}>Voice Call</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={async () => { setContextMenu(null); if (contextMenu?.log?.peer) { try { const res = await startVoiceCall(contextMenu.log.peer, true); if (res?.call?.id) router.push(`/call/${res.call.id}`); } catch(e) {} } }}>
              <Video size={16} color="#6366f1" />
              <RNText style={styles.contextMenuText}>Video Call</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { setContextMenu(null); if (contextMenu?.log?.peer?.id) router.push(`/chat/${contextMenu.log.peer.id}`); }}>
              <MessageSquare size={16} color="#10b981" />
              <RNText style={styles.contextMenuText}>Message</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contextMenuItem, { borderBottomWidth: 0 }]} onPress={() => { setContextMenu(null); if (contextMenu?.log?.id) handleDeleteCall(contextMenu.log.id); }}>
              <Trash2 size={16} color="#ef4444" />
              <RNText style={[styles.contextMenuText, { color: '#ef4444' }]}>Delete</RNText>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
  headerWave: {
    position: 'absolute',
    bottom: -50,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
  // ── THEME-ADAPTIVE CARD STYLES ──
  cardContainer: {
    marginBottom: 8,
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(199,210,254,0.7)',
    overflow: 'hidden',
    shadowColor: isDark ? '#06b6d4' : '#818cf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.25 : 0.18,
    shadowRadius: 20,
    elevation: 0,
  },
  cardContainerMissed: {
    borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#fca5a5',
  },
  logRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  peerName: {
    fontSize: 17,
    fontWeight: '800',
    color: isDark ? '#f1f5f9' : '#0f172a',
  },
  directionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 4,
  },
  callBackBtn: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 36,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.3)',
  },
  callBackText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#818cf8' : '#6366f1',
  },
  deleteActionContainer: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 32,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: 60,
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
    elevation: 10,
  },
  fabInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fabCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#a855f7', // Inner purple neon ring
  },
  contextMenu: {
    position: 'absolute',
    width: 180,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 16,
    shadowColor: isDark ? '#000' : '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    zIndex: 999,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  contextMenuText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 12,
  },
}); }
