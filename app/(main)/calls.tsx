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

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    let iconColor = "#94a3b8";
    if (isMissed) {
      Icon = PhoneMissed;
      iconColor = "#ef4444";
    } else if (isIncoming) {
      Icon = PhoneIncoming;
      iconColor = "#10b981";
    }

    const isFirst = index === 0;
    const isLast = index === totalInGroup - 1;

    return (
      <View style={[
        styles.logRowWrapper, 
        isFirst && { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
        isLast && { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, borderBottomWidth: 0 },
        isMissed && styles.logRowMissed
      ]}>
        <XStack flex={1} alignItems="center" space="$3">
          <View style={styles.avatarWrapper}>
            <Avatar circular size="$4" style={styles.avatarBorder}>
              <Avatar.Image src={log.peer?.avatar || `https://ui-avatars.com/api/?name=${log.peer?.name || 'U'}&background=e2e8f0&color=475569`} />
              <Avatar.Fallback backgroundColor="$gray4" />
            </Avatar>
            <View style={styles.callBadge}>
              <Icon size={10} color={iconColor} />
            </View>
          </View>
          
          <YStack flex={1}>
            <XStack alignItems="center" space="$2">
              <RNText style={[styles.peerName, isMissed && { color: '#ef4444' }]} numberOfLines={1}>
                {log.peer?.name || log.peer?.phone || "Unknown"}
              </RNText>
              {log.aiSummary && (
                <View style={styles.aiBadge}>
                  <LinearGradient colors={['#a7f3d0', '#5eead4']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
                  <Sparkles size={10} color="#047857" style={{ marginRight: 2 }} />
                  <RNText style={styles.aiBadgeText}>AI</RNText>
                </View>
              )}
            </XStack>
            <XStack alignItems="center" space="$1.5">
              {log.type === "video" ? <Video size={12} color="#64748b" /> : <Phone size={12} color="#64748b" />}
              <RNText style={styles.timeText}>{timeStr}</RNText>
            </XStack>
          </YStack>
        </XStack>

        <XStack space="$2">
          {log.aiSummary && (
            <TouchableOpacity 
              style={styles.actionBtnShadow}
              onPress={() => setSelectedSummary(log)}
            >
              <LinearGradient colors={['#34d399', '#0d9488']} style={styles.actionBtn}>
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
          >
            <LinearGradient colors={['#3b82f6', '#005eb8']} style={styles.actionBtn}>
              {log.type === 'video' ? <Video size={16} color="#fff" /> : <Phone size={16} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </XStack>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#f4f8ff', '#f8f5ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Subtle Background Blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        {!isSearching ? (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight} style={styles.headerContent}>
            <XStack alignItems="center" space="$2">
              <View style={styles.logoCircle}>
                <Image source={require('../../assets/images/logo-icon-transparent.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
              </View>
              <RNText style={styles.appTitle}>UniCom</RNText>
            </XStack>
            <TouchableOpacity style={styles.searchBtnShadow} onPress={toggleSearch}>
              <LinearGradient colors={['#eff6ff', '#e0e7ff']} style={styles.searchBtn}>
                <Search color="#3b82f6" size={20} />
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 65, minHeight: 65, flexGrow: 0, marginBottom: 10 }} contentContainerStyle={styles.filtersContainer}>
        {['all', 'missed', 'incoming', 'outgoing'].map((f) => {
          const isActive = filter === f;
          return (
            <TouchableOpacity 
              key={f} 
              activeOpacity={0.8}
              onPress={() => handleFilterChange(f)} 
              style={[styles.filterPill, isActive && styles.filterPillActiveWrapper]}
            >
              {isActive && (
                <LinearGradient
                  colors={['#005eb8', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                />
              )}
              <RNText style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </RNText>
              {f === 'missed' && <PulseBadge count={missedCount} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#005eb8" />}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : filteredLogs.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(600).delay(200)}>
            <YStack alignItems="center" justifyContent="center" marginTop="$10" space="$4">
              <View style={styles.emptyIconContainer}>
                <LinearGradient colors={['#e0e7ff', '#f3e8ff']} style={StyleSheet.absoluteFillObject} />
                <PhoneMissed color="#8b5cf6" size={32} />
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
              <YStack key={groupName} marginBottom="$5">
                <XStack alignItems="center" marginBottom={12} marginLeft={16}>
                  <View style={styles.sectionDot} />
                  <RNText style={styles.sectionTitle}>{groupName}</RNText>
                </XStack>
                <View style={styles.cardContainer}>
                  {groupLogs.map((log: any, index: number) => (
                    <Animated.View key={log.id} entering={FadeInUp.delay((groupIndex * 10 + index) * 40).springify()}>
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
              </YStack>
            ));
          })()
        )}
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fabContainer, { bottom: Math.max(insets.bottom + 100, 120) }]}>
        <Animated.View style={[styles.fabGlow, fabGlowStyle]} />
        <AnimatedPressable 
          style={fabAnimatedStyle}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
        >
          <LinearGradient colors={['#005eb8', '#a855f7']} style={styles.fab} start={{x:0, y:0}} end={{x:1, y:1}}>
            <Grid3x3 color="#fff" size={24} />
          </LinearGradient>
        </AnimatedPressable>
      </View>

      {/* AI Summary Bottom Sheet Modal */}
      <Modal visible={!!selectedSummary} transparent animationType="fade" onRequestClose={() => setSelectedSummary(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedSummary(null)} activeOpacity={1} />
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom + 20, 24) }]}>
            
            <LinearGradient colors={['#f3e8ff', '#ffffff']} locations={[0, 0.4]} style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]} />
            
            <View style={styles.sheetHandle} />
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$5" paddingHorizontal="$4" zIndex={2}>
              <XStack space="$3" alignItems="center">
                <View style={styles.sheetSparkleBadge}>
                  <LinearGradient colors={['#8b5cf6', '#ec4899']} style={StyleSheet.absoluteFillObject} />
                  <Sparkles color="#fff" size={20} />
                </View>
                <YStack>
                  <RNText style={styles.sheetTitle}>AI Summary</RNText>
                  <RNText style={styles.sheetSubtitle}>Call with {selectedSummary?.peer?.name}</RNText>
                </YStack>
              </XStack>
              <TouchableOpacity onPress={() => setSelectedSummary(null)}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </XStack>
            
            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.5, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
              {selectedSummary?.aiSummary ? (
                <RNText style={styles.summaryText}>{selectedSummary.aiSummary}</RNText>
              ) : (
                <YStack alignItems="center" paddingVertical="$6" space="$3">
                  <FileText color="#cbd5e1" size={40} style={{ marginBottom: 8 }} />
                  <RNText style={styles.emptySub}>No AI Summary was generated for this call.</RNText>
                </YStack>
              )}
            </ScrollView>
            
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setSelectedSummary(null)}>
              <RNText style={styles.sheetCloseBtnText}>Close</RNText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5ff' },
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { width: 400, height: 400, backgroundColor: 'rgba(0, 94, 184, 0.05)', top: -100, right: -100, transform: [{ scale: 1.5 }] },
  blob2: { width: 300, height: 300, backgroundColor: 'rgba(124, 58, 237, 0.04)', bottom: 100, left: -50, transform: [{ scale: 1.5 }] },
  header: { paddingHorizontal: 20, paddingBottom: 16, zIndex: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44 },
  logoCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,94,184, 0.1)', alignItems: 'center', justifyContent: 'center' },
  appTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5, textShadowColor: 'rgba(0,0,0,0.05)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  searchBtnShadow: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  searchBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 16, height: 44, shadowColor: '#005eb8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: '#eff6ff' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a', fontWeight: '500', outlineStyle: 'none' } as any,
  cancelText: { color: '#005eb8', fontWeight: '600', fontSize: 15 },
  filtersContainer: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'center' },
  filterPill: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, height: 40 },
  filterPillActiveWrapper: { borderColor: 'transparent', shadowColor: '#005eb8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  filterText: { color: '#64748b', fontWeight: '600', fontSize: 14, letterSpacing: 0.2 },
  filterTextActive: { color: '#ffffff', zIndex: 1 },
  missedBadgeContainer: { marginLeft: 8, position: 'relative', width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  missedBadgeGlow: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444' },
  missedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  missedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#005eb8', marginRight: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  cardContainer: { backgroundColor: '#ffffff', borderRadius: 24, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10, borderWidth: 1, borderColor: '#f8fafc', overflow: 'hidden' },
  logRowWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logRowMissed: { backgroundColor: 'rgba(239, 68, 68, 0.03)' },
  avatarBorder: { borderWidth: 2, borderColor: '#f8fafc' },
  avatarWrapper: { position: 'relative' },
  callBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  peerName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#064e3b', marginLeft: 2 },
  timeText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  actionBtnShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  actionBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  deleteActionContainer: { width: 80, height: '100%', backgroundColor: '#ef4444' },
  deleteAction: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  emptySub: { fontSize: 14, color: '#64748b' },
  fabContainer: { position: 'absolute', right: 24, zIndex: 10 },
  fabGlow: { position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, borderRadius: 40, backgroundColor: 'rgba(0, 94, 184, 0.4)', filter: 'blur(15px)' as any },
  fab: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#005eb8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 24, overflow: 'hidden' },
  sheetHandle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 20, zIndex: 2 },
  sheetSparkleBadge: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#ec4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  sheetSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  summaryText: { fontSize: 16, color: '#334155', lineHeight: 26, fontWeight: '400' },
  sheetCloseBtn: { marginTop: 24, marginHorizontal: 16, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc' },
  sheetCloseBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 }
});