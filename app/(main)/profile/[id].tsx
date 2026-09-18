import { useThemeContext } from '../../../src/context/ThemeContext';
import React, { useState, useEffect } from 'react';
import {
  ScrollView, TouchableOpacity, View, Image, ActivityIndicator,
  StyleSheet, Platform, Alert, ImageBackground, Modal, Dimensions, StatusBar
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Globe, MessageSquare, Phone, Video, Ban, ShieldAlert,
  Flag, Bell, BellOff, Calendar, MoreVertical, X, ChevronRight, Quote, Clock, Image as ImageIcon
} from 'lucide-react-native';
import { GradientBackground } from '../../../src/components/ThemeComponents';
import { api } from '../../../src/services/api';
import Animated, {
  FadeInUp, FadeInDown, ZoomIn, SlideInRight, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring
} from 'react-native-reanimated';
import { useCall } from '../../../src/context/CallContext';
import { useAuth } from '../../../src/context/AuthContext';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { TOKENS } from '../../../src/theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 110;
const COVER_HEIGHT = 220;

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
const getAvatarColor = (name) => {
  if (!name) return '#64748b';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const formatMemberSince = (dateStr) => {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString([], { year: 'numeric', month: 'long' });
};
const formatDuration = (sec) => {
  if (!sec || sec === 0) return '0s';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return h + 'h ' + m + 'm'; if (m > 0) return m + 'm ' + s + 's'; return s + 's';
};
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const ScaleButton = ({ onPress, children, style, activeOpacity = 0.85, isDanger = false }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedTouchable onPressIn={() => { scale.value = withSpring(0.92); if (Platform.OS !== 'web') Haptics.impactAsync(isDanger ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }} onPressOut={() => { scale.value = withSpring(1); }} onPress={onPress} activeOpacity={activeOpacity} style={[style, animatedStyle]}>{children}</AnimatedTouchable>
  );
};
const GlassButton = ({ onPress, children, customStyle }) => (
  <ScaleButton onPress={onPress} activeOpacity={0.7} style={customStyle}>
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)', borderRadius: 21 }]} />
    {children}
  </ScaleButton>
);

