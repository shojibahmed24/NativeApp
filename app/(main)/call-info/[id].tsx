import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { YStack, XStack, Text, Avatar } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MessageSquare, Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, MoreVertical } from 'lucide-react-native';
import { GradientBackground, GlassCard } from '../../../src/components/ThemeComponents';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCall } from '../../../src/context/CallContext';
import { supabase } from '../../../src/services/supabase';
import { api } from '../../../src/services/api';
import { useAuth } from '../../../src/context/AuthContext';
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated';

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
const getAvatarColor = (name: string) => {
  if (!name) return '#cbd5e1';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function CallInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { callHistory, startVoiceCall } = useCall();
  
  const [peerLogs, setPeerLogs] = useState<any[]>([]);
  const [peerInfo, setPeerInfo] = useState<any>(null);

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
    <View style={{ flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
      <Text color="#64748b">Loading...</Text>
    </View>
  );

  const initial = peerInfo.name?.charAt(0).toUpperCase() || 'U';
  const avatarBg = getAvatarColor(peerInfo.name);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <XStack padding="$4" alignItems="center" justifyContent="space-between" zIndex={10}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ChevronLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text color="#0f172a" fontSize={18} fontWeight="600">Call info</Text>
          <TouchableOpacity style={styles.iconButton}>
            <MoreVertical color="#0f172a" size={24} />
          </TouchableOpacity>
        </XStack>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          <YStack alignItems="center" marginTop="$4">
            <Animated.View entering={FadeInDown.duration(500)}>
              <TouchableOpacity onPress={() => router.push(`/profile/${peerInfo.id}`)}>
                <Avatar circular size={110} backgroundColor={avatarBg}>
                  {peerInfo.avatar ? <Avatar.Image src={peerInfo.avatar} /> : <Text color="#fff" fontWeight="bold" fontSize={48}>{initial}</Text>}
                </Avatar>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={{ alignItems: 'center', width: '100%' }}>
              <Text fontSize={26} fontWeight="400" color="#0f172a" marginTop="$4">{peerInfo.name}</Text>
              <Text fontSize={15} color="#475569" marginTop="$2">{peerInfo.phone || 'No phone number'}</Text>
            </Animated.View>
          </YStack>

          <Animated.View entering={FadeInUp.duration(500).delay(300)}>
            <XStack justifyContent="center" space="$6" marginTop="$8" paddingHorizontal="$4" paddingBottom="$8">
              
              <YStack alignItems="center" space="$2">
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/chat/${peerInfo.id}`)}>
                  <MessageSquare color="#005eb8" size={20} />
                </TouchableOpacity>
                <Text color="#475569" fontSize={12}>Message</Text>
              </YStack>
              
              <YStack alignItems="center" space="$2">
                <TouchableOpacity style={styles.actionBtn} onPress={handleAudioCall}>
                  <Phone color="#005eb8" size={20} />
                </TouchableOpacity>
                <Text color="#475569" fontSize={12}>Audio</Text>
              </YStack>

              <YStack alignItems="center" space="$2">
                <TouchableOpacity style={styles.actionBtn} onPress={handleVideoCall}>
                  <Video color="#005eb8" size={20} />
                </TouchableOpacity>
                <Text color="#475569" fontSize={12}>Video</Text>
              </YStack>

            </XStack>
          </Animated.View>

          <YStack paddingHorizontal="$4" marginTop="$2">
            {Object.keys(groupedLogs).map((date, gIndex) => (
              <Animated.View key={date} entering={SlideInRight.delay(400 + gIndex * 100).springify()}>
                <Text color="#475569" fontSize={14} fontWeight="500" marginBottom="$3" marginTop={gIndex > 0 ? "$6" : "$0"}>{date}</Text>
                
                <YStack space="$0">
                  {groupedLogs[date].map((log: any, index: number) => {
                    const isMissed = log.status === 'missed';
                    const isIncoming = !log.isOutgoing;
                    const type = isMissed ? 'missed' : isIncoming ? 'incoming' : 'outgoing';
                    const Icon = type === 'missed' ? PhoneMissed : type === 'incoming' ? PhoneIncoming : PhoneOutgoing;
                    const color = type === 'missed' ? '#ef4444' : type === 'incoming' ? '#10b981' : '#475569';
                    
                    return (
                      <XStack key={log.id} paddingVertical="$3" alignItems="center">
                        <View style={{ width: 30, alignItems: 'center' }}>
                          <Icon color={color} size={18} />
                        </View>
                        
                        <YStack flex={1} marginLeft="$3">
                          <Text color="#0f172a" fontSize={16} fontWeight="400">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                          <XStack alignItems="center" space="$2" marginTop={2}>
                            <Text color="#475569" fontSize={13}>{formatTime(log.createdAt)}</Text>
                            {log.isTranslated && (
                              <Text color="#10b981" fontSize={11} fontWeight="bold">AI Translated</Text>
                            )}
                          </XStack>
                        </YStack>
                        
                        <YStack alignItems="flex-end">
                          <Text color="#475569" fontSize={14}>{formatDuration(log.durationSeconds)}</Text>
                          {log.durationSeconds > 0 && <Text color="#94a3b8" fontSize={12} marginTop={2}>~{(log.durationSeconds * 2.4).toFixed(0)} kB</Text>}
                        </YStack>
                      </XStack>
                    );
                  })}
                </YStack>
              </Animated.View>
            ))}
          </YStack>

        </ScrollView>
      </SafeAreaView>
      </GradientBackground>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
