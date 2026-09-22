import { GradientBackground } from '../../src/components/ThemeComponents';
import { TOKENS } from '../../src/theme/tokens';
import { useThemeContext } from '../../src/context/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, TextInput, TouchableOpacity, View, Image,
  StyleSheet, RefreshControl, Platform, Alert, Pressable, TouchableHighlight, Dimensions, ActivityIndicator
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Search, Phone, Video, UserPlus, Users, MessageSquare, Send, Quote, Settings, RefreshCw, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useCall } from '../../src/context/CallContext';
import Animated, { 
  FadeInDown, FadeInUp, SlideInRight, ZoomIn, 
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  Easing
} from 'react-native-reanimated';
import * as Contacts from 'expo-contacts/legacy';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import * as SMS from 'expo-sms';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

// --- Animated Avatar Ring (reused) ---
const AnimatedAvatarRing = ({ children, status }: { children: React.ReactNode, status: 'online' | 'offline' | 'non-unicom' }) => {
  const ringRotation = useSharedValue(0);
  
  useEffect(() => {
    ringRotation.value = withRepeat(
      withTiming(360, { duration: status === 'online' ? 4000 : 6000, easing: Easing.linear }),
      -1, false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }]
  }));

  const ringColors = status === 'online' 
    ? ['#06d6a0', '#38bdf8', '#06d6a0'] 
    : status === 'non-unicom' 
      ? ['#f59e0b', '#f97316', '#f59e0b'] 
      : ['#8b5cf6', '#c084fc', '#8b5cf6']; 

  return (
    <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 60, height: 60, borderRadius: 30 }, ringStyle]}>
        <LinearGradient
          colors={ringColors as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 60, height: 60, borderRadius: 30 }}
        />
      </Animated.View>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 50, height: 50, borderRadius: 25, overflow: 'hidden' }}>
          {children}
        </View>
      </View>
    </View>
  );
};

