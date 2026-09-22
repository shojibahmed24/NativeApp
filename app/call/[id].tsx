// @ts-nocheck
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, Platform } from 'react-native';
import { YStack, XStack, Text, Avatar } from 'tamagui';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { MicOff, Grid, Volume2, Plus, Video, MessageSquare, PhoneOff, Mic, VolumeX, ChevronDown, Activity, Lock, Globe, Sparkles, AudioWaveform } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LiveKitWrapper from '../../src/components/LiveKitWrapper';
import { useCallStore, useCall } from '../../src/context/CallContext';
import LiveKitVideoView from '../../src/components/LiveKitVideoView';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeInUp,
  SlideInUp,
  FadeOut
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TOKENS } from '../../src/theme/tokens';


const ScaleButton = ({ onPress, style, children, activeScale = 0.9, haptic = Haptics.ImpactFeedbackStyle.Light, ...props }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={1}
        style={style}
        onPressIn={() => { scale.value = withTiming(activeScale, { duration: 100 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
        onPress={(e) => {
          if (Platform.OS !== 'web') Haptics.impactAsync(haptic).catch(()=>{});
          if (onPress) onPress(e);
        }}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

// Pulse Animation Component for Avatar
const PulseRing = ({ isAnimating, size, isTranslating }: { isAnimating: boolean, size: number, isTranslating?: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isAnimating) {
      scale.value = withRepeat(withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
      opacity.value = withRepeat(withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0);
    }
  }, [isAnimating]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const colors = isTranslating 
    ? ['#c084fc', '#2dd4bf'] // Purple to teal for AI
    : ['#38bdf8', '#818cf8']; // Blue to purple for normal

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        borderRadius: size,
        width: size,
        height: size,
        overflow: 'hidden'
      },
      animatedStyle
    ]}>
      <LinearGradient colors={colors as [string, string]} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
    </Animated.View>
  );
};

export default function CallScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { 
    activeCall, 
    callDuration, 
    isMuted, 
    setIsMuted, 
    isSpeakerOn, 
    setIsSpeakerOn, 
    endCurrentCall, 
    translationStatus,
    lastTranslatedSpeech,
      socket,
      toggleVideo
    } = useCall();

  const isMutedRef = React.useRef(isMuted);
  React.useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  React.useEffect(() => {
  }, [isSpeakerOn]);
  const [isTranslatingLocal, setIsTranslatingLocal] = React.useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  React.useEffect(() => {
    if (activeCall?.isVideo && !permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [activeCall?.isVideo]);

  const contactName = activeCall?.peer?.name || 'Unknown Caller';
  const contactPhone = activeCall?.peer?.phone || '';
  const contactAvatar = activeCall?.peer?.avatar || null;
  const isCallActive = !!activeCall;

  // Auto-dismiss the call screen if the peer ends or rejects the call
  React.useEffect(() => {
    if (!activeCall) {
      const t = setTimeout(() => {
        router.replace('/(main)/calls');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [activeCall]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = async () => {
    try {
    } catch (e) {
      console.warn('Error stopping recording:', e);
    }
    Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await endCurrentCall();
    router.replace('/(main)/calls');
  };

  const vadThreshold = -35;
  const silenceThresholdFrames = 5; // ~1 second of silence at 200ms intervals
  const isSpeakingRef = React.useRef(false);
  const silenceFramesRef = React.useRef(0);

    let statusText = 'Connecting...';
  if (isCallActive) {
    if (translationStatus === 'interpreting') statusText = 'Interpreting AI...';
    else if (translationStatus === 'speaking') statusText = 'AI is Speaking...';
    else statusText = formatDuration(callDuration);
  } else {
    statusText = 'Call Ended';
  }

  const isPulseActive = isCallActive && (callDuration === 0 || translationStatus === 'interpreting' || translationStatus === 'speaking');

  
  const LIVEKIT_URL = 'wss://unicom-s74unm5v.livekit.cloud';

  return (
    <View style={styles.container}>
      <LiveKitWrapper token={activeCall?.livekitToken || ''} activeCall={activeCall} serverUrl={LIVEKIT_URL}>
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
        <View style={styles.backgroundImage}>
          {activeCall?.isVideo && permission?.granted ? (
            <LiveKitVideoView />
          ) : (
            <LinearGradient colors={['#090d16', '#0f172a', '#1e1b4b']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} />
          )}
        </View>
        <View style={styles.darkOverlay} />
        <BackgroundWash />
      </View>
      
      <YStack flex={1} padding="$6" paddingTop={Platform.OS === 'android' ? 40 : "$10"} paddingBottom={Platform.OS === 'android' ? 20 : "$6"} justifyContent="space-between" zIndex={10}>
        
        <XStack justifyContent="space-between" alignItems="center">
          <ScaleButton onPress={() => router.back()} style={styles.headerButton}>
            <ChevronDown color="#fff" size={28} />
          </ScaleButton>
          <YStack alignItems="center">
            <View style={styles.encryptionBadge}>
              <Lock color={TOKENS.COLORS.SUCCESS} size={14} style={{ marginRight: 6 }} />
              <Text color={TOKENS.COLORS.SUCCESS} fontSize={13} fontWeight="700">End-to-end Encrypted</Text>
            </View>
          </YStack>
          <View style={{ width: 44 }} /> 
        </XStack>

        <YStack alignItems="center" space="$4">
          <View style={[styles.avatarContainer]}>
            <PulseRing isAnimating={isPulseActive} size={160} isTranslating={translationStatus === 'interpreting' || translationStatus === 'speaking'} />
            <PulseRing isAnimating={isPulseActive} size={200} isTranslating={translationStatus === 'interpreting' || translationStatus === 'speaking'} />
            {/* Glowing border ring */}
            <View style={{ width: 132, height: 132, borderRadius: 66, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              <LinearGradient colors={['#818cf8', '#c084fc', '#38bdf8']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
              <View style={{ width: 124, height: 124, borderRadius: 62, overflow: 'hidden', backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' }}>
                {contactAvatar ? (
                  <Image source={{ uri: contactAvatar }} style={{ width: 124, height: 124, borderRadius: 62, resizeMode: 'cover' }}  contentFit="cover" cachePolicy="memory-disk" transition={200} />
                ) : (
                  <View style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={StyleSheet.absoluteFillObject} />
                    <Text color="#fff" fontSize={48} fontWeight="bold" zIndex={1}>
                      {contactName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <Animated.Text entering={FadeInUp.delay(200)} style={styles.nameText}>
            {contactName}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(300)} style={styles.phoneText}>
            {contactPhone}
          </Animated.Text>
          
          {(translationStatus === 'interpreting' || translationStatus === 'speaking') ? (
            <Animated.View entering={FadeInUp.springify()} exiting={FadeOut} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <PulsingStatusIcon color="#c084fc" />
              <Text color="#c084fc" fontSize={20} fontWeight="700">
                {statusText}
              </Text>
            </Animated.View>
          ) : (
            <Animated.Text entering={FadeInUp.delay(400)} exiting={FadeOut} style={styles.statusText}>
              {statusText}
            </Animated.Text>
          )}
        </YStack>

        {lastTranslatedSpeech ? (
          <Animated.View key={lastTranslatedSpeech} entering={SlideInUp.springify().damping(15)} style={styles.subtitleContainer}>
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: TOKENS.RADIUS.LG, overflow: 'hidden' }]} pointerEvents="none">
              <LinearGradient colors={['rgba(15,23,42,0.6)', 'rgba(30,58,138,0.6)']} style={StyleSheet.absoluteFillObject} />
            </View>
            <XStack space="$2" alignItems="center" marginBottom={8} zIndex={1}>
              <Sparkles color={TOKENS.COLORS.SUCCESS} size={12} />
              <Text color={TOKENS.COLORS.SUCCESS} fontSize={11} fontWeight="700" letterSpacing={0.5}>AI TRANSLATED</Text>
            </XStack>
            <Text color="#fff" fontSize={18} textAlign="left" fontWeight="500" lineHeight={26} zIndex={1}>
              {lastTranslatedSpeech}
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(500)} style={styles.bottomControls}>
          <View style={{ borderRadius: 40, padding: 24, paddingTop: 32, paddingBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderBottomWidth: 0, backgroundColor: '#0f172af0' }}>
            <YStack space="$6">
              <XStack justifyContent="space-evenly" alignItems="center">
                <GlassButton 
                  icon={isMuted ? <MicOff color="#fff" size={26} /> : <Mic color="#fff" size={26} />} 
                  onPress={() => { setIsMuted(!isMuted); }} 
                  label={isMuted ? "Unmute" : "Mute"}
                  isActive={isMuted}
                  activeColor="rgba(239, 68, 68, 0.35)"
                  glowColor="#ef4444"
                />
                <GlassButton 
                  icon={<Video color="#fff" size={26} />} 
                  onPress={toggleVideo} 
                  label="Video"
                  isActive={activeCall?.isVideo}
                  activeColor="rgba(59, 130, 246, 0.35)"
                  glowColor="#3b82f6"
                />
                <GlassButton 
                  icon={isSpeakerOn ? <Volume2 color="#fff" size={26} /> : <VolumeX color="#fff" size={26} />} 
                  onPress={() => { 
                    if (Platform.OS === 'web') {
                      // On web, speaker toggle isn't supported by expo-av
                      return;
                    }
                    setIsSpeakerOn(!isSpeakerOn); 
                  }} 
                  label="Speaker"
                  isActive={isSpeakerOn}
                  activeColor="rgba(59, 130, 246, 0.35)"
                  glowColor="#3b82f6"
                  disabled={Platform.OS === 'web'}
                />
              </XStack>
              <XStack justifyContent="center" marginTop="$3">
                <View style={{ position: 'relative' }}>
                  <EndCallPulse />
                  <ScaleButton onPress={handleEndCall} activeScale={0.85} haptic={Haptics.NotificationFeedbackType.Error}>
                    <View style={styles.endCallButton}>
                      <PhoneOff color="white" size={32} />
                    </View>
                  </ScaleButton>
                </View>
              </XStack>
            </YStack>
          </View>
        </Animated.View>
        </YStack>
      </LiveKitWrapper>
    </View>
  );
}

const EndCallPulse = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.4, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return <Animated.View style={[StyleSheet.absoluteFillObject, { borderRadius: 36, backgroundColor: 'rgba(239,68,68,0.5)' }, animatedStyle]} pointerEvents="none" />;
};

const BackgroundWash = () => {
  const opacity = useSharedValue(0.15);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]} pointerEvents="none">
      <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY_DARK} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />
    </Animated.View>
  );
};

const PulsingStatusIcon = ({ color }: { color: string }) => {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={animatedStyle}>
      <AudioWaveform color={color} size={18} style={{ marginRight: 8 }} />
    </Animated.View>
  );
};

const GlassButton = ({ icon, onPress, label, isActive, activeColor, glowColor, disabled }: any) => (
  <YStack alignItems="center" space="$2" opacity={disabled ? 0.4 : 1}>
    <ScaleButton onPress={disabled ? undefined : onPress}>
      <View style={[
        styles.glassButton, 
        isActive ? { backgroundColor: activeColor, borderWidth: 2, borderColor: '#ffffff', elevation: 3 } : { backgroundColor: 'rgba(255,255,255,0.1)' }
      ]}>
        {icon}
      </View>
    </ScaleButton>
    <Text color="#fff" fontSize={12} opacity={0.8}>{label}</Text>
  </YStack>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  headerButton: { width: 44, height: 44, borderRadius: TOKENS.RADIUS.LG, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  encryptionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: TOKENS.RADIUS.MD, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  avatarContainer: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative' },
  nameText: { color: '#fff', fontSize: 32, fontWeight: '700', letterSpacing: 0.5 },
  phoneText: { color: 'rgba(255,255,255,0.7)', fontSize: 18, marginTop: 4 },
  statusText: { color: 'rgba(255,255,255,0.9)', fontSize: 20, fontWeight: '400', marginTop: 12 },
  statusTextActive: { color: '#10b981', fontWeight: 'bold' },
  subtitleContainer: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 16, borderRadius: TOKENS.RADIUS.LG, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.4)', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  controlsWrapper: { width: '100%', paddingHorizontal: 30 },
  bottomControls: { width: '100%', paddingHorizontal: 30 },
  glassButton: { width: 68, height: 68, borderRadius: TOKENS.RADIUS.XL, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  endCallButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', elevation: 6, borderWidth: 4, borderColor: 'rgba(239, 68, 68, 0.4)' },
  translationPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: TOKENS.RADIUS.XL },
  translationPillActive: { backgroundColor: '#005eb8' }
});


export function ErrorBoundary({ error, retry }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
      <Text style={{ color: 'red', fontSize: 18, marginBottom: 10 }}>Call Screen Error</Text>
      <Text style={{ color: 'white', textAlign: 'center' }}>{error?.message || 'Unknown error occurred'}</Text>
      <TouchableOpacity onPress={retry} style={{ marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: TOKENS.RADIUS.SM }}>
        <Text style={{ color: 'white' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
