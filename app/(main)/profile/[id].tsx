import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView, TouchableOpacity, View, Image, ActivityIndicator,
  StyleSheet, Platform, Alert, ImageBackground, Modal, Dimensions, StatusBar
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Globe, MessageSquare, Phone, Video, Ban, ShieldAlert,
  Flag, Bell, BellOff, Calendar, MoreVertical, X
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../../src/components/ThemeComponents';
import { api } from '../../../src/services/api';
import { supabase } from '../../../src/services/supabase';
import Animated, {
  FadeInUp, FadeInDown, ZoomIn, SlideInRight, FadeIn
} from 'react-native-reanimated';
import { useCall } from '../../../src/context/CallContext';
import { useAuth } from '../../../src/context/AuthContext';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 110;
const COVER_HEIGHT = 200;

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
const getAvatarColor = (name: string) => {
  if (!name) return '#64748b';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const formatMemberSince = (dateStr: string) => {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { year: 'numeric', month: 'long' });
};

const formatDuration = (sec: number) => {
  if (!sec || sec === 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { startVoiceCall, callHistory } = useCall();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(currentUser?.settings?.muted_users?.includes(id) || false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Compute shared call stats from callHistory
  const sharedCalls = callHistory?.filter((c: any) => c.peer?.id === id) || [];
  const totalDuration = sharedCalls.reduce((acc: number, c: any) => acc + (c.durationSeconds || 0), 0);
  const lastCall = sharedCalls[0];

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        // Fetch public profile from new backend endpoint
        const res = await api.getPublicProfile(id);
        if (res.success && res.user) {
          setProfile(res.user);
        }

        // Check block status
        if (currentUser?.id) {
          const blockRes = await api.getBlockedUsers();
          if (blockRes.success && (blockRes.blockedUsers || blockRes.users)) {
            const blockedList = blockRes.blockedUsers || blockRes.users;
            setIsBlocked(blockedList.some((u: any) => u.id === id || u.blocked_id === id));
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, currentUser?.id]);

  const handleChat = () => router.push(`/chat/${id}`);

  const handleVoiceCall = async () => {
    if (!profile) return;
    Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await startVoiceCall(profile, false);
      router.push(`/call/${res.call.id}`);
    } catch (err) {
      if (Platform.OS === 'web') alert('Could not start call.');
    }
  };

  const handleVideoCall = async () => {
    if (!profile) return;
    Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await startVoiceCall(profile, true);
      router.push(`/call/${res.call.id}?isVideo=true`);
    } catch (err) {
      if (Platform.OS === 'web') alert('Could not start video call.');
    }
  };

  const toggleBlock = async () => {
    if (!currentUser?.id || !id) return;
    Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      if (isBlocked) {
        await api.unblockUser(id as string);
        setIsBlocked(false);
      } else {
        const confirm = Platform.OS === 'web'
          ? window.confirm(`Block ${profile?.name || 'this user'}?`)
          : await new Promise(resolve => Alert.alert('Block User', `Block ${profile?.name}?`, [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Block', style: 'destructive', onPress: () => resolve(true) }
            ]));
        if (!confirm) return;
        await api.blockUser(id as string);
        setIsBlocked(true);
      }
    } catch (err) {
      console.error('Block/unblock error:', err);
    }
  };

  const initial = profile?.name?.charAt(0)?.toUpperCase() || '?';
  const avatarBg = getAvatarColor(profile?.name || '');

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1120', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#005eb8" size="large" />
      </View>
    );
  }

  return (
    <GradientBackground style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen Photo Viewer */}
      <Modal visible={showPhotoViewer} transparent animationType="fade">
        <View style={styles.photoViewer}>
          <TouchableOpacity style={styles.photoViewerClose} onPress={() => setShowPhotoViewer(false)}>
            <X color="#fff" size={28} />
          </TouchableOpacity>
          {profile?.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.fullPhoto} resizeMode="contain" />
          ) : (
            <View style={[styles.fullPhoto, { backgroundColor: avatarBg, justifyContent: 'center', alignItems: 'center' }]}>
              <Text color="#fff" fontSize={80} fontWeight="900">{initial}</Text>
            </View>
          )}
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        {/* ─── Cover + Avatar Hero Section ─── */}
        <Animated.View entering={FadeInDown.duration(600)}>
          {profile?.chatWallpaper ? (
            <ImageBackground source={{ uri: profile.chatWallpaper }} style={styles.cover} blurRadius={8}>
              <View style={styles.coverOverlay} />
            </ImageBackground>
          ) : (
            <View style={styles.coverGradient} />
          )}
        </Animated.View>

        {/* Back & Options header (absolutely positioned over cover) */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptions(!showOptions)} style={styles.headerIconBtn}>
            <MoreVertical color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {/* Avatar overlapping the cover */}
        <View style={styles.avatarSection}>
          <Animated.View entering={ZoomIn.springify().delay(200)}>
            <TouchableOpacity onPress={() => setShowPhotoViewer(true)} activeOpacity={0.85}>
              <View style={styles.avatarRing}>
                {profile?.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: avatarBg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text color="#fff" fontSize={44} fontWeight="900">{initial}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(350)} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text fontSize={24} fontWeight="800" color="#0f172a">{profile?.name || 'Unknown User'}</Text>
            <XStack alignItems="center" space="$1" marginTop={4} opacity={0.6}>
              <Globe color="#64748b" size={13} />
              <Text fontSize={13} color="#64748b">{profile?.language || 'English'}</Text>
            </XStack>
          </Animated.View>
        </View>

        {/* ─── Quick Action Buttons ─── */}
        <Animated.View entering={FadeInUp.delay(450)}>
          <XStack justifyContent="center" space="$4" marginTop="$5" paddingHorizontal="$6">
            <TouchableOpacity style={styles.actionPrimary} onPress={handleChat} activeOpacity={0.85}>
              <MessageSquare color="#fff" size={20} />
              <Text color="#fff" fontWeight="700" fontSize={15} marginLeft="$2">Message</Text>
            </TouchableOpacity>
            <YStack alignItems="center" space="$1">
              <TouchableOpacity style={styles.actionRound} onPress={handleVoiceCall} activeOpacity={0.85}>
                <Phone color="#005eb8" size={22} />
              </TouchableOpacity>
              <Text fontSize={11} color="#94a3b8">Audio</Text>
            </YStack>
            <YStack alignItems="center" space="$1">
              <TouchableOpacity style={styles.actionRound} onPress={handleVideoCall} activeOpacity={0.85}>
                <Video color="#005eb8" size={22} />
              </TouchableOpacity>
              <Text fontSize={11} color="#94a3b8">Video</Text>
            </YStack>
          </XStack>
        </Animated.View>

        {/* ─── Info Cards ─── */}
        <YStack paddingHorizontal="$4" marginTop="$6" space="$3">

          {/* Status / Bio */}
          <Animated.View entering={SlideInRight.delay(500).springify()}>
            <View style={styles.infoCard}>
              <Text style={styles.cardLabel}>Status</Text>
              <Text style={styles.cardValue}>{profile?.status || 'Hey there! I am using UNICOM.'}</Text>
            </View>
          </Animated.View>

          {/* Phone */}
          {profile?.phone && (
            <Animated.View entering={SlideInRight.delay(580).springify()}>
              <View style={styles.infoCard}>
                <Text style={styles.cardLabel}>Phone</Text>
                <XStack alignItems="center" space="$2" marginTop={4}>
                  <Phone color="#005eb8" size={16} />
                  <Text style={styles.cardValue}>{profile.phone}</Text>
                </XStack>
              </View>
            </Animated.View>
          )}

          {/* Member Since */}
          {profile?.memberSince && (
            <Animated.View entering={SlideInRight.delay(640).springify()}>
              <View style={styles.infoCard}>
                <Text style={styles.cardLabel}>Member Since</Text>
                <XStack alignItems="center" space="$2" marginTop={4}>
                  <Calendar color="#005eb8" size={16} />
                  <Text style={styles.cardValue}>{formatMemberSince(profile.memberSince)}</Text>
                </XStack>
              </View>
            </Animated.View>
          )}

          {/* Shared Call Stats */}
          {sharedCalls.length > 0 && (
            <Animated.View entering={SlideInRight.delay(700).springify()}>
              <TouchableOpacity style={styles.statsCard} onPress={() => router.push(`/call-info/${id}`)}>
                <Text style={[styles.cardLabel, { marginBottom: 10 }]}>📊 Call History with this contact</Text>
                <XStack space="$6">
                  <YStack alignItems="center">
                    <Text fontSize={22} fontWeight="800" color="#005eb8">{sharedCalls.length}</Text>
                    <Text fontSize={12} color="#94a3b8">Total Calls</Text>
                  </YStack>
                  <View style={styles.statsDivider} />
                  <YStack alignItems="center">
                    <Text fontSize={22} fontWeight="800" color="#005eb8">{formatDuration(totalDuration)}</Text>
                    <Text fontSize={12} color="#94a3b8">Total Duration</Text>
                  </YStack>
                  {lastCall && (
                    <>
                      <View style={styles.statsDivider} />
                      <YStack alignItems="center">
                        <Text fontSize={14} fontWeight="700" color="#005eb8">
                          {new Date(lastCall.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                        <Text fontSize={12} color="#94a3b8">Last Call</Text>
                      </YStack>
                    </>
                  )}
                </XStack>
                <Text style={styles.seeAllText}>See all call logs →</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

            {/* Mute Toggle */}
            <Animated.View entering={FadeIn.delay(760)}>
              <TouchableOpacity
                style={styles.muteBtn}
                onPress={async () => { 
                  Platform.OS !== 'web' && Haptics.selectionAsync();
                  const previousState = isMuted;
                  setIsMuted(!previousState);
                  try {
                    await api.toggleMuteUser(id);
                  } catch (err) {
                    setIsMuted(previousState);
                    console.error('Failed to toggle mute:', err);
                  }
                }}
              >
                <XStack alignItems="center" space="$3" flex={1}>
                  {isMuted ? <BellOff color="#64748b" size={20} /> : <Bell color="#64748b" size={20} />}
                  <YStack>
                    <Text fontWeight="600" fontSize={15} color="#0f172a">{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</Text>
                    <Text fontSize={13} color="#94a3b8">{isMuted ? 'Tap to unmute' : 'Silence messages from this contact'}</Text>
                  </YStack>
                </XStack>
                <View style={[styles.togglePill, isMuted && styles.togglePillActive]}>
                  <View style={[styles.toggleDot, isMuted && styles.toggleDotActive]} />
                </View>
              </TouchableOpacity>
            </Animated.View>

          {/* Danger Zone */}
          <Animated.View entering={FadeIn.delay(820)}>
            <TouchableOpacity style={[styles.dangerBtn, isBlocked && styles.dangerBtnActive]} onPress={toggleBlock}>
              <XStack alignItems="center" space="$2">
                {isBlocked ? <ShieldAlert color="#fff" size={20} /> : <Ban color="#fff" size={20} />}
                <Text color="#fff" fontWeight="700" fontSize={15}>
                  {isBlocked ? 'Unblock User' : 'Block User'}
                </Text>
              </XStack>
            </TouchableOpacity>
          </Animated.View>

          {/* Report */}
          <Animated.View entering={FadeIn.delay(880)}>
            <TouchableOpacity 
              style={styles.reportBtn} 
              onPress={() => {
                Alert.alert(
                  "Report User",
                  "Are you sure you want to report this user to the moderation team?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Report", 
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await api.reportUser(id as string, "Reported from profile screen");
                          Alert.alert("Reported", "Thank you. Our team will review this user shortly.");
                        } catch (e) {
                          Alert.alert("Error", "Failed to submit report.");
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <XStack alignItems="center" space="$2" justifyContent="center">
                <Flag color="#94a3b8" size={18} />
                <Text color="#94a3b8" fontWeight="600" fontSize={14}>Report User</Text>
              </XStack>
            </TouchableOpacity>
          </Animated.View>

        </YStack>
      </ScrollView>
      </GradientBackground>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', height: COVER_HEIGHT },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  coverGradient: {
    width: '100%', height: COVER_HEIGHT,
    backgroundColor: '#005eb8',
    // Simulated gradient via overlay
  },
  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 44,
    zIndex: 10,
  },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -(AVATAR_SIZE / 2) - 4,
  },
  avatarRing: {
    width: AVATAR_SIZE + 8, height: AVATAR_SIZE + 8, borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: '#fff',
    padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#f1f5f9',
  },
  actionPrimary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#005eb8',
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 32,
    shadowColor: '#005eb8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  actionRound: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statsCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statsDivider: { width: 1, backgroundColor: '#f1f5f9', alignSelf: 'stretch' },
  cardLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 16, color: '#0f172a', fontWeight: '500', marginTop: 4 },
  seeAllText: { fontSize: 13, color: '#005eb8', fontWeight: '600', marginTop: 14, textAlign: 'right' },
  muteBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  togglePill: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: '#e2e8f0',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  togglePillActive: { backgroundColor: '#005eb8' },
  toggleDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
    alignSelf: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  toggleDotActive: { alignSelf: 'flex-end' },
  dangerBtn: {
    backgroundColor: '#ef4444', borderRadius: 16, padding: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  dangerBtnActive: { backgroundColor: '#16a34a' },
  reportBtn: {
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  photoViewer: {
    flex: 1, backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center',
  },
  photoViewerClose: {
    position: 'absolute', top: 48, right: 20, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  fullPhoto: {
    width: SCREEN_WIDTH, height: SCREEN_WIDTH,
  },
});
