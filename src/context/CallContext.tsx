import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client/dist/socket.io.js';
import { api, SOCKET_URL } from '../services/api';
import { useAuth } from './AuthContext';
import { startDialingTone, startRingingTone, stopTone, playEndCallTone } from '../utils/audioUtils';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const CallContext = createContext<any>(null);

export const CallProvider = ({ children }) => {
  const { user, refreshUser } = useAuth();

  const [activeCall, setActiveCall] = useState(null); // active call object
  const [incomingCall, setIncomingCall] = useState(null); // incoming call offer
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [translationStatus, setTranslationStatus] = useState('ready'); // ready, listening, interpreting, speaking, interrupted
  const [lastTranslatedSpeech, setLastTranslatedSpeech] = useState(null);
  const [callLatency, setCallLatency] = useState(0);

  // Dynamic Latency Calculation
  useEffect(() => {
    let pingInterval;
    if (activeCall) {
      pingInterval = setInterval(async () => {
        const start = Date.now();
        try {
          await api.request('/health'); // Light ping to backend
          setCallLatency(Date.now() - start);
        } catch (e) {
          // Keep previous latency or set high if failing
        }
      }, 5000);
    } else {
      setCallLatency(0);
    }
    return () => clearInterval(pingInterval);
  }, [activeCall]);
  const [callHistory, setCallHistory] = useState<any[]>([]);

  const socketRef = useRef(null);
  const activeCallRef = useRef(null);
  const timerRef = useRef(null);

  // Handle Audio Hardware Routing
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const updateAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: !isSpeakerOn,
        });
      } catch (e) {
        console.error('Failed to set audio mode', e);
      }
    };
    updateAudioMode();
  }, [isSpeakerOn]);

  // Load call history from API when user is available
  useEffect(() => {
    if (!user?.id) return;
    api.getCallHistory().then((res: any) => {
      if (res?.calls) setCallHistory(res.calls);
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    
    // Pass JWT token for Socket authentication
    const token = api.getToken();
    socketRef.current = io(SOCKET_URL || 'http://localhost:5000', { 
      path: '/socket.io',
      auth: { token }
    });
    
    // We still emit user:join to trigger presence logic, though backend now uses token user.id
    socketRef.current.emit('user:join');

    // Listen for incoming call
    socketRef.current.on('call:incoming', (data) => {
      startRingingTone();
      setIncomingCall(data);
    });

    // Call answered
    socketRef.current.on('call:connected', () => {
        stopTone();
        setTranslationStatus('ready');
        if (!timerRef.current) {
          timerRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
        }
    });

    socketRef.current.on('call:translated_audio', (data) => {
      setTranslationStatus('speaking');
      // Play synthesized audio (Base64) or fallback to text
      playTranslatedVoice(data.audioBase64, data.translatedText, data.targetLang);
    });

    socketRef.current.on('call:translation_error', (data) => {
      console.error('Translation error:', data.message);
      setTranslationStatus('error');
      if (typeof alert !== 'undefined') {
        alert('Translation Error: ' + data.message);
      }
    });

    // Full Duplex: Audio cancellation disabled (Microsoft Teams style)

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    };
  }, [user]);

  const startVoiceCall = async (peerUser, isVideo = false) => {
    try {
      const res = await api.initiateCall(peerUser.id);
      const callData = {
        ...res.call,
        id: res.call.id,
        callerId: res.call.caller_id,
        receiverId: res.call.receiver_id,
        callerLang: res.call.caller_lang,
        receiverLang: res.call.receiver_lang,
        isTranslated: res.call.is_translated,
        peer: peerUser,
        livekitToken: res.livekitToken
      };

      setActiveCall(callData);
    activeCallRef.current = callData;
        setCallDuration(0);
        setTranslationStatus('ready');
        startDialingTone();

      socketRef.current.emit('call:offer', {
        callId: res.call.id,
        caller: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          language: user.language
        },
        receiverId: peerUser.id,
        isTranslated: res.call.is_translated,
        callerLang: res.call.caller_lang,
        receiverLang: res.call.receiver_lang
      });

      return res;
    } catch (err) {
      alert(err.message || 'Could not initiate voice call.');
      throw err;
    }
  };

  
  const startVideoCall = async (peerUser) => {
    return startVoiceCall(peerUser, true);
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      const res = await api.joinCall(incomingCall.callId);

      setActiveCall({
        id: incomingCall.callId,
        callerId: incomingCall.caller.id,
        receiverId: user.id,
        callerLang: incomingCall.callerLang,
        receiverLang: incomingCall.receiverLang,
        isTranslated: incomingCall.isTranslated,
        peer: incomingCall.caller,
        livekitToken: res.livekitToken
      });

      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      socketRef.current.emit('call:answer', {
        callId: incomingCall.callId,
        callerId: incomingCall.caller.id
      });

      setIncomingCall(null);
    } catch (err) {
      alert('Failed to join call.');
    }
  };

  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    socketRef.current.emit('call:reject', {
      callId: incomingCall.callId,
      callerId: incomingCall.caller.id
    });
    setIncomingCall(null);
  };

  const speakInCall = useCallback((text, audioBuffer = null) => {
    if (!activeCallRef.current || (!text?.trim() && !audioBuffer)) return;

    setTranslationStatus('interpreting');

    const sourceLang = user.id === activeCallRef.current.callerId ? activeCallRef.current.callerLang : activeCallRef.current.receiverLang;
    const targetLang = user.id === activeCallRef.current.callerId ? activeCallRef.current.receiverLang : activeCallRef.current.callerLang;

    socketRef.current.emit('call:speech_input', {
      callId: activeCallRef.current.id,
      speakerId: user.id,
      peerId: activeCallRef.current.peer.id,
      sourceLang,
      targetLang,
      rawText: text ? text.trim() : '',
      audioBuffer,
      isFinal: true
    });
  }, [user]);

  const triggerBargeIn = () => {
    if (!activeCall) return;
    socketRef.current.emit('call:interrupt', {
      callId: activeCall.id,
      speakerId: user.id,
      peerId: activeCall.peer.id
    });
  };

  // Audio context for real AI TTS playback
  const audioCtxRef = useRef(null);
  const activeAudioSourceRef = useRef(null);

  const initAudioCtx = () => {
    if (Platform.OS !== 'web') return;
    if (!audioCtxRef.current) {
      const AudioContext = (Platform.OS === 'web' ? window.AudioContext || (window as any).webkitAudioContext : null) as any;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

    const playTranslatedVoice = async (base64Audio: string, fallbackText: string, lang: string) => {
    if (!activeCallRef.current) return; // Ignore delayed audio if call is ended

    try {
      if (Platform.OS === 'web') {
        initAudioCtx();
        // Stop any currently playing audio (Barge-in support)
        if (activeAudioSourceRef.current) {
          activeAudioSourceRef.current.stop();
          activeAudioSourceRef.current.disconnect();
        }

        if (!base64Audio) {
          console.warn('No base64 audio received, falling back to browser TTS');
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(fallbackText);
            utterance.lang = lang === 'bn' ? 'bn-BD' : lang === 'hi' ? 'hi-IN' : lang === 'ar' ? 'ar-SA' : 'en-US';
            utterance.onend = () => setTranslationStatus('ready');
            window.speechSynthesis.speak(utterance);
          } else {
            setTimeout(() => setTranslationStatus('ready'), 2000);
          }
          return;
        }

        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

        const audioBuffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtxRef.current.destination);
        
        source.onended = () => {
          setTranslationStatus('ready');
          activeAudioSourceRef.current = null;
        };
        
        activeAudioSourceRef.current = source;
        source.start(0);
      } else {
        // --- NATIVE MOBILE PLAYBACK ---
        if (nativeSoundRef.current) {
          try {
            await nativeSoundRef.current.stopAsync();
            await nativeSoundRef.current.unloadAsync();
          } catch(e){}
          nativeSoundRef.current = null;
        }

        if (base64Audio) {
          const uri = `data:audio/mpeg;base64,${base64Audio}`;
          const { sound } = await Audio.Sound.createAsync({ uri });
          nativeSoundRef.current = sound;
          
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              setTranslationStatus('ready');
              sound.unloadAsync();
              nativeSoundRef.current = null;
            }
          });
          
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: 1, // DoNotMix
            interruptionModeAndroid: 1, // DoNotMix
          });
          await sound.playAsync();
        } else {
          setTranslationStatus('ready');
        }
      }
    } catch (err) {
      console.error('Failed to play translated audio:', err);
      setTranslationStatus('ready');
    }
  };

      const endCurrentCall = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (Platform.OS === 'web' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (activeAudioSourceRef.current) {
      activeAudioSourceRef.current.stop();
      activeAudioSourceRef.current.disconnect();
      activeAudioSourceRef.current = null;
    }

    if (activeCall) {
      try {
        await api.endCall(activeCall.id, callDuration, callLatency);
      } catch (err) {
        console.error('Failed to end call in backend:', err);
      } finally {
        if (socketRef.current) {
          socketRef.current.emit('call:end', {
            callId: activeCall.id,
            peerId: activeCall.peer?.id,
            durationSeconds: callDuration,
            avgLatencyMs: callLatency
          });
        }
        refreshUser();
      }
    }

    stopTone();
    setActiveCall(null);
      activeCallRef.current = null;
    activeCallRef.current = null;
    activeCallRef.current = null;
    setCallDuration(0);
    setLastTranslatedSpeech(null);
    setTranslationStatus('ready');
  };

  return (
    <CallContext.Provider
              value={{
        activeCall,
        incomingCall,
        callDuration,
        isMuted,
        setIsMuted,
        isSpeakerOn,
        setIsSpeakerOn,
        translationStatus,
        lastTranslatedSpeech,
        callLatency,
        callHistory,
        startVoiceCall,
        startVideoCall,
        acceptIncomingCall,
        rejectIncomingCall,
        endCurrentCall,
        speakInCall,
        triggerBargeIn,
        socket: socketRef.current
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);


