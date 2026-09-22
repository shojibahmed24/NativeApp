// @ts-nocheck
import * as Clipboard from 'expo-clipboard';
import { useThemeContext } from '../../../src/context/ThemeContext';
import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet, Platform, TouchableHighlight, ActivityIndicator, Modal, Alert, SafeAreaView } from 'react-native';
import { YStack, XStack, Text, Avatar } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MessageSquare, Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, MoreVertical, Sparkles, PhoneOff, User, Copy, Ban, Trash2, X } from 'lucide-react-native';
import { GradientBackground } from '../../../src/components/ThemeComponents';
import { TOKENS } from '../../../src/theme/tokens';
import { useCall } from '../../../src/context/CallContext';
import { supabase } from '../../../src/services/supabase';
import { api } from '../../../src/services/api';
import { useAuth } from '../../../src/context/AuthContext';
import Animated, { FadeInUp, FadeInDown, SlideInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
const getAvatarColor = (name: string) => {
  if (!name) return '#cbd5e1';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ─── UTILITIES ──────────────────────────────────────────────────
const ScaleButton = ({ onPress, style, children, activeScale = 0.95, haptic = Haptics.ImpactFeedbackStyle.Light, ...props }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={1}
        style={style}
        onPressIn={() => { scale.value = withSpring(activeScale, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={(e) => {
          if (Platform.OS !== 'web') Haptics.impactAsync(haptic);
          onPress?.(e);
        }}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CallInfoScreen() {
  const { isDark } = useThemeContext();
  const styles = getStyles(isDark);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { callHistory, startVoiceCall } = useCall();
  
  const [peerLogs, setPeerLogs] = useState<any[]>([]);
  const [peerInfo, setPeerInfo] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [clearing, setClearing] = useState(false);
  const handleCopyPhone = () => {};
  const handleClearLogs = () => {};
  const handleBlockUser = () => {};

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      try {
        // Fetch call history first to get peer info from there as fallback
        const res = await api.getCallHistory();
        let peerData = null;
        let filtered = [];
        
        if (res.success && res.calls) {
          filtered = res.calls.filter(c => c.peer?.id === id);
          setPeerLogs(filtered);
          if (filtered.length > 0) {
            peerData = filtered[0].peer;
          }
        }
        
        // Fetch peer info
        let user = null;
        try {
          const resProfile = await api.getPublicProfile(id as string);
          if (resProfile && resProfile.success) {
            user = resProfile.user || resProfile.profile;
          }
        } catch (e) {
          console.error('Failed to get public profile', e);
        }

        if (user) {
           setPeerInfo({
             id: user.id,
             name: user.name || 'Unknown',
             phone: user.phone_number || user.phone || '',
             avatar: user.profile_picture || user.avatar || null
           });
        } else if (peerData) {
           // Fallback to call log peer info
           setPeerInfo({
             id: peerData.id,
             name: peerData.name || 'Unknown',
             phone: peerData.phone || '',
             avatar: peerData.avatar || null
           });
        } else {
           setPeerInfo({ id, name: 'Unknown Caller' });
        }
      } catch (err) {
        console.error('Error fetching call info:', err);
        setPeerInfo({ id, name: 'Unknown Caller' }); // Unblock loading
      }
    };
    
    loadData();
  }, [id]);

  const handleAudioCall = async () => {
    if (!peerInfo) return;
    try {
      const res = await startVoiceCall(peerInfo);
      if (res && res.call && res.call.id) {
        router.push(`/call/${res.call.id}`);
      } else {
        alert("Call ID is missing from response!");
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') alert('Call failed to start.');
    }
  };

  const handleVideoCall = async () => {
    if (!peerInfo) return;
    try {
      const res = await startVoiceCall(peerInfo, true);
      if (res && res.call && res.call.id) {
        router.push(`/call/${res.call.id}`);
      } else {
        alert("Call ID is missing from response!");
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') alert('Call failed to start.');
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Group logs by date
  const groupedLogs = peerLogs.reduce((acc: any, log: any) => {
    const d = formatDate(log.createdAt);
    if (!acc[d]) acc[d] = [];
    acc[d].push(log);
    return acc;
  }, {});

  if (!peerInfo) return (
    <GradientBackground style={{ flex: 1 }}>
      <LinearGradient colors={(isDark ? ['#0f172a', '#1e293b'] : TOKENS.GRADIENTS.SCREEN_BG)} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#005eb8" />
        <Text color="#005eb8" fontWeight="600" marginTop="$4">Loading Call Info...</Text>
      </View>
    
      {/* 3-Dot Options Bottom Sheet Modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowMenu(false)} />
          <Animated.View entering={FadeInDown.duration(300).springify()} style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }}>
            
            <View style={{ width: 40, height: 5, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 }} />
            
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <Text fontSize={20} fontWeight="800" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>Options</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? '#334155' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                  <X color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={18} />
                </View>
              </TouchableOpacity>
            </XStack>

            <YStack space="$2" marginTop="$2">
              <TouchableHighlight underlayColor={isDark ? '#334155' : '#f8fafc'} onPress={() => { setShowMenu(false); router.push('/profile/' + id); }} style={{ borderRadius: 12 }}>
                <XStack alignItems="center" padding="$3" space="$4">
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(14,165,233,0.1)' : '#f0f9ff', alignItems: 'center', justifyContent: 'center' }}><User color="#0ea5e9" size={20} /></View>
                  <Text fontSize={16} fontWeight="700" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>View Profile</Text>
                </XStack>
              </TouchableHighlight>

              <TouchableHighlight underlayColor={isDark ? '#334155' : '#f8fafc'} onPress={handleCopyPhone} style={{ borderRadius: 12 }}>
                <XStack alignItems="center" padding="$3" space="$4">
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}><Copy color="#10b981" size={20} /></View>
                  <Text fontSize={16} fontWeight="700" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>Copy Phone Number</Text>
                </XStack>
              </TouchableHighlight>

              <View style={{ height: 1, backgroundColor: isDark ? '#334155' : '#f1f5f9', marginVertical: 8 }} />

              <TouchableHighlight underlayColor={isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'} onPress={handleClearLogs} style={{ borderRadius: 12 }}>
                <XStack alignItems="center" padding="$3" space="$4">
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', alignItems: 'center', justifyContent: 'center' }}>
                    {clearing ? <ActivityIndicator color="#ef4444" /> : <Trash2 color="#ef4444" size={20} />}
                  </View>
                  <Text fontSize={16} fontWeight="700" color="#ef4444">Clear Call History</Text>
                </XStack>
              </TouchableHighlight>

              <TouchableHighlight underlayColor={isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'} onPress={handleBlockUser} style={{ borderRadius: 12 }}>
                <XStack alignItems="center" padding="$3" space="$4">
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', alignItems: 'center', justifyContent: 'center' }}><Ban color="#ef4444" size={20} /></View>
                  <Text fontSize={16} fontWeight="700" color="#ef4444">Block User</Text>
                </XStack>
              </TouchableHighlight>
            </YStack>
          </Animated.View>
        </View>
      </Modal>

    </GradientBackground>
  );

  const initial = peerInfo.name?.charAt(0).toUpperCase() || 'U';
  const avatarBg = getAvatarColor(peerInfo.name);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <LinearGradient colors={(isDark ? ['#0f172a', '#1e293b'] : TOKENS.GRADIENTS.SCREEN_BG)} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <XStack padding="$4" alignItems="center" justifyContent="space-between" zIndex={10}>
          <ScaleButton onPress={() => router.back()} style={styles.iconButton}>
            <ChevronLeft color={(isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY)} size={24} />
          </ScaleButton>
          <Text color={(isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY)} fontSize={20} fontWeight="800">Call info</Text>
          <ScaleButton style={styles.iconButton}>
            <MoreVertical color={(isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY)} size={24} />
          </ScaleButton>
        </XStack>

        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          <YStack alignItems="center" marginTop="$2">
            <Animated.View entering={FadeInDown.springify()}>
              <TouchableOpacity onPress={() => router.push(`/profile/${peerInfo.id}`)}>
                <View style={styles.avatarRing}>
                  <Avatar circular size={110} backgroundColor={avatarBg} style={styles.avatar}>
                    {peerInfo.avatar ? <Avatar.Image src={peerInfo.avatar} /> : <Text color="#fff" fontWeight="bold" fontSize={48}>{initial}</Text>}
                  </Avatar>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={{ alignItems: 'center', width: '100%' }}>
              <Text fontSize={26} fontWeight="800" color={(isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY)} marginTop="$5">{peerInfo.name}</Text>
              <Text fontSize={15} color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} fontWeight="500" marginTop="$2">{peerInfo.phone || 'No phone number'}</Text>
            </Animated.View>
          </YStack>

          <Animated.View entering={FadeInUp.duration(500).delay(300)}>
            <XStack justifyContent="center" space="$6" marginTop="$8" paddingHorizontal="$4" paddingBottom="$8">
              
              <YStack alignItems="center" space="$3">
                <ScaleButton style={styles.actionBtn} onPress={() => router.push(`/chat/${peerInfo.id}`)}>
                  <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={[StyleSheet.absoluteFill, { borderRadius: TOKENS.RADIUS.XL }]} />
                  <MessageSquare color="#fff" size={24} style={{ zIndex: 1 }} />
                </ScaleButton>
                <Text color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} fontSize={13} fontWeight="600">Message</Text>
              </YStack>
              
              <YStack alignItems="center" space="$3">
                <ScaleButton style={styles.actionBtn} onPress={handleAudioCall}>
                  <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={[StyleSheet.absoluteFill, { borderRadius: TOKENS.RADIUS.XL }]} />
                  <Phone color="#fff" size={24} style={{ zIndex: 1 }} />
                </ScaleButton>
                <Text color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} fontSize={13} fontWeight="600">Audio</Text>
              </YStack>

              <YStack alignItems="center" space="$3">
                <ScaleButton style={styles.actionBtn} onPress={handleVideoCall}>
                  <LinearGradient colors={TOKENS.GRADIENTS.AI} start={{x:0, y:0}} end={{x:1, y:1}} style={[StyleSheet.absoluteFill, { borderRadius: TOKENS.RADIUS.XL }]} />
                  <Video color="#fff" size={24} style={{ zIndex: 1 }} />
                </ScaleButton>
                <Text color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} fontSize={13} fontWeight="600">Video</Text>
              </YStack>

            </XStack>
          </Animated.View>

          <YStack paddingHorizontal="$4" marginTop="$2" space="$6">
            {peerLogs.length === 0 ? (
              <Animated.View entering={FadeInUp.delay(500)}>
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIconBadge}>
                    <LinearGradient colors={['#f1f5f9', '#e2e8f0']} start={{x:0, y:0}} end={{x:1, y:1}} style={[StyleSheet.absoluteFill, { borderRadius: 36 }]} />
                    <PhoneOff color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} size={32} style={{ zIndex: 1 }} />
                  </View>
                  <Text color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} fontSize={15} fontWeight="500" marginTop="$4">No call history yet with this contact</Text>
                </View>
              </Animated.View>
            ) : (
              Object.keys(groupedLogs).map((date, gIndex) => (
                <Animated.View key={date} entering={SlideInRight.delay(400 + gIndex * 150).springify()}>
                  {/* Date Header */}
                  <XStack alignItems="center" space="$2" marginBottom="$3" paddingLeft="$2">
                    <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:0, y:1}} style={{ width: 4, height: 14, borderRadius: 2 }} />
                    <Text color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} fontSize={14} fontWeight="800" letterSpacing={0.5}>{date.toUpperCase()}</Text>
                  </XStack>
                  
                  {/* Logs Container */}
                  <View style={[styles.cardContainer, { backgroundColor: 'transparent', paddingHorizontal: 0 }]}>
                      {groupedLogs[date].map((log: any, index: number) => {
                        const isMissed = log.status === 'missed';
                        const isIncoming = !log.isOutgoing;
                        const type = isMissed ? 'missed' : isIncoming ? 'incoming' : 'outgoing';
                        const Icon = type === 'missed' ? PhoneMissed : type === 'incoming' ? PhoneIncoming : PhoneOutgoing;
                        const color = type === 'missed' ? '#ef4444' : type === 'incoming' ? '#10b981' : '#64748b';
                        const badgeBg = type === 'missed' ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2') : type === 'incoming' ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5') : (isDark ? '#334155' : '#f1f5f9');
                        const isLast = index === groupedLogs[date].length - 1;
                        
                        return (
                          <Animated.View key={log.id} entering={FadeInUp.delay(500 + gIndex * 100 + index * 80)}>
                            <TouchableHighlight underlayColor={isDark ? '#334155' : '#f8fafc'} onPress={() => {}} style={[styles.logRow, !isLast && styles.logRowBorder]}>
                              <XStack alignItems="center">
                                <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
                                  <Icon color={color} size={16} />
                                </View>
                                
                                <YStack flex={1} marginLeft="$3">
                                  <Text color={isMissed ? '#ef4444' : (isDark ? '#f8fafc' : '#0f172a')} fontSize={16} fontWeight="700">
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </Text>
                                  <XStack alignItems="center" space="$2" marginTop={4}>
                                    <Text color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} fontSize={13} fontWeight="500">{formatTime(log.createdAt)}</Text>
                                    {log.isTranslated && (
                                      <View style={styles.aiBadge}>
                                        <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} start={{x:0, y:0}} end={{x:1, y:1}} style={[StyleSheet.absoluteFill, { borderRadius: TOKENS.RADIUS.SM }]} />
                                        <Sparkles color="#fff" size={10} style={{ zIndex: 1, marginRight: 4 }} />
                                        <Text color="#fff" fontSize={10} fontWeight="800" style={{ zIndex: 1 }}>AI TRANSLATED</Text>
                                      </View>
                                    )}
                                  </XStack>
                              </YStack>
                              
                              <YStack alignItems="flex-end">
                                <Text color={(isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY)} fontSize={15} fontWeight="700">{formatDuration(log.durationSeconds)}</Text>
                                {log.durationSeconds > 0 && <Text color={(isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY)} fontSize={12} marginTop={2} fontWeight="500">~{(log.durationSeconds * 2.4).toFixed(0)} kB</Text>}
                              </YStack>
                            </XStack>
                          </TouchableHighlight>
                        </Animated.View>
                      );
                    })}
                  </View>
                </Animated.View>
              ))
            )}
          </YStack>

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: TOKENS.RADIUS.LG,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    elevation: 2
  },
  avatarRing: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: isDark ? '#1e293b' : '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...TOKENS.SHADOWS.ELEVATED
  },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#e2e8f0' },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: TOKENS.RADIUS.LG,
    marginHorizontal: 16
  },
  emptyStateIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  cardShadow: {
    ...TOKENS.SHADOWS.SUBTLE,
    borderRadius: TOKENS.RADIUS.LG
  },
  cardContainer: {
    backgroundColor: isDark ? '#1e293b' : '#fff',
    borderRadius: TOKENS.RADIUS.LG,
    overflow: 'hidden'
  },
  logRow: { paddingVertical: 14, paddingHorizontal: 8 },
  logRowBorder: { borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
  typeBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: TOKENS.RADIUS.SM, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2, marginLeft: 8 }
});
