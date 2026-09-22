// @ts-nocheck
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, ImageBackground, Platform } from 'react-native';
import { YStack, XStack, Text, Avatar } from 'tamagui';
import { Phone, PhoneOff, Video, Sparkles } from 'lucide-react-native';
import { useCall } from '../context/CallContext';
import { useRouter } from 'expo-router';
import { TOKENS } from '../theme/tokens';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeInUp,
  FadeInDown,
  ZoomIn
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pulsing Avatar Ring
const PulsingRing = ({ size, delay = 0 }: { size: number, delay?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    setTimeout(() => {
      scale.value = withRepeat(withTiming(1.6, { duration: 2000 }), -1, false);
      opacity.value = withRepeat(withTiming(0, { duration: 2000 }), -1, false);
    }, delay);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[
      StyleSheet.absoluteFillObject,
      {
        borderRadius: 999,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.6)',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        width: size,
        height: size,
      },
      style
    ]} />
  );
};

export default function IncomingCallModal() {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useCall();
  const router = useRouter();

  if (!incomingCall) return null;

  const handleAccept = async () => {
    await acceptIncomingCall();
    router.push(`/call/${incomingCall.callId}`);
  };

  const handleReject = () => {
    rejectIncomingCall();
  };

  const avatarUrl = incomingCall.caller?.avatar;
  const callerName = incomingCall.caller?.name || 'Unknown Caller';
  const initial = callerName.charAt(0).toUpperCase();

  return (
    <Modal visible={!!incomingCall} transparent animationType="fade">
      <View style={styles.container}>
        {/* Dynamic Background */}
        {avatarUrl ? (
          <ImageBackground source={{ uri: avatarUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" cachePolicy="memory-disk" transition={200}>
            <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={['#0f2f5c', '#0f172a', '#020617']}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <SafeAreaView style={styles.safeArea}>
          
          {/* Top Section - AI Badge */}
          <YStack flex={1} alignItems="center" paddingTop="$10">
            {incomingCall.isTranslated && (
              <Animated.View entering={FadeInUp.delay(300).springify()}>
                <View style={styles.glassBadge}>
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />
                  <XStack space="$2" alignItems="center" paddingHorizontal="$4" paddingVertical="$2">
                    <Sparkles color={TOKENS.COLORS.SUCCESS} size={16} />
                    <Text color="#fff" fontSize={14} fontWeight="600">AI Translated Call</Text>
                  </XStack>
                </View>
              </Animated.View>
            )}
          </YStack>

          {/* Middle Section - Caller Info & Pulsing Avatar */}
          <YStack flex={2} alignItems="center" justifyContent="center">
            <Animated.View entering={ZoomIn.duration(500)}>
              <View style={styles.avatarContainer}>
                {/* Rings */}
                <PulsingRing size={160} delay={0} />
                <PulsingRing size={160} delay={1000} />
                
                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                  <Avatar circular size={140}>
                    {avatarUrl && <Avatar.Image src={avatarUrl} />}
                    <Avatar.Fallback backgroundColor="$blue8" justifyContent="center" alignItems="center">
                      <Text color="white" fontSize={50} fontWeight="bold">{initial}</Text>
                    </Avatar.Fallback>
                  </Avatar>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).springify()} style={{ alignItems: 'center', marginTop: 40 }}>
              <Text fontSize={36} fontWeight="700" color="#ffffff" textAlign="center" marginBottom="$2" numberOfLines={1}>
                {callerName}
              </Text>
              <Text fontSize={18} color="rgba(255,255,255,0.7)" fontWeight="500">
                Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call...
              </Text>
            </Animated.View>
          </YStack>

          {/* Bottom Section - Controls */}
          <YStack flex={1} justifyContent="flex-end" paddingBottom="$10">
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <XStack justifyContent="space-evenly" alignItems="center" width="100%" paddingHorizontal="$6">
                
                {/* Decline Button */}
                <YStack alignItems="center" space="$3">
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} 
                    onPress={handleReject}
                    activeOpacity={0.8}
                  >
                    <PhoneOff color="#fff" size={32} />
                  </TouchableOpacity>
                  <Text color="rgba(255,255,255,0.8)" fontSize={15} fontWeight="600">Decline</Text>
                </YStack>

                {/* Accept Button */}
                <YStack alignItems="center" space="$3">
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#10b981' }]} 
                    onPress={handleAccept}
                    activeOpacity={0.8}
                  >
                    {incomingCall.isVideo ? <Video color="#fff" size={32} /> : <Phone color="#fff" size={32} />}
                  </TouchableOpacity>
                  <Text color="rgba(255,255,255,0.8)" fontSize={15} fontWeight="600">Accept</Text>
                </YStack>

              </XStack>
            </Animated.View>
          </YStack>

        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  glassBadge: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
