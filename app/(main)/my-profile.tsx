import React, { useState, useEffect } from 'react';
import {
  ScrollView, TouchableOpacity, View, Image, ActivityIndicator,
  Platform, Modal, TextInput, KeyboardAvoidingView, StyleSheet, Dimensions, Alert,
  ImageBackground
} from 'react-native';
import { YStack, XStack, Text, Avatar } from 'tamagui';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  User, ShieldBan, LogOut, Bell, Moon, ChevronRight, Settings,
  Unlock, Camera, Edit2, X, Check, QrCode, Phone as PhoneIcon,
  Info, Eye, Image as ImageIcon, CheckCheck, Database, Globe,
  CreditCard, HelpCircle, ShieldAlert, Sparkles, Zap, Lock,
  UserX, ChevronDown, ChevronUp, Shield, MessageSquare, Users
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../src/components/ThemeComponents';
import { supabase } from '../../src/services/supabase';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import { useCall } from '../../src/context/CallContext';
import Animated, {
  FadeInUp, FadeInDown, ZoomIn, SlideInRight, useSharedValue,
  useAnimatedStyle, withSpring, interpolateColor
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 180;
const AVATAR_SIZE = 100;

// ─── Animated Toggle ──────────────────────────────────────────────
const AnimatedToggle = ({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) => {
  const progress = useSharedValue(value ? 1 : 0);
  useEffect(() => { progress.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 120 }); }, [value]);
  const containerStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(progress.value, [0, 1], ['#e2e8f0', '#005eb8']) }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 20 }] }));
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.toggleTrack, containerStyle]}>
        <Animated.View style={[styles.toggleThumb, thumbStyle]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Section Row Item ─────────────────────────────────────────────
const SettingRow = ({
  icon, label, subtitle, iconBg, iconColor, rightElement, onPress, isLast = false
}: any) => (
  <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} disabled={!onPress}>
    <View style={styles.settingRow}>
        <XStack alignItems="center" space="$3" flex={1}>
          <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
            {React.cloneElement(icon, { color: iconColor, size: 20 })}
          </View>
          <View style={[ { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0, borderBottomColor: '#cbd5e1' } ]}>
            <YStack flex={1}>
              <Text fontWeight="600" fontSize={16} color="#0f172a">{label}</Text>
              {subtitle && <Text fontSize={13} color="#64748b" marginTop={2}>{subtitle}</Text>}
            </YStack>
            {rightElement ?? (onPress ? <ChevronRight color="#cbd5e1" size={20} /> : null)}
          </View>
        </XStack>
      </View>
  </TouchableOpacity>
);

// ─── Section Card ─────────────────────────────────────────────────
const SectionCard = ({ title, children, delay = 0 }: any) => (
  <Animated.View entering={SlideInRight.delay(delay).springify()} style={styles.sectionCard}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <View style={styles.sectionBody}>{children}</View>
  </Animated.View>
);

