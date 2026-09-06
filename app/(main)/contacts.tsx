import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView, TextInput, TouchableOpacity, View, Image, ActivityIndicator,
  StyleSheet, RefreshControl, Platform, Alert, Pressable, TouchableHighlight
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Search, Phone, Video, UserPlus, Users, MessageSquare, Send, Quote, Settings, RefreshCw, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useCall } from '../../src/context/CallContext';
import Animated, { 
  FadeInDown, FadeInUp, ZoomIn, 
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence,
  Easing, interpolate
} from 'react-native-reanimated';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { TOKENS } from '../../src/theme/tokens';


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedRefresh = Animated.createAnimatedComponent(RefreshCw);

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const getColor = (name: string) => {
  if (!name) return '#64748b';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const ScaleButton = ({ onPress, style, children, activeScale = 0.92, haptic = Haptics.ImpactFeedbackStyle.Light }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(activeScale, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={(e) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(haptic);
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

const SyncButton = ({ syncing, onPress }: { syncing: boolean, onPress: () => void }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (syncing) {
      rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [syncing]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rotation.value}deg` }] }));

  return (
    <ScaleButton onPress={onPress} style={styles.syncBtnSmall}>
      <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[style, { zIndex: 1 }]}>
        <RefreshCw color="#fff" size={20} />
      </Animated.View>
    </ScaleButton>
  );
};

const PulseDot = () => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.5, { duration: 1500 }), -1, true);
    opacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <View style={styles.onlineDotWrapper}>
      <Animated.View style={[styles.onlineDotGlow, style]} />
      <View style={styles.onlineDot} />
    </View>
  );
};

const PulseGlow = () => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.1, { duration: 1500 }), -1, true);
    opacity.value = withRepeat(withTiming(0.2, { duration: 1500 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return <Animated.View style={[styles.syncPrimaryBtnGlow, style]} />;
};

const EmptyPulseIcon = ({ isError }: { isError: boolean }) => {
  const scale = useSharedValue(0.95);
  useEffect(() => { scale.value = withRepeat(withTiming(1.05, { duration: 2000 }), -1, true); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.emptyIconBadge, style]}>
      <LinearGradient colors={isError ? ['#fee2e2', '#ffedd5'] : ['#e0e7ff', '#fae8ff']} style={StyleSheet.absoluteFillObject} />
      <Users color={isError ? "#ef4444" : "#6366f1"} size={32} style={{ zIndex: 1 }} />
    </Animated.View>
  );
};

const SkeletonRow = ({ index }: { index: number }) => {
  const translateX = useSharedValue(-200);
  useEffect(() => { translateX.value = withRepeat(withTiming(400, { duration: 1200 }), -1, false); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(index * 40)} style={styles.contactRowSkeleton}>
       <View style={[styles.avatar, {backgroundColor: '#e2e8f0', overflow: 'hidden'}]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, style, { width: 200, left: -100 }]}>
            <LinearGradient colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
          </Animated.View>
       </View>
       <YStack flex={1} marginLeft="$3" space="$2" justifyContent="center">
         <View style={{width: '40%', height: 16, backgroundColor: '#e2e8f0', borderRadius: TOKENS.RADIUS.SM, overflow: 'hidden'}}>
            <Animated.View style={[StyleSheet.absoluteFillObject, style, { width: 200, left: -100 }]}>
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
            </Animated.View>
         </View>
         <View style={{width: '70%', height: 14, backgroundColor: '#f1f5f9', borderRadius: 7, overflow: 'hidden'}}>
            <Animated.View style={[StyleSheet.absoluteFillObject, style, { width: 200, left: -100 }]}>
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
            </Animated.View>
         </View>
       </YStack>
    </Animated.View>
  );
};

const InviteButton = ({ onInvite }: { onInvite: () => void }) => {
  const transX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transX.value = withTiming(20, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => {
      onInvite();
      transX.value = -10;
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: 200 });
        transX.value = withTiming(0, { duration: 200 });
      }, 100);
    }, 250);
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: transX.value }],
    opacity: opacity.value,
  }));

  return (
    <ScaleButton onPress={handlePress} style={styles.inviteBtnWrapper}>
      <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
      <XStack alignItems="center" space="$1.5" style={{ zIndex: 1, paddingHorizontal: 14, paddingVertical: 8 }}>
        <Animated.View style={iconStyle}>
          <Send color="#fff" size={14} />
        </Animated.View>
        <Text color="#fff" fontSize={12} fontWeight="800">Invite</Text>
      </XStack>
    </ScaleButton>
  );
};

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startVoiceCall } = useCall();
  const [contacts, setContacts] = useState<any[]>([]);
  const [nonUnicomContacts, setNonUnicomContacts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const loadContacts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          setPermissionDenied(false);
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
          });
          const phones = data
            .flatMap(c => c.phoneNumbers || [])
            .map(p => p.number?.replace(/\s|-|\(|\)/g, '') || '')
            .filter(p => p.length >= 7);

          if (phones.length > 0) {
            setSyncing(true);
            const res = await api.syncContacts(phones);
            setSyncing(false);
            if (res.success && res.contacts) {
              setContacts(res.contacts);
              
              const registeredPhones = new Set(res.contacts.map((c: any) => c.phone?.replace(/\s|-|\(|\)/g, '') || ''));
              const validDeviceContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
              const nonReg = validDeviceContacts.filter(dc => {
                const p = dc.phoneNumbers?.[0]?.number?.replace(/\s|-|\(|\)/g, '');
                return p && !registeredPhones.has(p) && !registeredPhones.has('+88' + p);
              }).map(dc => ({
                id: 'non_' + dc.id,
                name: dc.name,
                phone: dc.phoneNumbers?.[0]?.number,
                isNonUnicom: true
              })).slice(0, 50);
              
              setNonUnicomContacts(nonReg);
              setFiltered([...res.contacts, ...nonReg]);
              return;
            }
          }
        } else {
          setPermissionDenied(true);
        }
      }
      setSyncing(true);
      const res = await api.syncContacts([]);
      if (res.success && res.contacts) {
        setContacts(res.contacts);
        setFiltered(res.contacts);
      }
      setSyncing(false);
    } catch (e) {
      console.error('Failed to load contacts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  };

  useEffect(() => { loadContacts(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered([...contacts, ...nonUnicomContacts]); return; }
    const q = search.toLowerCase();
    const all = [...contacts, ...nonUnicomContacts];
    setFiltered(all.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q)));
  }, [search, contacts, nonUnicomContacts]);

  const handleCall = async (contact: any) => {
    if (contact.isNonUnicom) {
       Linking.openURL(`sms:${contact.phone}?body=Let's chat on UNICOM! Download the app: https://unicom.app`);
       return;
    }
    router.push(`/chat/${contact.id}`);
  };

  const initial = (name: string) => (name || '?').charAt(0).toUpperCase();

  const searchScale = useSharedValue(1);
  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
    shadowColor: isSearchFocused ? '#005eb8' : '#64748b',
    shadowOpacity: isSearchFocused ? 0.2 : 0.08,
    shadowRadius: isSearchFocused ? 12 : 8,
    elevation: isSearchFocused ? 6 : 2,
    borderColor: isSearchFocused ? 'rgba(0, 94, 184, 0.3)' : '#e2e8f0',
  }));

  useEffect(() => {
    searchScale.value = withTiming(isSearchFocused ? 1.02 : 1, { duration: 200 });
  }, [isSearchFocused]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={TOKENS.GRADIENTS.SCREEN_BG} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>Contacts</Text>
            <SyncButton syncing={true} onPress={() => {}} />
          </View>
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: '#fff', borderColor: '#e2e8f0', shadowOpacity: 0.05 }]} />
          </View>
          <View style={{flex: 1}}>
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonRow key={i} index={i} />)}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={TOKENS.GRADIENTS.SCREEN_BG} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>Contacts</Text>
            <SyncButton syncing={syncing} onPress={() => loadContacts(true)} />
          </View>

          <View style={styles.searchContainer}>
            <Animated.View style={[styles.searchBar, searchAnimatedStyle]}>
              <Search color={isSearchFocused ? "#005eb8" : "#94a3b8"} size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {search.length > 0 && (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} activeOpacity={0.6}>
                    <X color={TOKENS.COLORS.TEXT_SECONDARY} size={16} />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>
          </View>
        </Animated.View>

        {permissionDenied && filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <EmptyPulseIcon isError={true} />
            <Text fontSize={22} fontWeight="800" color={TOKENS.COLORS.TEXT_PRIMARY} marginTop="$5">Contacts Access Denied</Text>
            <Text fontSize={15} color={TOKENS.COLORS.TEXT_SECONDARY} marginTop="$2" textAlign="center" paddingHorizontal="$4" lineHeight={22}>
              Please enable contacts permission in your settings to easily find friends on UNICOM.
            </Text>
            <ScaleButton onPress={() => Linking.openSettings()} style={styles.settingsBtn}>
              <Settings color="#005eb8" size={18} />
              <Text color="#005eb8" fontWeight="700" marginLeft="$2">Open Settings</Text>
            </ScaleButton>
          </Animated.View>
        ) : filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <EmptyPulseIcon isError={false} />
            <Text fontSize={22} fontWeight="800" color={TOKENS.COLORS.TEXT_PRIMARY} marginTop="$5">
              {search ? 'No results found' : 'No UNICOM contacts'}
            </Text>
            <Text fontSize={15} color={TOKENS.COLORS.TEXT_SECONDARY} marginTop="$2" textAlign="center" paddingHorizontal="$4" lineHeight={22}>
              {search ? `We couldn't find any contacts matching "${search}"` : 'Your phone contacts who use UNICOM will appear here.'}
            </Text>
            {!search && (
              <ScaleButton onPress={() => loadContacts(true)} style={styles.syncPrimaryBtn}>
                <PulseGlow />
                <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
                <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
                  <UserPlus color="#fff" size={18} />
                  <Text color="#fff" fontWeight="800" marginLeft="$2">Sync Contacts</Text>
                </View>
              </ScaleButton>
            )}
          </Animated.View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadContacts(true)} tintColor="#005eb8" />}
            contentContainerStyle={{ paddingBottom: Math.max((insets?.bottom || 0) + 120, 140) }}
          >
            <View style={styles.countBadgeWrapper}>
              <View style={styles.countBadge}>
                <View style={styles.countBadgeDot} />
                <Text style={styles.countBadgeText}>{contacts.length} UNICOM contact{contacts.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            {filtered.map((contact, index) => {
              const name = contact.name || 'Unknown';
              const isNonUnicom = contact.isNonUnicom;
              const avatarBg = isNonUnicom ? '#94a3b8' : getColor(name);
              const isOnline = contact.onlineStatus === 'online';

              return (
                <Animated.View key={contact.id || index} entering={FadeInUp.delay(index * 60)}>
                  <TouchableHighlight
                    style={[styles.contactRow, isNonUnicom && styles.nonUnicomRow]}
                    underlayColor={isNonUnicom ? "#f1f5f9" : "#e2e8f0"}
                    onPress={() => handleCall(contact)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={styles.avatarWrapper}>
                        {contact.avatar && !isNonUnicom ? (
                          <Image source={{ uri: contact.avatar }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' }]}>
                            <Text color="#fff" fontWeight="900" fontSize={20} style={{ zIndex: 1 }}>{initial(name)}</Text>
                          </View>
                        )}
                        {isOnline && !isNonUnicom && <PulseDot />}
                      </View>

                      <YStack flex={1} marginLeft="$3">
                        <Text fontWeight={isNonUnicom ? "600" : "800"} fontSize={16} color={isNonUnicom ? "#475569" : "#0f172a"}>{name}</Text>
                        
                        <XStack alignItems="center" marginTop={2} space="$1">
                          {(!isNonUnicom && contact.about && contact.about !== contact.phone) && <Quote size={10} color={TOKENS.COLORS.TEXT_SECONDARY} />}
                          <Text fontSize={13} color={TOKENS.COLORS.TEXT_SECONDARY} fontStyle={(!isNonUnicom && contact.about && contact.about !== contact.phone) ? 'italic' : 'normal'}>
                            {contact.about || contact.phone || 'UNICOM user'}
                          </Text>
                        </XStack>
                        
                        {isNonUnicom && (
                          <Text fontSize={11} color={TOKENS.COLORS.TEXT_SECONDARY} marginTop={1} fontWeight="500">Not on UNICOM yet</Text>
                        )}
                      </YStack>

                      <XStack space="$2" alignItems="center">
                        {isNonUnicom ? (
                          <InviteButton onInvite={() => Linking.openURL(`sms:${contact.phone}?body=Let's chat on UNICOM! Download the app: https://unicom.app`)} />
                        ) : (
                          <>
                            <TouchableOpacity 
                              style={styles.callBtn}
                              onPress={() => { startVoiceCall(contact.id, contact.name, false); router.push('/call/' + contact.id); }}
                            >
                              <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
                              <View style={{ zIndex: 1 }}><Phone color="#fff" size={18} /></View>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.callBtn}
                              onPress={() => { startVoiceCall(contact.id, contact.name, true); router.push('/call/' + contact.id); }}
                            >
                              <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
                              <View style={{ zIndex: 1 }}><Video color="#fff" size={18} /></View>
                            </TouchableOpacity>
                            <ScaleButton 
                              style={styles.chatBtnWrapper} 
                              onPress={() => router.push(`/chat/${contact.id}`)}
                            >
                              <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
                              <View style={{ zIndex: 1 }}><MessageSquare color="#fff" size={18} /></View>
                            </ScaleButton>
                          </>
                        )}
                      </XStack>
                    </View>
                  </TouchableHighlight>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  appTitle: { fontSize: 28, fontWeight: '900', color: '#005eb8', letterSpacing: -0.5 },
  syncBtnSmall: { width: 40, height: 40, borderRadius: TOKENS.RADIUS.LG, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  searchContainer: { marginHorizontal: 16, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, height: 46, borderRadius: 23, gap: 10, borderWidth: 1.5 },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '500', outlineStyle: 'none' } as any,
  clearBtn: { width: 24, height: 24, borderRadius: TOKENS.RADIUS.MD, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  contactRow: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: TOKENS.RADIUS.LG, ...TOKENS.SHADOWS.SUBTLE },
  nonUnicomRow: { backgroundColor: 'rgba(251, 191, 36, 0.05)', shadowOpacity: 0.02 },
  contactRowSkeleton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: TOKENS.RADIUS.LG, ...TOKENS.SHADOWS.SUBTLE },
  avatarWrapper: { position: 'relative', width: 56, height: 56 },
  avatar: { width: 56, height: 56, borderRadius: TOKENS.RADIUS.XL, borderWidth: 2, borderColor: '#fff', ...TOKENS.SHADOWS.ELEVATED },
  onlineDotWrapper: { position: 'absolute', bottom: 1, right: 1, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  onlineDotGlow: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', opacity: 0.6 },
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  chatBtnWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  inviteBtnWrapper: { borderRadius: TOKENS.RADIUS.LG, overflow: 'hidden', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: -40 },
  emptyIconBadge: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#6366f1', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: TOKENS.RADIUS.LG, borderWidth: 1.5, borderColor: '#005eb8', marginTop: 24 },
  syncPrimaryBtn: { borderRadius: TOKENS.RADIUS.LG, overflow: 'hidden', marginTop: 24, paddingHorizontal: 24, paddingVertical: 14 },
  syncPrimaryBtnGlow: { position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, backgroundColor: '#6366f1', opacity: 0.5, borderRadius: TOKENS.RADIUS.XL },
  countBadgeWrapper: { alignItems: 'center', marginBottom: 16 },
  countBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: TOKENS.RADIUS.MD },
  countBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0284c7', marginRight: 6 },
  countBadgeText: { fontSize: 11, color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