export default function ProfileScreen() {
  const { isDark } = useThemeContext();
  const styles = getStyles(isDark);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { startVoiceCall, callHistory } = useCall();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(currentUser?.settings?.muted_users?.includes(id) || false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const sharedCalls = callHistory?.filter((c) => c.peer?.id === id) || [];
  const totalDuration = sharedCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const lastCall = sharedCalls[0];

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await api.getPublicProfile(id);
        if (res.success && res.user) setProfile(res.user);
        if (currentUser?.id) {
          const blockRes = await api.getBlockedUsers();
          if (blockRes.success && (blockRes.blockedUsers || blockRes.users)) {
            const bl = blockRes.blockedUsers || blockRes.users;
            setIsBlocked(bl.some((u) => u.id === id || u.blocked_id === id));
          }
        }
      } catch (err) { console.error('Error loading profile:', err); }
      finally { setLoading(false); }
    };
    load();
  }, [id, currentUser?.id]);

  const handleChat = () => router.push('/chat/' + id);
  const handleVoiceCall = async () => { if (!profile) return; try { const res = await startVoiceCall(profile, false); router.push('/call/' + res.call.id); } catch (err) { if (Platform.OS === 'web') alert('Could not start call.'); } };
  const handleVideoCall = async () => { if (!profile) return; try { const res = await startVoiceCall(profile, true); router.push('/call/' + res.call.id + '?isVideo=true'); } catch (err) { if (Platform.OS === 'web') alert('Could not start video call.'); } };
  const toggleBlock = async () => {
    if (!currentUser?.id || !id) return;
    try {
      if (isBlocked) { await api.unblockUser(id); setIsBlocked(false); }
      else {
        const confirm = Platform.OS === 'web' ? window.confirm('Block ' + (profile?.name || 'this user') + '?') : await new Promise(resolve => Alert.alert('Block User', 'Block ' + profile?.name + '?', [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) }, { text: 'Block', style: 'destructive', onPress: () => resolve(true) }]));
        if (!confirm) return; await api.blockUser(id); setIsBlocked(true);
      }
    } catch (err) { console.error('Block/unblock error:', err); }
  };
  const initial = profile?.name?.charAt(0)?.toUpperCase() || '?';
  const avatarBg = getAvatarColor(profile?.name || '');

  if (loading) return <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f0f4ff', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#005eb8" size="large" /></View>;

  return (
    <GradientBackground style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <Modal visible={showPhotoViewer} transparent animationType="fade" onRequestClose={() => setShowPhotoViewer(false)}>
        <View style={styles.photoViewer}>
          <View style={styles.photoViewerCloseWrapper}><GlassButton customStyle={styles.glassBtn} onPress={() => setShowPhotoViewer(false)}><X color="#fff" size={24} /></GlassButton></View>
          {profile?.avatar ? <Animated.Image entering={ZoomIn.duration(300)} source={{ uri: profile.avatar }} style={styles.fullPhoto} resizeMode="contain" /> : <Animated.View entering={ZoomIn.duration(300)} style={[styles.fullPhoto, { backgroundColor: avatarBg, justifyContent: 'center', alignItems: 'center' }]}><Text color="#fff" fontSize={80} fontWeight="900">{initial}</Text></Animated.View>}
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <View>
          {profile?.chatWallpaper ? (
            <ImageBackground source={{ uri: profile.chatWallpaper }} style={styles.cover}>
              <LinearGradient colors={['rgba(15,23,42,0.7)', 'rgba(15,23,42,0.2)', isDark ? '#0f172a' : '#f8fafc']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFillObject} />
            </ImageBackground>
          ) : (
            <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY_DARK} style={styles.cover}>
              <LinearGradient colors={['rgba(15,23,42,0.3)', 'transparent', isDark ? '#0f172a' : '#f8fafc']} locations={[0, 0.7, 1]} style={StyleSheet.absoluteFillObject} />
            </LinearGradient>
          )}
        </View>

        <View style={styles.headerOverlay}>
          <GlassButton customStyle={styles.glassBtn} onPress={() => router.back()}><ChevronLeft color="#fff" size={24} /></GlassButton>
          <GlassButton customStyle={styles.glassBtn} onPress={() => {}}><MoreVertical color="#fff" size={24} /></GlassButton>
        </View>

        <View style={styles.avatarSection}>
          <Animated.View entering={ZoomIn.springify().delay(200)}>
            <TouchableOpacity onPress={() => setShowPhotoViewer(true)} activeOpacity={0.85}>
              <View style={styles.avatarRing}>
                <LinearGradient colors={isDark ? ['#0f172a', '#1e293b'] : ['#f0f4ff', '#ede9fe']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFillObject, { borderRadius: (AVATAR_SIZE+10)/2 }]} />
                {profile?.avatar ? <Image source={{ uri: profile.avatar }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: avatarBg, justifyContent: 'center', alignItems: 'center' }]}><Text color="#fff" fontSize={44} fontWeight="900">{initial}</Text></View>}
              </View>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(350)} style={{ alignItems: 'center', marginTop: 16 }}>
            <Text fontSize={26} fontWeight="900" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY} letterSpacing={-0.5}>{profile?.name || 'Unknown User'}</Text>
            <XStack alignItems="center" space="$1.5" marginTop={6} backgroundColor={isDark ? 'rgba(2,132,199,0.2)' : '#e0f2fe'} paddingHorizontal="$3" paddingVertical="$1.5" borderRadius={12}>
              <Globe color="#0284c7" size={13} /><Text fontSize={13} fontWeight="600" color="#0284c7">{profile?.language || 'English'}</Text>
            </XStack>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(450)}>
          <XStack justifyContent="center" alignItems="center" space="$5" marginTop="$6" paddingHorizontal="$6">
            <YStack alignItems="center" space="$2"><ScaleButton onPress={handleVoiceCall} style={styles.actionRoundShadowAudio}><View style={[styles.actionRound, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}><Phone color="#0ea5e9" size={24} /></View></ScaleButton><Text fontSize={13} fontWeight="700" color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY}>Audio</Text></YStack>
            <YStack alignItems="center" space="$2"><ScaleButton onPress={handleChat} style={styles.actionRoundShadowMessage}><View style={[styles.actionRound, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}><MessageSquare color="#005eb8" size={24} /></View></ScaleButton><Text fontSize={13} fontWeight="700" color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY}>Message</Text></YStack>
            <YStack alignItems="center" space="$2"><ScaleButton onPress={handleVideoCall} style={styles.actionRoundShadowVideo}><View style={[styles.actionRound, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}><Video color="#8b5cf6" size={24} /></View></ScaleButton><Text fontSize={13} fontWeight="700" color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY}>Video</Text></YStack>
          </XStack>
        </Animated.View>

        <YStack paddingHorizontal="$4" marginTop="$8" space="$4">
          <Animated.View entering={SlideInRight.delay(500).springify()}>
            <View style={styles.infoCard}><View style={styles.iconBadgeBlue}><MessageSquare color="#005eb8" size={16} /></View><YStack flex={1} marginLeft="$3" position="relative"><Text style={styles.cardLabel}>Status</Text><Text style={styles.cardBio}>{profile?.status || 'Hey there! I am using UNICOM.'}</Text><Quote color="#cbd5e1" size={20} style={{ position: 'absolute', top: 0, right: 0, opacity: 0.3 }} /></YStack></View>
          </Animated.View>
          {profile?.phone && <Animated.View entering={SlideInRight.delay(580).springify()}><View style={styles.infoCard}><View style={styles.iconBadgeEmerald}><Phone color={TOKENS.COLORS.SUCCESS} size={16} /></View><YStack flex={1} marginLeft="$3"><Text style={styles.cardLabel}>Phone</Text><Text style={styles.cardValue}>{profile.phone}</Text></YStack></View></Animated.View>}
          {profile?.memberSince && <Animated.View entering={SlideInRight.delay(640).springify()}><View style={styles.infoCard}><View style={styles.iconBadgePurple}><Calendar color="#8b5cf6" size={16} /></View><YStack flex={1} marginLeft="$3"><Text style={styles.cardLabel}>Member Since</Text><Text style={styles.cardValue}>{formatMemberSince(profile.memberSince)}</Text></YStack></View></Animated.View>}

          <Animated.View entering={SlideInRight.delay(720).springify()}>
            <TouchableOpacity onPress={() => router.push('/shared-media/' + id)} activeOpacity={0.8} style={styles.statsCardShadow}>
              <View style={[styles.statsCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 }]}>
                <LinearGradient colors={isDark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f0f4ff']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
                <XStack alignItems="center" space="$3"><View style={[styles.iconBadgeEmerald, { backgroundColor: '#e0f2fe' }]}><ImageIcon color="#0284c7" size={20} /></View><YStack><Text fontWeight="800" fontSize={16} color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>Media, Links, and Docs</Text><Text fontSize={13} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={2}>View all shared files</Text></YStack></XStack>
                <ChevronLeft color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {sharedCalls.length > 0 && (
            <Animated.View entering={SlideInRight.delay(700).springify()}>
              <TouchableOpacity onPress={() => router.push('/call-info/' + id)} activeOpacity={0.8} style={styles.statsCardShadow}>
                <View style={styles.statsCard}>
                  <LinearGradient colors={isDark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f0f4ff']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
                  <XStack space="$3" justifyContent="space-between" marginBottom="$4">
                    <YStack flex={1} alignItems="center" backgroundColor={isDark ? 'rgba(14,165,233,0.1)' : '#f0f9ff'} padding="$2" borderRadius={12}><View style={[styles.iconBadgeSmall, { backgroundColor: '#dbeafe' }]}><Phone color="#0ea5e9" size={14} /></View><Text fontSize={18} fontWeight="900" color="#005eb8" marginTop="$2">{sharedCalls.length}</Text><Text fontSize={10} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} fontWeight="700" marginTop="$1" textAlign="center">TOTAL CALLS</Text></YStack>
                    <YStack flex={1} alignItems="center" backgroundColor={isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff'} padding="$2" borderRadius={12}><View style={[styles.iconBadgeSmall, { backgroundColor: '#e0e7ff' }]}><Clock color="#6366f1" size={14} /></View><Text fontSize={18} fontWeight="900" color="#4f46e5" marginTop="$2">{formatDuration(totalDuration)}</Text><Text fontSize={10} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} fontWeight="700" marginTop="$1" textAlign="center">DURATION</Text></YStack>
                    <YStack flex={1} alignItems="center" backgroundColor={isDark ? 'rgba(217,70,239,0.1)' : '#fdf4ff'} padding="$2" borderRadius={12}><View style={[styles.iconBadgeSmall, { backgroundColor: '#fae8ff' }]}><Calendar color="#d946ef" size={14} /></View><Text fontSize={16} fontWeight="900" color="#c026d3" marginTop="$2">{lastCall ? new Date(lastCall.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '-'}</Text><Text fontSize={10} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} fontWeight="700" marginTop="$1" textAlign="center">LAST CALL</Text></YStack>
                  </XStack>
                  <XStack alignItems="center" justifyContent="flex-end" paddingHorizontal="$2"><Text style={styles.seeAllText}>See all call logs</Text><ChevronRight color="#005eb8" size={16} style={{ marginLeft: 2 }} /></XStack>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View entering={FadeIn.delay(760)}>
            <TouchableOpacity style={styles.muteBtnShadow} activeOpacity={0.8} onPress={async () => { Platform.OS !== 'web' && Haptics.selectionAsync(); const prev = isMuted; setIsMuted(!prev); try { await api.toggleMuteUser(id); } catch (err) { setIsMuted(prev); } }}>
              <View style={styles.muteBtn}>
                <View style={[styles.iconBadge, { backgroundColor: isMuted ? (isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9') : '#e0f2fe' }]}>{isMuted ? <BellOff color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={18} /> : <Bell color="#005eb8" size={18} />}</View>
                <YStack flex={1} marginLeft="$3"><Text fontWeight="700" fontSize={15} color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</Text><Text fontSize={13} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={2}>{isMuted ? 'Tap to unmute' : 'Silence messages from this contact'}</Text></YStack>
                <View style={styles.toggleTrack}><LinearGradient colors={isMuted ? ['#6366f1', '#8b5cf6'] : ['#e2e8f0', '#cbd5e1']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} /><View style={[styles.toggleThumb, isMuted && styles.toggleThumbActive]} /></View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(820)}>
            <ScaleButton isDanger style={isBlocked ? styles.unblockShadow : styles.blockShadow} onPress={toggleBlock}>
              <View style={[styles.dangerBtn, { backgroundColor: isBlocked ? '#16a34a' : '#ef4444' }]}><XStack alignItems="center" space="$2" zIndex={1}>{isBlocked ? <ShieldAlert color="#fff" size={20} /> : <Ban color="#fff" size={20} />}<Text color="#fff" fontWeight="800" fontSize={15} letterSpacing={0.5}>{isBlocked ? 'UNBLOCK USER' : 'BLOCK USER'}</Text></XStack></View>
            </ScaleButton>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(880)}>
            <TouchableOpacity style={styles.reportBtnGhost} activeOpacity={0.6} onPress={() => { const doReport = async () => { try { await api.reportUser(id, 'Reported from profile screen'); Alert.alert('Reported', 'Thank you. Our team will review this user shortly.'); } catch (e) { Alert.alert('Error', 'Failed to submit report.'); } }; if (Platform.OS === 'web') { if (window.confirm('Report this user?')) doReport(); } else Alert.alert('Report User', 'Report this user to the moderation team?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Report', style: 'destructive', onPress: doReport }]); }}>
              <XStack alignItems="center" space="$2" justifyContent="center"><Flag color={TOKENS.COLORS.DANGER} size={16} /><Text color={TOKENS.COLORS.DANGER} fontWeight="700" fontSize={14}>Report User</Text></XStack>
            </TouchableOpacity>
          </Animated.View>
        </YStack>
      </ScrollView>
    </GradientBackground>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  cover: { width: '100%', height: COVER_HEIGHT },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 44, zIndex: 10 },
  glassBtn: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', marginTop: -(AVATAR_SIZE / 2) - 10 },
  avatarRing: { width: AVATAR_SIZE+10, height: AVATAR_SIZE+10, borderRadius: (AVATAR_SIZE+10)/2, padding: 5, ...TOKENS.SHADOWS.ELEVATED },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE/2, backgroundColor: isDark ? '#334155' : '#f1f5f9', overflow: 'hidden' },
  actionRoundShadowMessage: { elevation: 3, borderRadius: 27, borderWidth: 1, borderColor: isDark ? 'rgba(0, 94, 184, 0.3)' : '#bfdbfe', backgroundColor: isDark ? 'rgba(0, 94, 184, 0.12)' : '#eff6ff' },
  actionRoundShadowAudio: { elevation: 3, borderRadius: 27, borderWidth: 1, borderColor: isDark ? 'rgba(14, 165, 233, 0.3)' : '#bae6fd', backgroundColor: isDark ? 'rgba(14, 165, 233, 0.12)' : '#f0f9ff' },
  actionRoundShadowVideo: { elevation: 3, borderRadius: 27, borderWidth: 1, borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : '#ddd6fe', backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#f5f3ff' },
  actionRound: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  infoCard: { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#fff', borderRadius: TOKENS.RADIUS.LG, padding: 16, flexDirection: 'row', alignItems: 'center', ...TOKENS.SHADOWS.SUBTLE, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' },
  iconBadgeBlue: { width:40, height:40, borderRadius: TOKENS.RADIUS.LG, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  iconBadgeEmerald: { width:40, height:40, borderRadius: TOKENS.RADIUS.LG, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  iconBadgePurple: { width:40, height:40, borderRadius: TOKENS.RADIUS.LG, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  iconBadgeSmall: { width:28, height:28, borderRadius: TOKENS.RADIUS.MD, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { width:40, height:40, borderRadius: TOKENS.RADIUS.LG, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '600', marginTop: 2 },
  cardBio: { fontSize: 15, color: isDark ? '#cbd5e1' : '#334155', fontWeight: '400', marginTop: 4, lineHeight: 22 },
  statsCardShadow: { ...TOKENS.SHADOWS.ELEVATED, borderRadius: TOKENS.RADIUS.LG, backgroundColor: isDark ? '#1e293b' : '#ffffff' },
  statsCard: { borderRadius: TOKENS.RADIUS.LG, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e0e7ff' },
  seeAllText: { fontSize: 14, color: isDark ? '#60a5fa' : '#005eb8', fontWeight: '700' },
  muteBtnShadow: { ...TOKENS.SHADOWS.SUBTLE, borderRadius: TOKENS.RADIUS.LG, backgroundColor: isDark ? '#1e293b' : '#ffffff' },
  muteBtn: { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#fff', borderRadius: TOKENS.RADIUS.LG, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f4ff' },
  toggleTrack: { width: 50, height: 28, borderRadius: TOKENS.RADIUS.MD, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 3 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: isDark ? '#1e293b' : '#fff', alignSelf: 'flex-start', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  toggleThumbActive: { alignSelf: 'flex-end' },
  blockShadow: { shadowColor: '#ef4444', shadowOffset: {width:0,height:8}, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8, borderRadius: TOKENS.RADIUS.LG, backgroundColor: isDark ? '#1e293b' : '#ffffff' },
  unblockShadow: { shadowColor: '#16a34a', shadowOffset: {width:0,height:8}, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8, borderRadius: TOKENS.RADIUS.LG, backgroundColor: isDark ? '#1e293b' : '#ffffff' },
  dangerBtn: { borderRadius: TOKENS.RADIUS.LG, padding: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  reportBtnGhost: { borderRadius: TOKENS.RADIUS.LG, padding: 16, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca', alignItems: 'center', marginTop: 8 },
  photoViewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  photoViewerCloseWrapper: { position: 'absolute', top: 48, right: 20, zIndex: 10 },
  fullPhoto: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
});