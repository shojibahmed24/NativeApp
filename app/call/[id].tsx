import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, Platform } from 'react-native';
import { YStack, XStack, Text, Avatar } from 'tamagui';
import { useCameraPermissions } from 'expo-camera';
import { MicOff, Grid, Volume2, Plus, Video, MessageSquare, PhoneOff, Mic, VolumeX, ChevronDown, Activity, Lock, Globe } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LiveKitWrapper from '../../src/components/LiveKitWrapper';
import { useCall } from '../../src/context/CallContext';
import { useAuth } from '../../src/context/AuthContext';

import { Audio } from 'expo-av';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  FadeIn,
  FadeInUp
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Pulse Animation Component for Avatar
const PulseRing = ({ isAnimating, size }: { isAnimating: boolean, size: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

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

  return (
    <Animated.View style={[
      StyleSheet.absoluteFillObject,
      {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: size,
        width: size,
        height: size,
      },
      animatedStyle
    ]} />
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
      socket
    } = useCall();

  const isMutedRef = React.useRef(isMuted);
  React.useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  React.useEffect(() => {
    const updateAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: !isSpeakerOn,
        });
      } catch (err) {
        console.warn('Audio mode error:', err);
      }
    };
    if (Platform.OS !== 'web') updateAudioMode();
  }, [isSpeakerOn]);
  
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
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

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = async () => {
    try {
      if (recording) await recording.stopAndUnloadAsync();
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
  const recordingRef = React.useRef<Audio.Recording | null>(null);

  const startVADRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      
      // Enable Hardware Acoustic Echo Cancellation (AEC) by overriding Android audio source to VOICE_COMMUNICATION (7)
      const customOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          audioSource: 7, // MediaRecorder.AudioSource.VOICE_COMMUNICATION (Enables AEC)
        }
      };
      const { recording: newRecording } = await Audio.Recording.createAsync(customOptions);
      
      newRecording.setProgressUpdateInterval(200);
      newRecording.setOnRecordingStatusUpdate(async (status) => {
        if (!status.isRecording || isMutedRef.current) return;
        
        const metering = status.metering || -100;
        if (metering > vadThreshold) {
          isSpeakingRef.current = true;
          silenceFramesRef.current = 0;
        } else {
          if (isSpeakingRef.current) {
            silenceFramesRef.current += 1;
            if (silenceFramesRef.current >= silenceThresholdFrames) {
              isSpeakingRef.current = false;
              silenceFramesRef.current = 0;
              }
          }
        }
      });
      
      recordingRef.current = newRecording;
      setRecording(newRecording);
    } catch (err) {
      console.error('Failed to start VAD recording', err);
    }
  };

  const processAndRestartRecording = async (currentRec: Audio.Recording) => {
    try {
      await currentRec.stopAndUnloadAsync();
      const uri = currentRec.getURI();
      if (uri) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          if (activeCall && user) {
              const sourceLang = user.id === activeCall.callerId ? activeCall.callerLang : activeCall.receiverLang;
              const targetLang = user.id === activeCall.callerId ? activeCall.receiverLang : activeCall.callerLang;
              
              socket?.emit('call:speech_input', { 
                callId: id, 
                speakerId: user.id,
                peerId: activeCall.peer?.id,
                sourceLang: sourceLang || 'en',
                targetLang: targetLang || 'en',
                audioBase64: base64data, 
                isFinal: true
              });
            }
        };
        reader.readAsDataURL(blob);
      }
      
      if (false) {
        
      }
    } catch (err) {
      console.error('Error processing VAD chunk:', err);
    }
  };

  const toggleTranslation = async () => {
    Platform.OS !== 'web' && Haptics.impactAsync();
    try {
      if (false) {
        setIsTranslatingLocal(false);
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
          setRecording(null);
        }
      } else {
        setIsTranslatingLocal(true);
        
      }
    } catch (err) {
      console.error('Failed to toggle translation mic', err);
    }
  };

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
    <LiveKitWrapper token={activeCall?.livekitToken || ''} serverUrl={LIVEKIT_URL}>
      <View style={styles.container}>
      <View style={styles.backgroundImage}>
        {activeCall?.isVideo && permission?.granted ? (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000", justifyContent: "center", alignItems: "center" }]}><Text color="white">Camera disabled for web</Text></View>
        ) : (
          <ImageBackground source={{ uri: contactAvatar }} style={StyleSheet.absoluteFillObject} blurRadius={Platform.OS === 'web' ? 20 : 50} />
        )}
      </View>

      <View style={styles.darkOverlay} />
      
      <YStack flex={1} padding="$6" paddingTop="$10" justifyContent="space-between" style={StyleSheet.absoluteFillObject} zIndex={10}>
        
        <XStack justifyContent="space-between" alignItems="center">
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ChevronDown color="#fff" size={28} />
          </TouchableOpacity>
          <YStack alignItems="center">
            <XStack space="$2" alignItems="center">
              <Lock color="#10b981" size={14} />
              <Text color="#10b981" fontSize={14} fontWeight="600">End-to-end Encrypted</Text>
            </XStack>
          </YStack>
          <View style={{ width: 44 }} /> 
        </XStack>

        <YStack alignItems="center" space="$4">
          <View style={styles.avatarContainer}>
            <PulseRing isAnimating={isPulseActive} size={140} />
            <PulseRing isAnimating={isPulseActive} size={180} />
            <Avatar circular size={120}>
              {contactAvatar && <Avatar.Image src={contactAvatar} />}
              <Avatar.Fallback backgroundColor="rgba(255,255,255,0.2)" justifyContent="center" alignItems="center">
                <Text color="#fff" fontSize={48} fontWeight="bold">
                  {contactName.charAt(0).toUpperCase()}
                </Text>
              </Avatar.Fallback>
            </Avatar>
          </View>
          
          <Animated.Text entering={FadeInUp.delay(200)} style={styles.nameText}>
            {contactName}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(300)} style={styles.phoneText}>
            {contactPhone}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(400)} style={styles.statusText}>
            {statusText}
          </Animated.Text>
        </YStack>

        {lastTranslatedSpeech ? (
          <View style={styles.subtitleContainer}>
            <Text color="#fff" fontSize={18} textAlign="center" fontWeight="500">
              {lastTranslatedSpeech}
            </Text>
          </View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(500)} style={styles.bottomControls}>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 40, padding: 20, paddingTop: 30, paddingBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5, overflow: 'hidden' }}>
            <YStack space="$6">
              <XStack justifyContent="space-around" alignItems="center">
                <GlassButton 
                  icon={isMuted ? <MicOff color="#fff" size={24} /> : <Mic color="#fff" size={24} />} 
                  onPress={() => {
                    Platform.OS !== 'web' && Haptics.selectionAsync();
                    setIsMuted(!isMuted);
                  }} 
                  label="Mute"
                  isActive={isMuted}
                  activeColor="rgba(255,255,255,0.25)"
                />
                <GlassButton 
                  icon={<Video color="#fff" size={24} />} 
                  onPress={() => {
                    Platform.OS !== 'web' && Haptics.selectionAsync();
                  }} 
                  label="Video"
                  isActive={activeCall?.isVideo}
                  activeColor="rgba(255,255,255,0.25)"
                />
                <GlassButton 
                  icon={<Volume2 color="#fff" size={24} />} 
                  onPress={() => {
                    Platform.OS !== 'web' && Haptics.selectionAsync();
                    setIsSpeakerOn(!isSpeakerOn);
                  }} 
                  label="Speaker"
                  isActive={isSpeakerOn}
                  activeColor="rgba(255,255,255,0.25)"
                />
              </XStack>
              <XStack justifyContent="center" marginTop="$2">
                <TouchableOpacity onPress={handleEndCall} activeOpacity={0.8}>
                  <Animated.View style={styles.endCallButton}>
                    <PhoneOff color="white" size={32} />
                  </Animated.View>
                </TouchableOpacity>
              </XStack>
            </YStack>
                    </View>
        </Animated.View>
        </YStack>
    </View>
    </LiveKitWrapper>
  );
}

