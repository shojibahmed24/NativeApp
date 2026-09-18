import React from 'react';
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

// LiveKit requires WebRTC native module - NOT available in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

let LiveKitRoom: any = null;
let useLocalParticipant: any = null;
let useRemoteParticipants: any = null;

if (!isExpoGo) {
  try {
    const lk = require('@livekit/react-native');
    lk.registerGlobals?.();
    LiveKitRoom = lk.LiveKitRoom;
    useLocalParticipant = lk.useLocalParticipant;
    useRemoteParticipants = lk.useRemoteParticipants;
  } catch (e) {
    console.log('LiveKit not available');
  }
}

function LiveKitSync() {
  const { isMuted, activeCall } = useCall();
  const localParticipantHook = useLocalParticipant ? useLocalParticipant() : { localParticipant: null };
  const { localParticipant } = localParticipantHook;

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted, localParticipant]);

  useEffect(() => {
    if (localParticipant && activeCall) {
      localParticipant.setCameraEnabled(activeCall.isVideo);
    }
  }, [activeCall?.isVideo, localParticipant]);

  return null;
}

function TranslatedCallSubscriber({ callId }) {
  const participants = useRemoteParticipants ? useRemoteParticipants() : [];
  const { user } = useAuth();
  const { activeCall } = useCall();
  
  const isCaller = activeCall?.callerId === user?.id;

  useEffect(() => {
    participants.forEach(p => {
      const isBot = p.identity === `ai_bot_${callId}`;
      
      if (!isBot) {
         p.videoTrackPublications.forEach(pub => {
            if (!pub.isSubscribed) {
               pub.setSubscribed(true);
            }
         });
      }
      
      p.audioTrackPublications.forEach(pub => {
        if (isBot) {
           const trackName = pub.trackName;
           const isMyTrack = isCaller ? trackName === 'translation_for_caller' : trackName === 'translation_for_receiver';
           
           if (isMyTrack && !pub.isSubscribed) {
              pub.setSubscribed(true);
           }
        }
      });
    });
  }, [participants, callId, isCaller]);

  return null;
}

export default function LiveKitWrapper({ token, activeCall, children }) {
  // Fallback for Expo Go - LiveKit requires native WebRTC
  if (!LiveKitRoom) {
    return (
      <View style={styles.fallback}>
        {children}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>📞 LiveKit/WebRTC unavailable in Expo Go</Text>
          <Text style={styles.noticeSubText}>Build a development build to test calls</Text>
        </View>
      </View>
    );
  }

  const serverUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL || 'wss://unicom-s74unm5v.livekit.cloud';

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={Boolean(token && token.trim().length > 0)}
      audio={true}
      video={activeCall?.isVideo}
      options={{
        autoSubscribe: !activeCall?.isTranslated
      }}
      style={{ flex: 1 }}
    >
      {children}
      <LiveKitSync />
      {activeCall?.isTranslated && <TranslatedCallSubscriber callId={activeCall.id} />}
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1 },
  notice: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 16, alignItems: 'center' },
  noticeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  noticeSubText: { color: '#aaa', fontSize: 12, marginTop: 4 },
});