// ─── Main Screen ──────────────────────────────────────────────────
export default function MyProfileScreen() {
  const { user, updateUserProfile, logout } = useAuth();
  const { callHistory } = useCall();
  const router = useRouter();

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);

  const [editNameModal, setEditNameModal] = useState(false);
  const [editBioModal, setEditBioModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState<{ visible: boolean; type: string }>({ visible: false, type: '' });
  const [languageModal, setLanguageModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);

  const [newName, setNewName] = useState(user?.name || '');
  const [newBio, setNewBio] = useState(user?.status || 'Hey there! I am using UNICOM.');
  const [nativeLanguage, setNativeLanguage] = useState(user?.language || 'en');
  const [savingName, setSavingName] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(user?.theme === 'dark');
  const defaultPrivacy = { lastSeen: 'everyone', profilePhoto: 'everyone', readReceipts: true };
  const [privacy, setPrivacy] = useState(user?.privacy || defaultPrivacy);

  const [bankDetails, setBankDetails] = useState({
    bankName: user?.privacy?.bank_details?.bankName || '',
    accountHolder: user?.privacy?.bank_details?.accountHolder || '',
    routingNumber: user?.privacy?.bank_details?.routingNumber || '',
    accountNumber: user?.privacy?.bank_details?.accountNumber || ''
  });
  const [cryptoDetails, setCryptoDetails] = useState({
    network: user?.privacy?.crypto_details?.network || 'TRC20',
    walletAddress: user?.privacy?.crypto_details?.walletAddress || ''
  });
  const [paymentTab, setPaymentTab] = useState<'bank' | 'crypto'>('bank');
  const [savingPayment, setSavingPayment] = useState(false);

  // Stats
  const totalCalls = callHistory?.length || 0;
  const totalDurationSec = callHistory?.reduce((acc: number, c: any) => acc + (c.durationSeconds || 0), 0) || 0;
  const totalDurationMin = Math.floor(totalDurationSec / 60);
  const quotaUsed = user?.translated_minutes_used_today || 0;
  const quotaPct = Math.min(100, (quotaUsed / 100) * 100);

  const LANGS: Record<string, string> = { en: 'English', bn: 'Bengali', hi: 'Hindi', ar: 'Arabic', es: 'Spanish', fr: 'French', zh: 'Chinese' };

  useEffect(() => {
    setNewName(user?.name || '');
    setNewBio(user?.status || 'Hey there! I am using UNICOM.');
    if (user?.privacy) setPrivacy(user.privacy);
    fetchBlockedUsers();
  }, [user]);

  const fetchBlockedUsers = async () => {
    if (!user?.id) return;
    setLoadingBlocks(true);
    try {
      const res = await api.getBlockedUsers();
      if (res.success && res.blockedUsers) {
        setBlockedUsers(res.blockedUsers);
      } else {
        setBlockedUsers([]);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingBlocks(false); }
  };

  const handleUnblock = async (blockedId: string, name: string) => {
    Platform.OS !== 'web' && Haptics.impactAsync();
    try {
      const res = await api.unblockUser(blockedId);
      if (res.success) {
        setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
      }
    } catch (err) { console.error(err); }
  };

  const pickAndUploadImage = async () => {
    try {
      Platform.OS !== 'web' && Haptics.impactAsync();
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
      if (!result.canceled && result.assets?.length > 0) {
        setIsUploading(true);
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop() || 'jpg';
        const fileName = `avatar_${Date.now()}.${ext}`;
        try {
          let res;
          if (Platform.OS === 'web' && asset.base64) res = await api.uploadBase64(asset.base64, fileName, `image/${ext}`, 'profile');
          else res = await api.uploadFile({ uri: asset.uri, name: fileName, type: `image/${ext}` }, 'profile');
          if (res.success) await updateUserProfile({ profile_picture: res.file.url });
        } catch (e: any) {
          console.error(e);
          if (Platform.OS === 'web') alert('Upload failed: ' + e.message);
        } finally { setIsUploading(false); }
      }
    } catch (e) { setIsUploading(false); }
  };

  const pickAndUploadWallpaper = async () => {
    try {
      Platform.OS !== 'web' && Haptics.impactAsync();
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [9, 16], quality: 0.6, base64: true });
      if (!result.canceled && result.assets?.length > 0) {
        setIsUploadingWallpaper(true);
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop() || 'jpg';
        const fileName = `wallpaper_${Date.now()}.${ext}`;
        try {
          let res;
          if (Platform.OS === 'web' && asset.base64) res = await api.uploadBase64(asset.base64, fileName, `image/${ext}`, 'chat');
          else res = await api.uploadFile({ uri: asset.uri, name: fileName, type: `image/${ext}` }, 'chat');
          if (res.success) await updateUserProfile({ chat_wallpaper: res.file.url });
        } catch (e: any) { console.error(e); }
        finally { setIsUploadingWallpaper(false); }
      }
    } catch (e) { setIsUploadingWallpaper(false); }
  };

  const togglePrivacy = async (key: string, val: any) => {
    Platform.OS !== 'web' && Haptics.impactAsync();
    const updated = { ...privacy, [key]: val };
    setPrivacy(updated);
    await updateUserProfile({ privacy: updated });
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === user?.name) return setEditNameModal(false);
    setSavingName(true);
    try { await updateUserProfile({ name: newName.trim() }); setEditNameModal(false); }
    catch (e) { console.error(e); } finally { setSavingName(false); }
  };

  const handleSaveBio = async () => {
    if (!newBio.trim() || newBio.trim() === user?.status) return setEditBioModal(false);
    setSavingBio(true);
    try { await updateUserProfile({ status: newBio.trim() }); setEditBioModal(false); }
    catch (e) { console.error(e); } finally { setSavingBio(false); }
  };

  const initial = (user?.name || 'U').charAt(0).toUpperCase();
  const isPro = user?.plan === 'premium';

  return (
    <GradientBackground style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* ─── HERO HEADER ─── */}
          <Animated.View entering={FadeInDown.duration(600)}>
            {/* Cover */}
            <View style={[styles.cover, { overflow: 'hidden' }]}>
              { (user?.avatar || user?.profile_picture) ? (
                <ImageBackground source={{ uri: (user?.avatar || user?.profile_picture) }} style={StyleSheet.absoluteFillObject} blurRadius={30}>
                  <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,94,184,0.4)'}} />
                </ImageBackground>
              ) : (
                <View style={{...StyleSheet.absoluteFillObject, backgroundColor: '#005eb8'}} />
              )}
              <View style={styles.coverTopRow}>
                <View />
                <TouchableOpacity style={styles.coverIconBtn} onPress={() => setQrModal(true)}>
                  <QrCode color="#fff" size={22} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Avatar overlapping cover */}
            <View style={styles.avatarArea}>
              <Animated.View entering={ZoomIn.springify().delay(200)}>
                <TouchableOpacity onPress={pickAndUploadImage} disabled={isUploading} style={styles.avatarRing}>
                  {isUploading ? (
                    <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' }]}>
                      <ActivityIndicator color="#005eb8" />
                    </View>
                  ) : (
                    <Avatar circular size={100} style={styles.avatar}>
                      {(user?.avatar || user?.profile_picture) && <Avatar.Image src={user.avatar} />}
                      <Avatar.Fallback backgroundColor="#005eb8" justifyContent="center" alignItems="center">
                        <Text color="#fff" fontSize={42} fontWeight="bold">
                          {(user?.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </Avatar.Fallback>
                    </Avatar>
                  )}
                  <View style={styles.cameraBtn}>
                    <Camera color="#fff" size={14} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Name & plan */}
            <Animated.View entering={FadeInUp.delay(350)} style={styles.nameArea}>
              <XStack alignItems="center" space="$2" justifyContent="center">
                <TouchableOpacity onPress={() => setEditNameModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text fontSize={24} fontWeight="900" color="#0f172a" letterSpacing={-0.5}>
                    {user?.name || 'My Profile'}
                  </Text>
                  <Edit2 color="#94a3b8" size={15} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <View style={[styles.planBadge, { backgroundColor: isPro ? '#f59e0b' : '#005eb8' }]}>
                  {isPro ? <Zap color="#fff" size={10} /> : null}
                  <Text color="#fff" fontSize={10} fontWeight="800" marginLeft={isPro ? 2 : 0}>
                    {isPro ? 'PRO' : 'FREE'}
                  </Text>
                </View>
              </XStack>
              <Text fontSize={13} color="#64748b" marginTop={4}>{user?.phone || user?.phone_number || '+880 1XXX-XXXXXX'}</Text>

              {/* Bio chip */}
              <TouchableOpacity onPress={() => setEditBioModal(true)} style={styles.bioChip}>
                <Text fontSize={13} color="#475569" numberOfLines={1} flex={1}>
                  {user?.status || 'Hey there! I am using UNICOM.'}
                </Text>
                <Edit2 color="#94a3b8" size={12} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </Animated.View>

            {/* Stats Row */}
            <Animated.View entering={FadeInUp.delay(450)} style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text fontSize={20} fontWeight="800" color="#005eb8">{totalCalls}</Text>
                <Text fontSize={11} color="#94a3b8" marginTop={2}>Total Calls</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text fontSize={20} fontWeight="800" color="#005eb8">{totalDurationMin}m</Text>
                <Text fontSize={11} color="#94a3b8" marginTop={2}>Call Duration</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text fontSize={20} fontWeight="800" color="#005eb8">{quotaUsed}</Text>
                <Text fontSize={11} color="#94a3b8" marginTop={2}>AI Mins Used</Text>
              </View>
            </Animated.View>
          </Animated.View>

          <YStack paddingHorizontal="$4" marginTop="$4" space="$3">

            {/* ─── AI QUOTA ─── */}
            <Animated.View entering={SlideInRight.delay(80).springify()}>
              <View style={styles.quotaCard}>
                <XStack alignItems="center" space="$2" marginBottom={10}>
                  <Sparkles color="#7c3aed" size={18} />
                  <Text fontWeight="700" fontSize={15} color="#0f172a">AI Translation Quota</Text>
                  <View style={{ flex: 1 }} />
                  <Text fontWeight="700" color="#005eb8" fontSize={13}>{quotaUsed} / 100 min</Text>
                </XStack>
                <View style={styles.quotaTrack}>
                  <View style={[styles.quotaFill, { width: `${quotaPct}%`, backgroundColor: quotaPct > 80 ? '#ef4444' : '#005eb8' }]} />
                </View>
                <Text fontSize={12} color="#94a3b8" marginTop={8}>
                  {isPro ? 'Unlimited AI translation active' : `${100 - quotaUsed} free minutes remaining today`}
                </Text>
              </View>
            </Animated.View>

            {/* ─── UPGRADE BANNER (Free only) ─── */}
            {!isPro && (
              <Animated.View entering={SlideInRight.delay(100).springify()}>
                <TouchableOpacity style={styles.upgradeBanner} activeOpacity={0.85} onPress={() => Alert.alert("Upgrade to Pro", "In-app purchases are coming soon in the next update!")}>
                  <XStack alignItems="center" space="$3" flex={1}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <Zap color="#fff" size={22} />
                    </View>
                    <YStack flex={1}>
                      <Text color="#fff" fontWeight="800" fontSize={16}>Upgrade to Pro</Text>
                      <Text color="rgba(255,255,255,0.8)" fontSize={13}>Unlimited AI translation, HD calls & more</Text>
                    </YStack>
                    <ChevronRight color="#fff" size={20} />
                  </XStack>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ─── ACCOUNT ─── */}
            <SectionCard title="Account" delay={150}>
              <SettingRow
                icon={<Globe />} iconBg="#eff6ff" iconColor="#005eb8"
                label="Native Language" subtitle={LANGS[nativeLanguage] || 'English'}
                onPress={() => setLanguageModal(true)}
              />
              <SettingRow
                icon={<ImageIcon />} iconBg="#eff6ff" iconColor="#005eb8"
                label="Chat Wallpaper" subtitle={isUploadingWallpaper ? 'Uploading...' : 'Customize chat background'}
                onPress={pickAndUploadWallpaper}
                rightElement={isUploadingWallpaper ? <ActivityIndicator color="#005eb8" /> : undefined}
              />
              <SettingRow
                icon={<CreditCard />} iconBg="#eff6ff" iconColor="#005eb8"
                label="Payment Methods" subtitle="Bank & crypto receiving details"
                onPress={() => setPaymentModal(true)}
                isLast
              />
            </SectionCard>

            {/* ─── PRIVACY & SECURITY ─── */}
            <SectionCard title="Privacy & Security" delay={220}>
              <SettingRow
                icon={<Eye />} iconBg="#f0fdf4" iconColor="#16a34a"
                label="Last Seen & Online" subtitle={`Visible to: ${(privacy.lastSeen || 'everyone').replace('_', ' ')}`}
                onPress={() => setPrivacyModal({ visible: true, type: 'lastSeen' })}
              />
              <SettingRow
                icon={<ImageIcon />} iconBg="#f0fdf4" iconColor="#16a34a"
                label="Profile Photo" subtitle={`Visible to: ${(privacy.profilePhoto || 'everyone').replace('_', ' ')}`}
                onPress={() => setPrivacyModal({ visible: true, type: 'profilePhoto' })}
              />
              <SettingRow
                icon={<CheckCheck />} iconBg="#f0fdf4" iconColor="#16a34a"
                label="Read Receipts" subtitle="Let others know you've read messages"
                rightElement={
                  <AnimatedToggle value={privacy.readReceipts} onValueChange={(val) => togglePrivacy('readReceipts', val)} />
                }
              />
              {/* Blocked Users Expandable */}
              <TouchableOpacity
                  onPress={() => setShowBlockedList(!showBlockedList)}
                  style={styles.settingRow}
                >
                  <XStack alignItems="center" space="$3" flex={1}>
                    <View style={[styles.settingIcon, { backgroundColor: '#fff1f2' }]}>
                      <ShieldBan color="#ef4444" size={20} />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#cbd5e1' }}>
                      <YStack flex={1}>
                        <Text fontWeight="600" fontSize={16} color="#0f172a">Blocked Users</Text>
                        <Text fontSize={13} color="#64748b" marginTop={2}>{blockedUsers.length} blocked</Text>
                      </YStack>
                      {showBlockedList ? <ChevronUp color="#cbd5e1" size={20} /> : <ChevronDown color="#cbd5e1" size={20} />}
                    </View>
                  </XStack>
                </TouchableOpacity>
              {showBlockedList && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                  {loadingBlocks ? (
                    <ActivityIndicator color="#005eb8" style={{ padding: 12 }} />
                  ) : blockedUsers.length === 0 ? (
                    <Text color="#94a3b8" fontSize={14} textAlign="center" padding="$3">No blocked users</Text>
                  ) : (
                    blockedUsers.map(bu => (
                      <XStack key={bu.id} alignItems="center" justifyContent="space-between" paddingVertical={10} borderBottomWidth={1} borderColor="#f1f5f9">
                        <XStack alignItems="center" space="$3">
                          <Avatar circular size={36}>
                              {bu.profile_picture && <Avatar.Image src={bu.profile_picture} />}
                              <Avatar.Fallback backgroundColor="#005eb8" justifyContent="center" alignItems="center">
                                <Text color="#fff" fontSize={16} fontWeight="bold">
                                  {(bu.name || 'U').charAt(0).toUpperCase()}
                                </Text>
                              </Avatar.Fallback>
                            </Avatar>
                          <Text fontWeight="600" color="#0f172a">{bu.name}</Text>
                        </XStack>
                        <TouchableOpacity onPress={() => handleUnblock(bu.id, bu.name)} style={styles.unblockBtn}>
                          <Unlock color="#005eb8" size={13} />
                          <Text color="#005eb8" fontWeight="700" fontSize={12} marginLeft={4}>Unblock</Text>
                        </TouchableOpacity>
                      </XStack>
                    ))
                  )}
                </View>
              )}
              <SettingRow
                icon={<Lock />} iconBg="#f0fdf4" iconColor="#16a34a"
                label="Two-Factor Auth" subtitle="Coming soon"
                onPress={() => Alert.alert('Coming soon', 'This feature is coming soon!')}
                isLast
              />
            </SectionCard>

            {/* ─── APP SETTINGS ─── */}
            <SectionCard title="App Settings" delay={290}>
              <SettingRow
                icon={<Bell />} iconBg="#f5f3ff" iconColor="#7c3aed"
                label="Notifications" subtitle="Push & in-app alerts"
                rightElement={
                  <AnimatedToggle value={notifications} onValueChange={async (val) => {
                    Platform.OS !== 'web' && Haptics.impactAsync();
                    setNotifications(val);
                    await updateUserProfile({ notifications: val });
                  }} />
                }
              isLast
              />
              <SettingRow
                icon={<Moon />} iconBg="#f5f3ff" iconColor="#7c3aed"
                label="Dark Mode" subtitle="Coming soon"
                onPress={() => Alert.alert('Coming soon', 'This feature is coming soon!')}
                rightElement={
                  <View style={styles.comingSoonBadge}>
                    <Text color="#7c3aed" fontSize={10} fontWeight="700">SOON</Text>
                  </View>
                }
                isLast
              />
            </SectionCard>

            {/* ─── HELP & SUPPORT ─── */}
            <SectionCard title="Help & Support" delay={360}>
              <SettingRow
                icon={<HelpCircle />} iconBg="#fef9c3" iconColor="#ca8a04"
                label="Contact Support" subtitle="Report translation issues"
                onPress={() => Alert.alert('Support', 'Contact support@unicom.com')}
              />
              <SettingRow
                icon={<Shield />} iconBg="#fef9c3" iconColor="#ca8a04"
                label="Privacy Policy" subtitle="Read our privacy terms"
                isLast
              />
            </SectionCard>

            {/* ─── LOGOUT ─── */}
            <Animated.View entering={FadeInUp.delay(430)}>
              <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                <LogOut color="#ef4444" size={20} />
                <Text color="#ef4444" fontWeight="700" fontSize={16} marginLeft="$2">Log Out</Text>
              </TouchableOpacity>
            </Animated.View>

            <Text textAlign="center" color="#cbd5e1" fontSize={12} marginTop="$4">UNICOM v{Constants.expoConfig?.version || "1.0.0"} • Built with ♥</Text>

          </YStack>
        </ScrollView>

        {/* ─── MODALS ─── */}

        {/* Edit Name Modal */}
        <Modal visible={editNameModal} transparent animationType="fade" onRequestClose={() => setEditNameModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="800" color="#0f172a">Edit Name</Text>
                <TouchableOpacity onPress={() => setEditNameModal(false)}><X color="#94a3b8" size={24} /></TouchableOpacity>
              </XStack>
              <TextInput
                style={styles.modalInput} value={newName} onChangeText={setNewName}
                placeholder="Your name" placeholderTextColor="#94a3b8" autoFocus
              />
              <TouchableOpacity onPress={handleSaveName} style={styles.modalSaveBtn} disabled={savingName}>
                {savingName ? <ActivityIndicator color="#fff" /> : <Text color="#fff" fontWeight="700" fontSize={16}>Save</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Bio Modal */}
        <Modal visible={editBioModal} transparent animationType="fade" onRequestClose={() => setEditBioModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="800" color="#0f172a">Edit Bio</Text>
                <TouchableOpacity onPress={() => setEditBioModal(false)}><X color="#94a3b8" size={24} /></TouchableOpacity>
              </XStack>
              <TextInput
                style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]} value={newBio}
                onChangeText={setNewBio} placeholder="Your bio" placeholderTextColor="#94a3b8"
                autoFocus multiline
              />
              <TouchableOpacity onPress={handleSaveBio} style={styles.modalSaveBtn} disabled={savingBio}>
                {savingBio ? <ActivityIndicator color="#fff" /> : <Text color="#fff" fontWeight="700" fontSize={16}>Save</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* QR Code Modal */}
        <Modal visible={qrModal} transparent animationType="slide" onRequestClose={() => setQrModal(false)}>
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setQrModal(false)} />
            <Animated.View entering={FadeInUp.springify()} style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="800" color="#0f172a">My QR Code</Text>
                <TouchableOpacity onPress={() => setQrModal(false)}><X color="#94a3b8" size={24} /></TouchableOpacity>
              </XStack>
              <YStack alignItems="center" padding="$4">
                <View style={[styles.qrPlaceholder, { padding: 0, backgroundColor: 'transparent', overflow: 'hidden' }]}>
                  {user?.id && (
                    <QRCode
                      value={`unicom://profile/${user?.phone || user?.id}`}
                      size={160}
                      color="#005eb8"
                      backgroundColor="transparent"
                    />
                  )}
                </View>
                <Text fontSize={18} fontWeight="700" color="#0f172a" marginTop="$4">{user?.name}</Text>
                <Text fontSize={14} color="#64748b" marginTop={4}>{user?.phone_number}</Text>
                <Text fontSize={12} color="#94a3b8" marginTop="$3" textAlign="center">
                  Others can scan this code to add you as a contact instantly
                </Text>
              </YStack>
            </Animated.View>
          </View>
        </Modal>

        {/* Privacy Modal */}
        <Modal visible={privacyModal.visible} transparent animationType="slide" onRequestClose={() => setPrivacyModal({ visible: false, type: '' })}>
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setPrivacyModal({ visible: false, type: '' })} />
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="800" color="#0f172a">
                  Who can see my {privacyModal.type === 'lastSeen' ? 'Last Seen' : 'Profile Photo'}?
                </Text>
                <TouchableOpacity onPress={() => setPrivacyModal({ visible: false, type: '' })}><X color="#94a3b8" size={24} /></TouchableOpacity>
              </XStack>
              {['everyone', 'my_contacts', 'nobody'].map(opt => (
                <TouchableOpacity
                  key={opt} style={styles.privacyOption}
                  onPress={() => { togglePrivacy(privacyModal.type, opt); setPrivacyModal({ visible: false, type: '' }); }}
                >
                  <Text fontSize={16} color="#0f172a" textTransform="capitalize">{opt.replace('_', ' ')}</Text>
                  {privacy[privacyModal.type as keyof typeof privacy] === opt && <Check color="#005eb8" size={20} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Language Modal */}
        <Modal visible={languageModal} transparent animationType="slide" onRequestClose={() => setLanguageModal(false)}>
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setLanguageModal(false)} />
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="800" color="#0f172a">Native Language</Text>
                <TouchableOpacity onPress={() => setLanguageModal(false)}><X color="#94a3b8" size={24} /></TouchableOpacity>
              </XStack>
              {Object.entries(LANGS).map(([code, name]) => (
                <TouchableOpacity
                  key={code} style={styles.privacyOption}
                  onPress={async () => {
                    setNativeLanguage(code);
                    await updateUserProfile({ language: code });
                    setLanguageModal(false);
                  }}
                >
                  <Text fontSize={16} color="#0f172a">{name}</Text>
                  {nativeLanguage === code && <Check color="#005eb8" size={20} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Payment Modal */}
        <Modal visible={paymentModal} transparent animationType="slide" onRequestClose={() => setPaymentModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setPaymentModal(false)} />
            <View style={[styles.bottomSheet, { minHeight: 480 }]}>
              <View style={styles.sheetHandle} />
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="800" color="#0f172a">Payment Details</Text>
                <TouchableOpacity onPress={() => setPaymentModal(false)}><X color="#94a3b8" size={24} /></TouchableOpacity>
              </XStack>
              <XStack backgroundColor="#f1f5f9" borderRadius={12} padding={4} marginBottom="$4">
                {(['bank', 'crypto'] as const).map(tab => (
                  <TouchableOpacity key={tab} style={[styles.tabBtn, paymentTab === tab && styles.tabBtnActive]} onPress={() => setPaymentTab(tab)}>
                    <Text fontWeight="700" color={paymentTab === tab ? '#005eb8' : '#94a3b8'}>{tab === 'bank' ? 'Bank Transfer' : 'Crypto'}</Text>
                  </TouchableOpacity>
                ))}
              </XStack>
              <ScrollView showsVerticalScrollIndicator={false}>
                {paymentTab === 'bank' ? (
                  <YStack space="$3">
                    {[
                      { label: 'Bank Name', key: 'bankName', placeholder: 'e.g. Bank of America' },
                      { label: 'Account Holder Name', key: 'accountHolder', placeholder: `e.g. ${user?.name || 'Your Name'}` },
                      { label: 'Routing Number', key: 'routingNumber', placeholder: 'e.g. 123456789', numeric: true },
                      { label: 'Account Number', key: 'accountNumber', placeholder: 'e.g. 987654321', numeric: true },
                    ].map(f => (
                      <View key={f.key}>
                        <Text color="#64748b" fontSize={12} marginBottom={4} marginLeft={2}>{f.label}</Text>
                        <TextInput
                          style={styles.textInput} placeholder={f.placeholder} placeholderTextColor="#94a3b8"
                          value={(bankDetails as any)[f.key]} onChangeText={t => setBankDetails({ ...bankDetails, [f.key]: t })}
                          keyboardType={f.numeric ? 'numeric' : 'default'}
                        />
                      </View>
                    ))}
                  </YStack>
                ) : (
                  <YStack space="$3">
                    <View>
                      <Text color="#64748b" fontSize={12} marginBottom={4} marginLeft={2}>Network</Text>
                      <TextInput style={styles.textInput} placeholder="e.g. TRC20, ERC20" placeholderTextColor="#94a3b8" value={cryptoDetails.network} onChangeText={t => setCryptoDetails({ ...cryptoDetails, network: t })} />
                    </View>
                    <View>
                      <Text color="#64748b" fontSize={12} marginBottom={4} marginLeft={2}>Wallet Address</Text>
                      <TextInput style={styles.textInput} placeholder="e.g. TNu3...8dKj9L" placeholderTextColor="#94a3b8" value={cryptoDetails.walletAddress} onChangeText={t => setCryptoDetails({ ...cryptoDetails, walletAddress: t })} />
                    </View>
                  </YStack>
                )}
                <TouchableOpacity
                  style={[styles.modalSaveBtn, { marginTop: 24 }]}
                  disabled={savingPayment}
                  onPress={async () => {
                    setSavingPayment(true);
                    try {
                      await api.updateProfile({ bank_details: bankDetails, crypto_details: cryptoDetails });
                      await updateUserProfile({ privacy: { ...privacy, bank_details: bankDetails, crypto_details: cryptoDetails } });
                      setPaymentModal(false);
                    } catch (e) { console.error(e); }
                    finally { setSavingPayment(false); }
                  }}
                >
                  {savingPayment ? <ActivityIndicator color="#fff" /> : <Text color="#fff" fontWeight="700" fontSize={16}>Save Details</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
      </GradientBackground>
  );
}

const styles = StyleSheet.create({
  // Cover
  cover: { height: COVER_HEIGHT, backgroundColor: '#005eb8', justifyContent: 'space-between' },
  coverTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  coverIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  // Avatar
  avatarArea: { alignItems: 'center', marginTop: -(AVATAR_SIZE / 2 + 4) },
  avatarRing: { width: AVATAR_SIZE + 8, height: AVATAR_SIZE + 8, borderRadius: (AVATAR_SIZE + 8) / 2, backgroundColor: '#fff', padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: '#e2e8f0' },
  cameraBtn: { position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: '#005eb8', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  // Name area
  nameArea: { alignItems: 'center', paddingHorizontal: 24, marginTop: 14, marginBottom: 4 },
  planBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  bioChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginTop: 10, maxWidth: SCREEN_WIDTH - 64 },
  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#f1f5f9' },
  // Quota
  quotaCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  quotaTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  quotaFill: { height: '100%', borderRadius: 4 },
  // Upgrade
  upgradeBanner: { borderRadius: 20, padding: 18, backgroundColor: '#005eb8', shadowColor: '#005eb8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  // Section
  sectionCard: { marginBottom: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  sectionBody: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  // Setting Row
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 16, backgroundColor: '#fff' },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  settingIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  // Misc
  unblockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  comingSoonBadge: { backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#fecdd3' },
  // Toggle
  toggleTrack: { width: 50, height: 30, borderRadius: 15, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', width: '88%', borderRadius: 24, padding: 24 },
  modalInput: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, color: '#0f172a', marginBottom: 16 } as any,
  modalSaveBtn: { backgroundColor: '#005eb8', padding: 16, borderRadius: 14, alignItems: 'center' },
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  privacyOption: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qrPlaceholder: { width: 180, height: 180, backgroundColor: '#f0f6ff', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e0eeff', borderStyle: 'dashed' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  textInput: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a' } as any,
});