const GlassButton = ({ icon, onPress, label, isActive, activeColor }: any) => (
  <YStack alignItems="center" space="$2">
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[
        styles.glassButton, 
        isActive && { backgroundColor: activeColor || '#fff' }
      ]}>
        {icon}
      </View>
    </TouchableOpacity>
    <Text color="#fff" fontSize={12} opacity={0.8}>{label}</Text>
  </YStack>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative' },
  nameText: { color: '#fff', fontSize: 32, fontWeight: '700', letterSpacing: 0.5 },
  phoneText: { color: 'rgba(255,255,255,0.7)', fontSize: 18, marginTop: 4 },
  statusText: { color: 'rgba(255,255,255,0.9)', fontSize: 20, fontWeight: '400', marginTop: 12 },
  statusTextActive: { color: '#10b981', fontWeight: 'bold' },
  subtitleContainer: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 },
  controlsWrapper: { width: '100%', paddingHorizontal: 30 },
  bottomControls: { width: '100%', paddingHorizontal: 30 },
  glassButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  endCallButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  translationPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30 },
  translationPillActive: { backgroundColor: '#005eb8' }
});


export function ErrorBoundary({ error, retry }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
      <Text style={{ color: 'red', fontSize: 18, marginBottom: 10 }}>Call Screen Error</Text>
      <Text style={{ color: 'white', textAlign: 'center' }}>{error?.message || 'Unknown error occurred'}</Text>
      <TouchableOpacity onPress={retry} style={{ marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 8 }}>
        <Text style={{ color: 'white' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
