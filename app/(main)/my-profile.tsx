// @ts-nocheck
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
  UserX, ChevronDown, ChevronUp, Shield, MessageSquare, Users,
  Clock, Infinity
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../src/components/ThemeComponents';
import { supabase } from '../../src/services/supabase';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useThemeContext } from '../../src/context/ThemeContext';
import QRCode from 'react-native-qrcode-svg';
import { useCall } from '../../src/context/CallContext';
import Animated, {
  FadeInUp, FadeInDown, ZoomIn, SlideInRight, useSharedValue,
  useAnimatedStyle, withSpring, interpolateColor, withRepeat, withTiming
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 180;
const AVATAR_SIZE = 100;

import { LinearGradient } from 'expo-linear-gradient';

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

const ShimmerSweep = () => {
  const transX = useSharedValue(-200);
  useEffect(() => { transX.value = withRepeat(withTiming(400, { duration: 2500 }), -1, false); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: transX.value }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style, { width: 150, left: -75, zIndex: 1, opacity: 0.5 }]}>
      <LinearGradient colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
};

const CountUpNumber = ({ endValue, style }: { endValue: number, style: any }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = endValue / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= endValue) {
        setVal(endValue);
        clearInterval(timer);
      } else {
        setVal(Math.floor(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [endValue]);
  return <Text style={style}>{val}</Text>;
};

// ─── Animated Toggle ──────────────────────────────────────────────
const AnimatedToggle = ({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) => {
  const { isDark } = useThemeContext();
  const styles = getStyles(isDark);
  const progress = useSharedValue(value ? 1 : 0);
  useEffect(() => { progress.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 120 }); }, [value]);
  
  const containerStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(progress.value, [0, 1], ['#e2e8f0', '#005eb8']) }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 20 }] }));
  
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.toggleTrack, containerStyle, { overflow: 'hidden' }]}>
        {value && <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />}
        <Animated.View style={[styles.toggleThumb, thumbStyle, { shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.15, shadowRadius: 3 }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Section Row Item ─────────────────────────────────────────────
import { TouchableHighlight } from 'react-native';
import { TOKENS } from '../../src/theme/tokens';


const SettingRow = ({
  icon, label, subtitle, iconColors, iconColor, rightElement, onPress, isLast = false
}: any) => {
  const { isDark } = useThemeContext();
  const styles = getStyles(isDark);
  return (
  <TouchableHighlight activeOpacity={1} underlayColor={isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} onPress={onPress} disabled={!onPress}>
    <View style={[styles.settingRow, { backgroundColor: isDark ? 'transparent' : '#fff' }]}>
        <XStack alignItems="center" space="$3" flex={1}>
          <View style={[styles.settingIcon, { overflow: 'hidden' }]}>
            {iconColors ? (
              <LinearGradient colors={iconColors} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#eff6ff' }]} />
            )}
            <View style={{ zIndex: 1 }}>{React.cloneElement(icon, { color: iconColor || '#fff', size: 20 })}</View>
          </View>
          <View style={[ { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' } ]}>
            <YStack flex={1}>
              <Text fontWeight="600" fontSize={16} color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>{label}</Text>
              {subtitle && <Text fontSize={13} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={2}>{subtitle}</Text>}
            </YStack>
            {rightElement ?? (onPress ? <View style={[styles.chevronWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f8fafc' }]}><ChevronRight color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={16} /></View> : null)}
          </View>
        </XStack>
      </View>
  </TouchableHighlight>
  );
};

// ─── Section Card ─────────────────────────────────────────────────
const SectionCard = ({ title, children, delay = 0 }: any) => {
  const { isDark } = useThemeContext();
  return (
  <Animated.View entering={SlideInRight.delay(delay).springify()} style={styles.sectionCard}>
    {title && (
      <XStack alignItems="center" space="$2" style={styles.sectionTitleWrapper}>
        <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={{ width: 4, height: 14, borderRadius: 2 }} />
        <Text style={[styles.sectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{title}</Text>
      </XStack>
    )}
    <View style={[styles.sectionBody, { backgroundColor: isDark ? 'rgba(30,41,59,0.7)' : '#fff' }]}>
      <View style={styles.cardGlassTop} />
      {children}
    </View>
  </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────
export default function MyProfileScreen() {
  const { user, updateUserProfile, logout } = useAuth();
  const { theme, setTheme, isDark } = useThemeContext();
  const styles = getStyles(isDark);
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
                <ImageBackground source={{ uri: (user?.avatar || user?.profile_picture) }} style={StyleSheet.absoluteFill} blurRadius={30}>
                  <LinearGradient colors={['rgba(0,94,184,0.4)', 'rgba(99,102,241,0.6)']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                </ImageBackground>
              ) : (
                <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY_DARK} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
              )}
              
              {/* Subtle bottom fade for smooth transition */}
              <LinearGradient colors={isDark ? ['transparent', 'transparent'] : ['transparent', 'rgba(244,248,255,0.6)']} start={{x:0, y:0.5}} end={{x:0, y:1}} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 }} />

              <View style={styles.coverTopRow}>
                <ScaleButton style={styles.coverIconBtn} onPress={() => setQrModal(true)}>
                  <QrCode color="#fff" size={20} />
                </ScaleButton>
              </View>
            </View>

            {/* Avatar overlapping cover */}
            <View style={styles.avatarArea}>
              <Animated.View entering={ZoomIn.springify().delay(200)}>
                <TouchableOpacity onPress={pickAndUploadImage} disabled={isUploading}>
                  {/* Gradient ring behind */}
                  <View style={styles.avatarOuterRing}>
                    <LinearGradient colors={TOKENS.GRADIENTS.AI} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                    {/* White ring inset */}
                    <View style={styles.avatarRing}>
                      {isUploading ? (
                        <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' }]}>
                          <ActivityIndicator color="#005eb8" />
                        </View>
                      ) : (
                        <Avatar circular size={AVATAR_SIZE} style={styles.avatar}>
                          {(user?.avatar || user?.profile_picture) && <Avatar.Image src={user?.avatar || user?.profile_picture} />}
                          <Avatar.Fallback backgroundColor="#005eb8" justifyContent="center" alignItems="center">
                            <Text color="#fff" fontSize={42} fontWeight="bold">
                              {(user?.name || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </Avatar.Fallback>
                        </Avatar>
                      )}
                    </View>
                  </View>
                  {/* Camera button */}
                  <View style={styles.cameraBtn}>
                    <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                    <Camera color="#fff" size={14} style={{ zIndex: 1 }} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Name & plan */}
            <Animated.View entering={FadeInUp.delay(350)} style={styles.nameArea}>
              <XStack alignItems="center" space="$2" justifyContent="center">
                <TouchableOpacity onPress={() => setEditNameModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text fontSize={26} fontWeight="900" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY} letterSpacing={-0.5} marginRight={8}>
                    {user?.name || 'My Profile'}
                  </Text>
                  <View style={{ backgroundColor: 'rgba(99,102,241,0.1)', padding: 6, borderRadius: TOKENS.RADIUS.MD }}>
                    <Edit2 color="#6366f1" size={16} />
                  </View>
                </TouchableOpacity>
                <View style={[styles.planBadge, { overflow: 'hidden', borderColor: 'transparent', borderWidth: 0 }]}>
                  <LinearGradient colors={isPro ? ['#f59e0b', '#fbbf24'] : ['#94a3b8', '#cbd5e1']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                  {isPro && <ShimmerSweep />}
                  <View style={{ zIndex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    {isPro ? <Zap color="#fff" size={10} /> : null}
                    <Text color="#fff" fontSize={10} fontWeight="800" marginLeft={isPro ? 2 : 0}>
                      {isPro ? 'PRO' : 'FREE'}
                    </Text>
                  </View>
                </View>
              </XStack>
              <Text fontSize={14} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={4} fontWeight="500">{user?.phone || user?.phone_number || '+880 1XXX-XXXXXX'}</Text>

              {/* Bio chip */}
              <TouchableOpacity onPress={() => setEditBioModal(true)} style={styles.bioChip}>
                <LinearGradient colors={isDark ? ['rgba(30,41,59,0.7)', 'rgba(15,23,42,0.7)'] : ['#ffffff', '#f8fafc']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                <Text fontSize={13} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} numberOfLines={1} flex={1} fontWeight="500" style={{ zIndex: 1 }}>
                  {user?.status || 'Hey there! I am using UNICOM.'}
                </Text>
                <View style={{ zIndex: 1 }}><Edit2 color="#6366f1" size={14} style={{ marginLeft: 4 }} /></View>
              </TouchableOpacity>
            </Animated.View>

            {/* Stats Row */}
            <Animated.View entering={FadeInUp.delay(450)} style={styles.statsRow}>
              <LinearGradient colors={isDark ? ['rgba(30,41,59,0.7)', 'rgba(15,23,42,0.7)'] : ['#ffffff', '#f8fafc']} start={{x:0, y:0}} end={{x:0, y:1}} style={StyleSheet.absoluteFill} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}><PhoneIcon size={14} color="#3b82f6" /></View>
                <CountUpNumber endValue={totalCalls} style={[styles.statNumber, {color: isDark ? '#f8fafc' : '#0f172a'}]} />
                <Text fontSize={11} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={2} fontWeight="600">Total Calls</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIconBadge, { backgroundColor: '#f0fdf4' }]}><Clock size={14} color={TOKENS.COLORS.SUCCESS} /></View>
                <XStack alignItems="baseline">
                  <CountUpNumber endValue={totalDurationMin} style={[styles.statNumber, {color: isDark ? '#f8fafc' : '#0f172a'}]} />
                  <Text style={[styles.statNumber, { fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a' }]}>m</Text>
                </XStack>
                <Text fontSize={11} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={2} fontWeight="600">Call Duration</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIconBadge, { backgroundColor: '#f5f3ff' }]}><Sparkles size={14} color="#8b5cf6" /></View>
                <CountUpNumber endValue={quotaUsed} style={[styles.statNumber, {color: isDark ? '#f8fafc' : '#0f172a'}]} />
                <Text fontSize={11} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={2} fontWeight="600">AI Mins Used</Text>
              </View>
            </Animated.View>
          </Animated.View>

          <YStack paddingHorizontal="$4" marginTop="$4" space="$3">

            {/* ─── AI QUOTA ─── */}
            <Animated.View entering={SlideInRight.delay(80).springify()}>
              <View style={[styles.quotaCard, { shadowColor: isDark ? '#818cf8' : '#6366f1', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 }]}>
                <XStack alignItems="center" space="$2" marginBottom={12}>
                  <Sparkles color="#7c3aed" size={18} />
                  <Text fontWeight="800" fontSize={15} color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>AI Translation Quota</Text>
                  <View style={{ flex: 1 }} />
                  {!isPro && <Text fontWeight="800" color={isDark ? '#818cf8' : '#6366f1'} fontSize={13}>{quotaUsed} / 100 min</Text>}
                </XStack>

                {isPro ? (
                  <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                     <View style={{ width: 48, height: 48, borderRadius: TOKENS.RADIUS.LG, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                       <LinearGradient colors={TOKENS.GRADIENTS.GOLD} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
                       <Infinity color="#f59e0b" size={28} style={{ zIndex: 1 }} />
                     </View>
                     <Text fontSize={13} fontWeight="700" color="#f59e0b" marginTop={8}>Unlimited AI Translation Active</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.quotaTrack}>
                      <ImageBackground source={{uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg=='}} style={[StyleSheet.absoluteFill, { opacity: 0.05 }]} resizeMode="repeat" />
                      <Animated.View style={[styles.quotaFill, { width: `${quotaPct}%`, shadowColor: quotaPct > 80 ? '#ef4444' : '#6366f1', shadowOpacity: 0.4, shadowOffset: {width:0, height:2}, shadowRadius: 4 }]}>
                        <LinearGradient colors={quotaPct > 80 ? ['#f97316', '#ef4444'] : ['#38bdf8', '#6366f1']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                      </Animated.View>
                    </View>
                    <Text fontSize={12} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={8} fontWeight="500">
                      {100 - quotaUsed} free minutes remaining today
                    </Text>
                  </>
                )}
              </View>
            </Animated.View>

            {/* ─── UPGRADE BANNER (Free only) ─── */}
            {!isPro && (
              <Animated.View entering={SlideInRight.delay(100).springify()}>
                <ScaleButton activeScale={0.96} onPress={() => Alert.alert("Upgrade to Pro", "In-app purchases are coming soon in the next update!")} style={styles.upgradeBannerWrapper}>
                  <View style={[styles.upgradeBanner, { overflow: 'hidden' }]}>
                    <LinearGradient colors={TOKENS.GRADIENTS.AI} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                    <ShimmerSweep />
                    <XStack alignItems="center" space="$3" flex={1} style={{ zIndex: 1 }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: TOKENS.RADIUS.MD }}>
                        <Zap color="#fff" size={22} />
                      </View>
                      <YStack flex={1}>
                        <Text color="#fff" fontWeight="900" fontSize={16}>Upgrade to Pro</Text>
                        <Text color="rgba(255,255,255,0.9)" fontSize={13} fontWeight="500">Unlimited AI translation & more</Text>
                      </YStack>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: TOKENS.RADIUS.MD }}>
                         <ChevronRight color="#fff" size={20} />
                      </View>
                    </XStack>
                  </View>
                </ScaleButton>
              </Animated.View>
            )}

            {/* ─── ACCOUNT ─── */}
            <SectionCard title="ACCOUNT" delay={150}>
              <SettingRow
                icon={<Globe />} iconColors={['#38bdf8', '#0ea5e9']}
                label="Native Language" subtitle={LANGS[nativeLanguage] || 'English'}
                onPress={() => setLanguageModal(true)}
              />
              <SettingRow
                icon={<CreditCard />} iconColors={['#38bdf8', '#0ea5e9']}
                label="Payment Methods" subtitle="Bank & crypto receiving details"
                onPress={() => setPaymentModal(true)}
                isLast
              />
            </SectionCard>

            {/* ─── PRIVACY & SECURITY ─── */}
            <SectionCard title="PRIVACY & SECURITY" delay={220}>
              <SettingRow
                icon={<Eye />} iconColors={['#34d399', '#10b981']}
                label="Last Seen & Online" subtitle={`Visible to: ${(privacy.lastSeen || 'everyone').replace('_', ' ')}`}
                onPress={() => setPrivacyModal({ visible: true, type: 'lastSeen' })}
              />
              <SettingRow
                icon={<ImageIcon />} iconColors={['#34d399', '#10b981']}
                label="Profile Photo" subtitle={`Visible to: ${(privacy.profilePhoto || 'everyone').replace('_', ' ')}`}
                onPress={() => setPrivacyModal({ visible: true, type: 'profilePhoto' })}
              />
              <SettingRow
                icon={<CheckCheck />} iconColors={['#34d399', '#10b981']}
                label="Read Receipts" subtitle="Let others know you've read messages"
                rightElement={<AnimatedToggle value={privacy.readReceipts} onValueChange={(val) => togglePrivacy('readReceipts', val)} />}
              />
              {/* Blocked Users Expandable */}
              <TouchableHighlight underlayColor="#f1f5f9" onPress={() => setShowBlockedList(!showBlockedList)}>
                <View style={[styles.settingRow, { backgroundColor: isDark ? 'transparent' : '#fff' }]}>
                  <XStack alignItems="center" space="$3" flex={1}>
                    <View style={[styles.settingIcon, { overflow: 'hidden' }]}>
                      <LinearGradient colors={TOKENS.GRADIENTS.DANGER} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                      <ShieldBan color="#fff" size={20} style={{ zIndex: 1 }} />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                      <YStack flex={1}>
                        <Text fontWeight="600" fontSize={16} color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>Blocked Users</Text>
                        <Text fontSize={13} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={2}>{blockedUsers.length} blocked</Text>
                      </YStack>
                      <View style={[styles.chevronWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f8fafc' }]}>
                        {showBlockedList ? <ChevronUp color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={16} /> : <ChevronDown color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={16} />}
                      </View>
                    </View>
                  </XStack>
                </View>
              </TouchableHighlight>
              {showBlockedList && (
                <Animated.View entering={FadeInDown.duration(200)} style={{ backgroundColor: isDark ? 'rgba(225, 29, 72, 0.1)' : 'rgba(255, 228, 230, 0.4)' }}>
                  <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    {loadingBlocks ? (
                      <ActivityIndicator color={TOKENS.COLORS.DANGER} style={{ padding: 12 }} />
                    ) : blockedUsers.length === 0 ? (
                      <Text color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} fontSize={14} textAlign="center" padding="$3">No blocked users</Text>
                    ) : (
                      blockedUsers.map(bu => (
                        <XStack key={bu.id} alignItems="center" justifyContent="space-between" paddingVertical={10} borderBottomWidth={1} borderColor={isDark ? 'rgba(225, 29, 72, 0.2)' : '#ffe4e6'}>
                          <XStack alignItems="center" space="$3">
                            <Avatar circular size={36}>
                                {bu.profile_picture && <Avatar.Image src={bu.profile_picture} />}
                                <Avatar.Fallback backgroundColor="#005eb8" justifyContent="center" alignItems="center">
                                  <Text color="#fff" fontSize={16} fontWeight="bold">{(bu.name || 'U').charAt(0).toUpperCase()}</Text>
                                </Avatar.Fallback>
                              </Avatar>
                            <Text fontWeight="600" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>{bu.name}</Text>
                          </XStack>
                          <ScaleButton onPress={() => handleUnblock(bu.id, bu.name)} style={styles.unblockBtn}>
                            <Unlock color={TOKENS.COLORS.DANGER} size={13} />
                            <Text color={TOKENS.COLORS.DANGER} fontWeight="700" fontSize={12} marginLeft={4}>Unblock</Text>
                          </ScaleButton>
                        </XStack>
                      ))
                    )}
                  </View>
                </Animated.View>
              )}
              <SettingRow
                icon={<Lock />} iconColors={['#34d399', '#10b981']}
                label="Two-Factor Auth" subtitle="Protect your account"
                onPress={() => Alert.alert('Coming soon', 'This feature is coming soon!')}
                rightElement={<View style={styles.comingSoonBadge}><LinearGradient colors={TOKENS.GRADIENTS.AI} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} /><Text color="#fff" fontSize={10} fontWeight="800" style={{ zIndex: 1 }}>SOON</Text></View>}
                isLast
              />
            </SectionCard>

            {/* ─── APP SETTINGS ─── */}
            <SectionCard title="APP SETTINGS" delay={290}>
              <SettingRow
                icon={<Bell />} iconColors={['#a78bfa', '#8b5cf6']}
                label="Notifications" subtitle="Push & in-app alerts"
                rightElement={<AnimatedToggle value={notifications} onValueChange={async (val) => {
                  Platform.OS !== 'web' && Haptics.impactAsync();
                  setNotifications(val);
                  await updateUserProfile({ notifications: val });
                }} />}
              />
              <SettingRow
                icon={<Moon />} iconColors={['#a78bfa', '#8b5cf6']}
                label="Dark Mode" subtitle="Change app appearance"
                rightElement={<AnimatedToggle value={theme === 'dark'} onValueChange={async (val) => {
                  Platform.OS !== 'web' && Haptics.impactAsync();
                  setTheme(val ? 'dark' : 'light');
                }} />}
                isLast
              />
            </SectionCard>

            {/* ─── HELP & SUPPORT ─── */}
            <SectionCard title="HELP & SUPPORT" delay={360}>
              <SettingRow
                icon={<HelpCircle />} iconColors={['#fbbf24', '#f59e0b']}
                label="Contact Support" subtitle="Report translation issues"
                onPress={() => Alert.alert('Support', 'Contact support@unicom.com')}
              />
              <SettingRow
                icon={<Shield />} iconColors={['#fbbf24', '#f59e0b']}
                label="Privacy Policy" subtitle="Read our privacy terms"
                onPress={() => {}}
                isLast
              />
            </SectionCard>

            {/* ─── LOGOUT ─── */}
            <Animated.View entering={FadeInUp.delay(430)}>
              <ScaleButton onPress={logout} haptic={Haptics.ImpactFeedbackStyle.Heavy} style={[styles.logoutBtn, { width: '100%' }]}>
                <LinearGradient colors={TOKENS.GRADIENTS.DANGER} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                <LogOut color="#ffffff" size={20} style={{ zIndex: 1 }} />
                <Text color="#ffffff" fontWeight="800" fontSize={16} marginLeft="$2" style={{ zIndex: 1 }}>Log Out</Text>
              </ScaleButton>
            </Animated.View>

            <Text textAlign="center" color="#cbd5e1" fontSize={12} marginTop="$4">UNICOM v{Constants.expoConfig?.version || "1.0.0"} • Built with ♥</Text>

          </YStack>
        </ScrollView>

        {/* ─── MODALS ─── */}

        {/* Edit Name Modal */}
        <Modal visible={editNameModal} transparent animationType="fade" onRequestClose={() => setEditNameModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <Animated.View entering={ZoomIn.duration(200)} style={styles.modalCard}>
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <XStack alignItems="center" space="$2">
                  <View style={{ width: 32, height: 32, borderRadius: TOKENS.RADIUS.MD, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                     <LinearGradient colors={isDark ? ['rgba(30,41,59,0.7)', 'rgba(15,23,42,0.7)'] : ['#ffffff', '#f8fafc']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                     <Edit2 color="#3b82f6" size={16} style={{ zIndex: 1 }} />
                  </View>
                  <Text fontSize={20} fontWeight="800" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>Edit Name</Text>
                </XStack>
                <TouchableOpacity onPress={() => setEditNameModal(false)}><X color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={24} /></TouchableOpacity>
              </XStack>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput} value={newName} onChangeText={setNewName}
                  placeholder="Your name" placeholderTextColor="#94a3b8" autoFocus
                />
              </View>
              <ScaleButton onPress={handleSaveName} style={styles.modalSaveBtn} disabled={savingName}>
                <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                {savingName ? <ActivityIndicator color="#fff" /> : <Text color="#fff" fontWeight="700" fontSize={16} style={{ zIndex: 1 }}>Save</Text>}
              </ScaleButton>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Bio Modal */}
        <Modal visible={editBioModal} transparent animationType="fade" onRequestClose={() => setEditBioModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <Animated.View entering={ZoomIn.duration(200)} style={styles.modalCard}>
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <XStack alignItems="center" space="$2">
                  <View style={{ width: 32, height: 32, borderRadius: TOKENS.RADIUS.MD, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                     <LinearGradient colors={['#f3e8ff', '#e9d5ff']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                     <Edit2 color="#a855f7" size={16} style={{ zIndex: 1 }} />
                  </View>
                  <Text fontSize={20} fontWeight="800" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>Edit Bio</Text>
                </XStack>
                <TouchableOpacity onPress={() => setEditBioModal(false)}><X color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={24} /></TouchableOpacity>
              </XStack>
              <View style={[styles.modalInputWrapper, { height: 100 }]}>
                <TextInput
                  style={[styles.modalInput, { height: '100%', textAlignVertical: 'top' }]} value={newBio}
                  onChangeText={setNewBio} placeholder="Your bio" placeholderTextColor="#94a3b8"
                  autoFocus multiline
                />
              </View>
              <ScaleButton onPress={handleSaveBio} style={styles.modalSaveBtn} disabled={savingBio}>
                <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                {savingBio ? <ActivityIndicator color="#fff" /> : <Text color="#fff" fontWeight="700" fontSize={16} style={{ zIndex: 1 }}>Save</Text>}
              </ScaleButton>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>

        {/* QR Code Modal */}
        <Modal visible={qrModal} transparent animationType="slide" onRequestClose={() => setQrModal(false)}>
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setQrModal(false)} />
            <Animated.View entering={FadeInUp.springify()} style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="900" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>My QR Code</Text>
                <TouchableOpacity onPress={() => setQrModal(false)}><X color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={24} /></TouchableOpacity>
              </XStack>
              <YStack alignItems="center" padding="$4" paddingBottom="$8">
                <View style={styles.qrContainer}>
                  <LinearGradient colors={isDark ? ['rgba(30,41,59,0.7)', 'rgba(15,23,42,0.7)'] : ['#ffffff', '#f8fafc']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
                  <View style={styles.qrFrame}>
                    {user?.id && (
                      <QRCode
                        value={`unicom://profile/${user?.phone || user?.id}`}
                        size={180}
                        color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}
                        backgroundColor="transparent"
                      />
                    )}
                  </View>
                  <View style={styles.qrWatermark}>
                    <Zap color="#3b82f6" size={16} />
                    <Text fontSize={12} fontWeight="800" color="#3b82f6" marginLeft={4}>UNICOM</Text>
                  </View>
                </View>
                <Text fontSize={20} fontWeight="800" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY} marginTop="$5">{user?.name}</Text>
                <Text fontSize={14} color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} marginTop={4} fontWeight="500">{user?.phone_number}</Text>
                
                <ScaleButton onPress={() => { /* Placeholder for sharing */ }} style={[styles.modalSaveBtn, { marginTop: 24, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
                   <Text color="#005eb8" fontWeight="800" fontSize={16}>Share QR Code</Text>
                </ScaleButton>
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
                <Text fontSize={20} fontWeight="900" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>
                  Who can see my {privacyModal.type === 'lastSeen' ? 'Last Seen' : 'Profile Photo'}?
                </Text>
                <TouchableOpacity onPress={() => setPrivacyModal({ visible: false, type: '' })}><X color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={24} /></TouchableOpacity>
              </XStack>
              {['everyone', 'my_contacts', 'nobody'].map(opt => (
                <TouchableOpacity
                  key={opt} style={[styles.privacyOption, privacy[privacyModal.type as keyof typeof privacy] === opt && { backgroundColor: '#f8fafc', borderRadius: TOKENS.RADIUS.MD, paddingHorizontal: 12 }]}
                  onPress={() => { togglePrivacy(privacyModal.type, opt); setPrivacyModal({ visible: false, type: '' }); }}
                >
                  <XStack alignItems="center" space="$3">
                    {opt === 'everyone' && <Globe color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={18} />}
                    {opt === 'my_contacts' && <Users color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={18} />}
                    {opt === 'nobody' && <Lock color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={18} />}
                    <Text fontSize={16} fontWeight={privacy[privacyModal.type as keyof typeof privacy] === opt ? "700" : "500"} color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY} textTransform="capitalize">{opt.replace('_', ' ')}</Text>
                  </XStack>
                  {privacy[privacyModal.type as keyof typeof privacy] === opt && (
                    <Animated.View entering={ZoomIn.springify()}><Check color="#3b82f6" size={20} /></Animated.View>
                  )}
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
                <Text fontSize={20} fontWeight="900" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>Native Language</Text>
                <TouchableOpacity onPress={() => setLanguageModal(false)}><X color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={24} /></TouchableOpacity>
              </XStack>
              {Object.entries(LANGS).map(([code, name]) => (
                <TouchableOpacity
                  key={code} style={[styles.privacyOption, nativeLanguage === code && { backgroundColor: '#f8fafc', borderRadius: TOKENS.RADIUS.MD, paddingHorizontal: 12 }]}
                  onPress={async () => {
                    setNativeLanguage(code);
                    await updateUserProfile({ language: code });
                    setTimeout(() => setLanguageModal(false), 300);
                  }}
                >
                  <Text fontSize={16} fontWeight={nativeLanguage === code ? "700" : "500"} color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>{code.toUpperCase()} • {name}</Text>
                  {nativeLanguage === code && (
                    <Animated.View entering={ZoomIn.springify()}><Check color="#3b82f6" size={20} /></Animated.View>
                  )}
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
                <Text fontSize={20} fontWeight="900" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>Payment Details</Text>
                <TouchableOpacity onPress={() => setPaymentModal(false)}><X color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} size={24} /></TouchableOpacity>
              </XStack>
              
              <XStack alignItems="center" space="$2" marginBottom="$4" padding="$3" backgroundColor={isDark ? '#0f2f5c' : '#eff6ff'} borderRadius={12}>
                <Lock color="#3b82f6" size={16} />
                <Text fontSize={12} color="#3b82f6" fontWeight="600" flex={1}>Your payment details are encrypted and only visible to you.</Text>
              </XStack>
              
              <XStack backgroundColor={isDark ? '#334155' : '#f1f5f9'} borderRadius={12} padding={4} marginBottom="$4">
                {(['bank', 'crypto'] as const).map(tab => (
                  <TouchableOpacity key={tab} style={[styles.tabBtn, paymentTab === tab && styles.tabBtnActive]} onPress={() => setPaymentTab(tab)}>
                    {paymentTab === tab && <LinearGradient colors={isDark ? ['rgba(30,41,59,0.7)', 'rgba(15,23,42,0.7)'] : ['#ffffff', '#f8fafc']} start={{x:0, y:0}} end={{x:0, y:1}} style={[StyleSheet.absoluteFill, { borderRadius: TOKENS.RADIUS.SM }]} />}
                    <Text fontWeight="800" color={paymentTab === tab ? '#005eb8' : '#64748b'} style={{ zIndex: 1 }}>{tab === 'bank' ? 'Bank Transfer' : 'Crypto'}</Text>
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
                      <View key={f.key} style={styles.modalInputWrapper}>
                        <Text color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} fontSize={12} marginBottom={4} marginLeft={2} fontWeight="600">{f.label}</Text>
                        <TextInput
                          style={[styles.modalInput, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 }]} placeholder={f.placeholder} placeholderTextColor="#94a3b8"
                          value={(bankDetails as any)[f.key]} onChangeText={t => setBankDetails({ ...bankDetails, [f.key]: t })}
                          keyboardType={f.numeric ? 'numeric' : 'default'}
                        />
                      </View>
                    ))}
                  </YStack>
                ) : (
                  <YStack space="$3">
                    <View style={styles.modalInputWrapper}>
                      <Text color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} fontSize={12} marginBottom={4} marginLeft={2} fontWeight="600">Network</Text>
                      <TextInput style={[styles.modalInput, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 }]} placeholder="e.g. TRC20, ERC20" placeholderTextColor="#94a3b8" value={cryptoDetails.network} onChangeText={t => setCryptoDetails({ ...cryptoDetails, network: t })} />
                    </View>
                    <View style={styles.modalInputWrapper}>
                      <Text color={isDark ? '#94a3b8' : TOKENS.COLORS.TEXT_SECONDARY} fontSize={12} marginBottom={4} marginLeft={2} fontWeight="600">Wallet Address</Text>
                      <TextInput style={[styles.modalInput, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 }]} placeholder="e.g. TNu3...8dKj9L" placeholderTextColor="#94a3b8" value={cryptoDetails.walletAddress} onChangeText={t => setCryptoDetails({ ...cryptoDetails, walletAddress: t })} />
                    </View>
                  </YStack>
                )}
                <ScaleButton
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
                  <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                  {savingPayment ? <ActivityIndicator color="#fff" /> : <Text color="#fff" fontWeight="800" fontSize={16} style={{ zIndex: 1 }}>Save Details</Text>}
                </ScaleButton>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </GradientBackground>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  // Cover
  cover: { height: COVER_HEIGHT, backgroundColor: '#005eb8' },
  coverTopRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 8 : 16 },
  coverIconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  // Avatar
  avatarArea: { alignItems: 'center', marginTop: -(AVATAR_SIZE / 2 + 6) },
  avatarOuterRing: { width: AVATAR_SIZE + 12, height: AVATAR_SIZE + 12, borderRadius: (AVATAR_SIZE + 12) / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#818cf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  avatarRing: { width: AVATAR_SIZE + 6, height: AVATAR_SIZE + 6, borderRadius: (AVATAR_SIZE + 6) / 2, backgroundColor: isDark ? '#1e293b' : '#fff', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: '#e2e8f0' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', ...TOKENS.SHADOWS.ELEVATED },
  // Name area
  nameArea: { alignItems: 'center', paddingHorizontal: 24, marginTop: 14, marginBottom: 4 },
  planBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: TOKENS.RADIUS.SM },
  bioChip: { flexDirection: 'row', alignItems: 'center', borderRadius: TOKENS.RADIUS.MD, paddingHorizontal: 16, paddingVertical: 10, marginTop: 10, maxWidth: SCREEN_WIDTH - 64, shadowColor: isDark ? '#818cf8' : '#6366f1', shadowOpacity: 0.05, shadowOffset: {width:0,height:2}, shadowRadius: 4, overflow: 'hidden' },
  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: 'transparent', marginHorizontal: 16, marginTop: 16, borderRadius: TOKENS.RADIUS.LG, padding: 20, ...TOKENS.SHADOWS.SUBTLE, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(148, 163, 184, 0.2)' },
  statIconBadge: { width: 28, height: 28, borderRadius: TOKENS.RADIUS.MD, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statNumber: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  // Quota
  quotaCard: { backgroundColor: isDark ? 'rgba(30,41,59,0.7)' : '#fff', borderRadius: TOKENS.RADIUS.LG, padding: 20 },
  quotaTrack: { height: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', borderRadius: 6, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: {width:0, height:2} },
  quotaFill: { height: '100%', borderRadius: 6 },
  // Upgrade
  upgradeBannerWrapper: { marginTop: 12, width: '100%' },
  upgradeBanner: { borderRadius: TOKENS.RADIUS.LG, padding: 20, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  // Section
  sectionCard: { marginBottom: 4 },
  sectionTitleWrapper: { marginBottom: 10, marginLeft: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', letterSpacing: 0.8 },
  cardGlassTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 },
  sectionBody: { backgroundColor: '#fff', borderRadius: TOKENS.RADIUS.LG, overflow: 'hidden', ...TOKENS.SHADOWS.SUBTLE },
  // Setting Row
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 16, backgroundColor: '#fff' },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  settingIcon: { width: 40, height: 40, borderRadius: TOKENS.RADIUS.LG, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 6 },
  chevronWrapper: { width: 28, height: 28, borderRadius: TOKENS.RADIUS.MD, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  // Misc
  unblockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: TOKENS.RADIUS.MD, borderWidth: 1, borderColor: '#fecdd3' },
  comingSoonBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: TOKENS.RADIUS.SM, overflow: 'hidden' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: TOKENS.RADIUS.LG, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, overflow: 'hidden', width: '100%' },
  // Toggle
  toggleTrack: { width: 52, height: 32, borderRadius: TOKENS.RADIUS.MD, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 28, height: 28, borderRadius: TOKENS.RADIUS.MD, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: isDark ? '#1e293b' : '#fff', width: '88%', borderRadius: TOKENS.RADIUS.XL, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: {width:0, height:12} },
  modalInputWrapper: { marginBottom: 16 },
  modalInput: { backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 16, borderRadius: TOKENS.RADIUS.MD, fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', shadowColor: '#3b82f6', shadowOpacity: 0, shadowRadius: 0, width: '100%' } as any,
  modalSaveBtn: { overflow: 'hidden', padding: 18, borderRadius: TOKENS.RADIUS.MD, alignItems: 'center', shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: {width:0,height:4}, width: '100%' },
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: isDark ? '#1e293b' : '#fff', borderTopLeftRadius: TOKENS.RADIUS.XL, borderTopRightRadius: TOKENS.RADIUS.XL, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 32, shadowOffset: {width:0, height:-10} },
  sheetHandle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  privacyOption: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qrContainer: { width: 220, height: 220, borderRadius: TOKENS.RADIUS.XL, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: {width:0, height:8} },
  qrFrame: { padding: 16, backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: TOKENS.RADIUS.LG },
  qrWatermark: { position: 'absolute', bottom: 12, flexDirection: 'row', alignItems: 'center' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: TOKENS.RADIUS.SM, overflow: 'hidden' },
  tabBtnActive: {},
  textInput: { backgroundColor: '#f8fafc', padding: 14, borderRadius: TOKENS.RADIUS.MD, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a' } as any,
});