// --- Online Pulse Dot ---
const PulseDot = () => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.5, { duration: 1500 }), -1, true);
    opacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }], opacity: opacity.value
  }));
  return (
    <View style={{ position: 'absolute', bottom: 1, right: 1, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', opacity: 0.6 }, style]} />
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' }} />
    </View>
  );
};

// --- Loading Skeleton ---
const SkeletonRow = ({ index }: { index: number }) => {
  const shimmerOpacity = useSharedValue(0.4);
  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }), 
      -1, true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmerOpacity.value }));
  return (
    <Animated.View style={[animatedStyle, { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' }]}>
      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(226,232,240,0.5)' }} />
      <YStack flex={1} marginLeft="$3" space="$2">
        <View style={{ width: 140, height: 16, borderRadius: 6, backgroundColor: 'rgba(226,232,240,0.5)' }} />
        <View style={{ width: '70%', height: 14, borderRadius: 7, backgroundColor: 'rgba(241,245,249,0.5)' }} />
      </YStack>
    </Animated.View>
  );
};

// --- Empty State ---
const EmptyPulseIcon = ({ isError }: { isError: boolean }) => {
  const scale = useSharedValue(0.95);
  useEffect(() => { scale.value = withRepeat(withTiming(1.05, { duration: 2000 }), -1, true); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#6366f1', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 }]}>
      <LinearGradient colors={isError ? ['#fee2e2', '#ffedd5'] : ['#e0e7ff', '#fae8ff']} style={StyleSheet.absoluteFillObject} />
      <Users color={isError ? "#ef4444" : "#6366f1"} size={32} style={{ zIndex: 1 }} />
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
    <ScaleButton onPress={handlePress} style={{ borderRadius: 12, backgroundColor: TOKENS.COLORS.SUCCESS, elevation: 2 }}>
      <XStack alignItems="center" space="$1.5" style={{ zIndex: 1, paddingHorizontal: 14, paddingVertical: 8 }}>
        <Animated.View style={iconStyle}>
          <Send color="#fff" size={14} />
        </Animated.View>
        <Text color="#fff" fontSize={12} fontWeight="800">Invite</Text>
      </XStack>
    </ScaleButton>
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

  const inactiveBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';
  const inactiveBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)';
  const inactiveText = isDark ? '#94a3b8' : '#475569';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onSelect(type)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
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
        <Text style={{
          fontSize: 14,
          fontWeight: isActive ? '700' : '600',
          color: isActive ? '#ffffff' : inactiveText,
          zIndex: 2,
          letterSpacing: 0.3,
        }}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function ContactsScreen() {
  const { isDark } = useThemeContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [nonUnicomContacts, setNonUnicomContacts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [filter, setFilter] = useState('all');

  // Background floating particles
  const p1Y = useSharedValue(0);
  const p2Y = useSharedValue(0);
  const p3Y = useSharedValue(0);
  const p4Y = useSharedValue(0);
  const p5Y = useSharedValue(0);

  useEffect(() => {
    p1Y.value = withRepeat(withTiming(-20, { duration: 4000, easing: Easing.inOut(Easing.ease) }), -1, true);
    p2Y.value = withRepeat(withTiming(25, { duration: 5000, easing: Easing.inOut(Easing.ease) }), -1, true);
    p3Y.value = withRepeat(withTiming(-30, { duration: 6000, easing: Easing.inOut(Easing.ease) }), -1, true);
    p4Y.value = withRepeat(withTiming(15, { duration: 4500, easing: Easing.inOut(Easing.ease) }), -1, true);
    p5Y.value = withRepeat(withTiming(-25, { duration: 5500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const p1Style = useAnimatedStyle(() => ({ transform: [{ translateY: p1Y.value }] }));
  const p2Style = useAnimatedStyle(() => ({ transform: [{ translateY: p2Y.value }] }));
  const p3Style = useAnimatedStyle(() => ({ transform: [{ translateY: p3Y.value }] }));
  const p4Style = useAnimatedStyle(() => ({ transform: [{ translateY: p4Y.value }] }));
  const p5Style = useAnimatedStyle(() => ({ transform: [{ translateY: p5Y.value }] }));

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
    let result = [...contacts, ...nonUnicomContacts];
    
    // Apply category filter
    if (filter === 'online') {
      result = result.filter(c => !c.isNonUnicom && c.onlineStatus === 'online');
    } else if (filter === 'non-unicom') {
      result = result.filter(c => c.isNonUnicom);
    }
    
    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => 
        (c.name || '').toLowerCase().includes(q) || 
        (c.phone || '').includes(q)
      );
    }
    
    setFiltered(result);
  }, [search, contacts, nonUnicomContacts, filter]);

  const handleCall = async (contact: any) => {
    if (contact.isNonUnicom) {
       Linking.openURL(`sms:${contact.phone}?body=Let's chat on UNICOM! Download the app: https://unicom.app`);
       return;
    }
    router.push(`/chat/${contact.id}`);
  };

  const handleInvite = async (phone: string) => {
    const message = "Let's chat on UNICOM! Download the app: https://unicom.app";
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([phone], message);
      } else {
        const { Share } = require('react-native');
        Share.share({ message: message });
      }
    } catch(e) {
      console.log('Error opening SMS:', e);
    }
  };

  const initial = (name: string) => (name || '?').charAt(0).toUpperCase();

  const handleFilterChange = (newFilter: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    setFilter(newFilter);
  };

  const renderRow = (contact: any, index: number) => {
    const name = contact.name || 'Unknown';
    const isNonUnicom = contact.isNonUnicom;
    const avatarBg = isNonUnicom ? '#94a3b8' : getColor(name);
    const isOnline = contact.onlineStatus === 'online';
    const avatarStatus = isOnline ? 'online' : isNonUnicom ? 'non-unicom' : 'offline';

    return (
      <Animated.View key={contact.id ? contact.id + "-" + index : index} entering={FadeInUp.duration(200)} style={[styles.cardContainer, isNonUnicom && styles.cardContainerNonUnicom]}>
        <LinearGradient 
          colors={isDark ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.4)']} 
          start={{x:0, y:0}} end={{x:0, y:1}} style={StyleSheet.absoluteFillObject} />
        
        <TouchableHighlight
          style={styles.rowInner}
          underlayColor="rgba(255,255,255,0.05)"
          onPress={() => handleCall(contact)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {/* Animated Avatar */}
            <View style={{ position: 'relative' }}>
              <AnimatedAvatarRing status={avatarStatus}>
                {contact.avatar && !isNonUnicom ? (
                  <Image source={{ uri: contact.avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                ) : (
                  <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text color="#fff" fontWeight="900" fontSize={20}>{initial(name)}</Text>
                  </View>
                )}
              </AnimatedAvatarRing>
              {isOnline && !isNonUnicom && <PulseDot />}
            </View>

            {/* Content */}
            <YStack flex={1} marginLeft="$3">
              <Text fontWeight={isNonUnicom ? "600" : "800"} fontSize={16} color={isDark ? (isNonUnicom ? "#94a3b8" : "#f1f5f9") : (isNonUnicom ? "#94a3b8" : "#0f172a")}>{name}</Text>
              
              <XStack alignItems="center" marginTop={2} space="$1">
                {(!isNonUnicom && contact.about && contact.about !== contact.phone) && <Quote size={10} color="#94a3b8" />}
                <Text fontSize={13} color="#64748b" fontStyle={(!isNonUnicom && contact.about && contact.about !== contact.phone) ? 'italic' : 'normal'}>
                  {contact.about || contact.phone || 'UNICOM user'}
                </Text>
              </XStack>
              
              {isNonUnicom && (
                <Text fontSize={11} color="#64748b" marginTop={1} fontWeight="500">Not on UNICOM yet</Text>
              )}
            </YStack>

            {/* Action Buttons */}
            <XStack space="$2">
              {isNonUnicom ? (
                <InviteButton onInvite={() => handleInvite(contact.phone)} />
              ) : (
                <ScaleButton 
                  style={styles.chatBtnWrapper} 
                  onPress={() => router.push(`/chat/${contact.id}`)}
                >
                  <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:1}} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare color="#fff" size={18} />
                    </LinearGradient>
                </ScaleButton>
              )}
            </XStack>
          </View>
        </TouchableHighlight>
      </Animated.View>
    );
  };

  const styles = getStyles(isDark);

  return (
    <GradientBackground style={styles.container}>
      {/* Top Fixed Section */}
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
              placeholder="Search contacts..."
              placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 6 }}>
              <LinearGradient colors={['#38bdf8', '#818cf8']} style={styles.searchIconBtn}>
                {search.length > 0 ? <X color="#fff" size={18} /> : <Search color="#fff" size={18} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          <FilterButton label="All" type="all" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#0ea5e9', '#3b82f6']} />
          <FilterButton label="Online" type="online" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#06d6a0', '#0ea5e9']} />
          <FilterButton label="Non-Unicom" type="non-unicom" activeFilter={filter} onSelect={handleFilterChange} gradientColors={['#f59e0b', '#f97316']} />
        </ScrollView>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={{ paddingTop: 16 }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} index={i} />)}
        </View>
      ) : permissionDenied && filtered.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: -40, zIndex: 5 }}>
          <EmptyPulseIcon isError={true} />
          <Text fontSize={22} fontWeight="800" color={isDark ? "#f1f5f9" : "#0f172a"} marginTop="$5">Contacts Access Denied</Text>
          <Text fontSize={15} color={isDark ? "#94a3b8" : "#64748b"} marginTop="$2" textAlign="center" paddingHorizontal="$4" lineHeight={22}>
            Please enable contacts permission in your settings to easily find friends on UNICOM.
          </Text>
          <TouchableOpacity onPress={() => Linking.openSettings()} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#38bdf8', marginTop: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(14,165,233,0.1)' }}>
            <Settings color="#0ea5e9" size={18} />
            <Text color="#0ea5e9" fontWeight="700" marginLeft="$2">Open Settings</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : filtered.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: -40, zIndex: 5 }}>
          <EmptyPulseIcon isError={false} />
          <Text fontSize={22} fontWeight="800" color={isDark ? "#f1f5f9" : "#0f172a"} marginTop="$5">
            {search ? 'No results found' : filter === 'online' ? 'No one is online' : filter === 'non-unicom' ? 'Everyone is on UNICOM!' : 'No contacts'}
          </Text>
          <Text fontSize={15} color={isDark ? "#94a3b8" : "#64748b"} marginTop="$2" textAlign="center" paddingHorizontal="$4" lineHeight={22}>
            {search ? `We couldn't find any contacts matching "${search}"` : 'Your phone contacts who use UNICOM will appear here.'}
          </Text>
        </Animated.View>
      ) : (
        <ScrollView
          style={{ flex: 1, zIndex: 5 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadContacts(true)} tintColor="#6366f1" />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}
        >
          {/* Glassmorphic Count Badge */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0ea5e9', marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: '#0ea5e9', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {contacts.length} UNICOM contact{contacts.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {filtered.map((contact, index) => renderRow(contact, index))}
        </ScrollView>
      )}


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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 12,
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
  cardContainerNonUnicom: {
    /* opacity: 0.85 */
    backgroundColor: isDark ? '#161e2e' : '#f8fafc',
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'transparent',
  },
  chatBtnWrapper: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
}); }