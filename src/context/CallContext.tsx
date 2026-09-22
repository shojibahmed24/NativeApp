// @ts-nocheck
import React, { createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import io from 'socket.io-client/dist/socket.io.js';
import { api, SOCKET_URL } from '../services/api';
import { useAuth } from './AuthContext';
import { startDialingTone, startRingingTone, stopTone, playEndCallTone } from '../utils/audioUtils';
import { Platform, AppState } from 'react-native';
import { Buffer } from 'buffer';
import { setAudioModeAsync, createAudioPlayer, AudioPlayer } from 'expo-audio';


export const useCallStore = create<any>((set, get) => ({
  activeCall: null,
  incomingCall: null,
  isMuted: false,
  isSpeakerOn: false,
  translationStatus: 'ready',
  lastTranslatedSpeech: null,
  callLatency: 0,
  callHistory: [],
  socket: null,
  callStartTime: null,

  setActiveCall: (updater: any) => set((state: any) => ({ activeCall: typeof updater === 'function' ? updater(state.activeCall) : updater })),
  setIncomingCall: (updater: any) => set((state: any) => ({ incomingCall: typeof updater === 'function' ? updater(state.incomingCall) : updater })),
  setIsMuted: (updater: any) => set((state: any) => ({ isMuted: typeof updater === 'function' ? updater(state.isMuted) : updater })),
  setIsSpeakerOn: (updater: any) => set((state: any) => ({ isSpeakerOn: typeof updater === 'function' ? updater(state.isSpeakerOn) : updater })),
  setTranslationStatus: (updater: any) => set((state: any) => ({ translationStatus: typeof updater === 'function' ? updater(state.translationStatus) : updater })),
  setLastTranslatedSpeech: (updater: any) => set((state: any) => ({ lastTranslatedSpeech: typeof updater === 'function' ? updater(state.lastTranslatedSpeech) : updater })),
  setCallLatency: (updater: any) => set((state: any) => ({ callLatency: typeof updater === 'function' ? updater(state.callLatency) : updater })),
  setCallHistory: (updater: any) => set((state: any) => ({ callHistory: typeof updater === 'function' ? updater(state.callHistory) : updater })),

  setFunctions: (funcs: any) => set(funcs)
}));

const CallContext = createContext<any>(null);


export const CallProvider = ({ children }) => {
  const { user, refreshUser } = useAuth();

  const callStartTimeRef = useRef<number | null>(null);
  const {
    activeCall, setActiveCall,
    incomingCall, setIncomingCall,
    isMuted, setIsMuted,
    isSpeakerOn, setIsSpeakerOn,
    translationStatus, setTranslationStatus,
    lastTranslatedSpeech, setLastTranslatedSpeech,
    callLatency, setCallLatency,
    callHistory, setCallHistory,
    setFunctions
  } = useCallStore();

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
  

  const socketRef = useRef(null);
  const activeCallRef = useRef(null);
  const timerRef = useRef(null);

  // Handle Audio Hardware Routing
  useEffect(() => {
    const updateAudioMode = async () => {
      if (!activeCall) return;
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: !isSpeakerOn,
          interruptionMode: 'mixWithOthers'
        });
      } catch (e) {
        console.warn('Failed to update audio routing:', e);
      }
    };
    updateAudioMode();
  }, [isSpeakerOn, activeCall]);

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
    socketRef.current?.emit('user:join');

    // Listen for incoming call
    socketRef.current.on('call:incoming', (data) => {
      startRingingTone();
      setIncomingCall(data);
    });

    // Call answered
    socketRef.current.on('call:connected', () => {
        stopTone();
        setTranslationStatus('ready');
        callStartTimeRef.current = Date.now();
    });

    const handleCallTermination = () => {
      stopTone();
      playEndCallTone();
      setActiveCall(null);
      activeCallRef.current = null;
      setIncomingCall(null);
      
      
      setTranslationStatus('ready');
      setLastTranslatedSpeech(null);
    };

    socketRef.current.on('call:ended', handleCallTermination);
    socketRef.current.on('call:rejected', handleCallTermination);
    socketRef.current.on('call:timeout', handleCallTermination);
    socketRef.current.on('call:missed', handleCallTermination);

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
        livekitToken: res.livekitToken,
        isVideo
      };

      setActiveCall(callData);
    activeCallRef.current = callData;
        
        setTranslationStatus('ready');
        startDialingTone();

      socketRef.current?.emit('call:offer', {
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

  const toggleVideo = () => {
    setActiveCall(prev => {
      if (!prev) return prev;
      const nextState = { ...prev, isVideo: !prev.isVideo };
      if (activeCallRef.current) activeCallRef.current.isVideo = nextState.isVideo;
      return nextState;
    });
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    stopTone();

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
        livekitToken: res.livekitToken,
        isVideo: incomingCall.isVideo
      });

      callStartTimeRef.current = Date.now();

      socketRef.current?.emit('call:answer', {
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
    stopTone();
    socketRef.current?.emit('call:reject', {
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

    socketRef.current?.emit('call:speech_input', {
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
    socketRef.current?.emit('call:interrupt', {
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

  const nativeSoundRef = useRef<AudioPlayer | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef(false);

  // Helper to append a simple 44-byte WAV header to raw PCM16 data
  const createWavFileFromPcm = (pcmBase64: string, sampleRate = 24000) => {
    try {
      // Use Buffer instead of window.atob to avoid crashes on React Native
      const Buffer = require('buffer').Buffer;
      const pcmBuffer = Buffer.from(pcmBase64, 'base64');
      const pcmLen = pcmBuffer.length;
      
      const wavBuffer = Buffer.alloc(44 + pcmLen);

      // RIFF chunk descriptor
      wavBuffer.write('RIFF', 0);
      wavBuffer.writeUInt32LE(36 + pcmLen, 4);
      wavBuffer.write('WAVE', 8);
      
      // fmt sub-chunk
      wavBuffer.write('fmt ', 12);
      wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size
      wavBuffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
      wavBuffer.writeUInt16LE(1, 22); // NumChannels
      wavBuffer.writeUInt32LE(sampleRate, 24); // SampleRate
      wavBuffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
      wavBuffer.writeUInt16LE(2, 32); // BlockAlign
      wavBuffer.writeUInt16LE(16, 34); // BitsPerSample
      
      // data sub-chunk
      wavBuffer.write('data', 36);
      wavBuffer.writeUInt32LE(pcmLen, 40);
      
      // Write PCM data
      pcmBuffer.copy(wavBuffer, 44);
      
      return wavBuffer.toString('base64');
    } catch(e) {
      console.error('WAV conversion error:', e);
      return null;
    }
  };

  const processNativeAudioQueue = async () => {
    if (isPlayingQueueRef.current || audioQueueRef.current.length === 0 || !activeCallRef.current) return;
    
    isPlayingQueueRef.current = true;
    try {
      const pcmBase64 = audioQueueRef.current.shift();
      if (pcmBase64) {
        const wavBase64 = createWavFileFromPcm(pcmBase64, 24000);
        if (wavBase64) {
          const uri = `data:audio/wav;base64,${wavBase64}`;
          const player = createAudioPlayer(uri);
          nativeSoundRef.current = player;
          
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'mixWithOthers',
          });
          
          player.play();
          
          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status.didJustFinish) {
              player.release();
              nativeSoundRef.current = null;
              isPlayingQueueRef.current = false;
              // Play next chunk
              processNativeAudioQueue();
              if (audioQueueRef.current.length === 0) {
                setTranslationStatus('ready');
              }
            }
          });
          return; // Wait for callback to continue
        }
      }
    } catch (err) {
      console.error('Playback queue error:', err);
    }
    
    isPlayingQueueRef.current = false;
    processNativeAudioQueue();
  };

  let nextPlayTime = 0; // Web Audio API scheduling

  const playTranslatedVoiceStream = async (pcmBase64: string, sampleRate: number) => {
    if (!activeCallRef.current) return;

    if (Platform.OS === 'web') {
      initAudioCtx();
      try {
        const binaryString = window.atob(pcmBase64);
        const len = binaryString.length;
        // Int16Array parse
        const int16Array = new Int16Array(len / 2);
        for (let i = 0; i < len; i += 2) {
          // Little endian
          const lsb = binaryString.charCodeAt(i);
          const msb = binaryString.charCodeAt(i + 1);
          int16Array[i / 2] = (msb << 8) | lsb;
        }

        const float32 = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32[i] = int16Array[i] / 32768.0;
        }

        const buffer = audioCtxRef.current.createBuffer(1, float32.length, sampleRate);
        buffer.copyToChannel(float32, 0);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        
        if (nextPlayTime < audioCtxRef.current.currentTime) {
          nextPlayTime = audioCtxRef.current.currentTime;
        }
        
        source.start(nextPlayTime);
        nextPlayTime += buffer.duration;
        
        source.onended = () => {
          if (audioCtxRef.current.currentTime >= nextPlayTime - 0.1) {
            setTranslationStatus('ready');
          }
        };
      } catch (err) {
        console.error('Web audio stream err:', err);
      }
    } else {
      // Native queue
      audioQueueRef.current.push(pcmBase64);
      processNativeAudioQueue();
    }
  };

  const endCurrentCall = async () => {
    const currentDuration = callStartTimeRef.current ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) : 0;
    
    if (Platform.OS === 'web' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (activeAudioSourceRef.current) {
      activeAudioSourceRef.current.stop();
      activeAudioSourceRef.current.disconnect();
      activeAudioSourceRef.current = null;
    }

    if (activeCall) {
      try {
        await api.endCall(activeCall.id, currentDuration, callLatency);
      } catch (err) {
        console.error('Failed to end call in backend:', err);
      } finally {
        if (socketRef.current) {
          socketRef.current?.emit('call:end', {
            callId: activeCall.id,
            peerId: activeCall.peer?.id,
            durationSeconds: currentDuration,
            avgLatencyMs: callLatency
          });
        }
        refreshUser();
      }
    }

    stopTone();
    setActiveCall(null);
    activeCallRef.current = null;
    
    setLastTranslatedSpeech(null);
    setTranslationStatus('ready');
  };

    const contextValue = useMemo(() => ({
    activeCall,
    incomingCall,
    callStartTime: callStartTimeRef.current,
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
    toggleVideo,
    acceptIncomingCall,
    rejectIncomingCall,
    endCurrentCall,
    speakInCall,
    triggerBargeIn,
    socket: socketRef.current
  }), [activeCall, incomingCall, isMuted, isSpeakerOn, translationStatus, lastTranslatedSpeech, callLatency, callHistory]);

  useEffect(() => {
    setFunctions({
      startVoiceCall, startVideoCall, toggleVideo, acceptIncomingCall, rejectIncomingCall, endCurrentCall, speakInCall, triggerBargeIn,
      socket: socketRef.current,
      callStartTime: callStartTimeRef.current,
      setIsMuted, setIsSpeakerOn
    });
  }, [setFunctions, startVoiceCall, startVideoCall, toggleVideo, acceptIncomingCall, rejectIncomingCall, endCurrentCall, speakInCall, triggerBargeIn, socketRef.current, callStartTimeRef.current, setIsMuted, setIsSpeakerOn]);


  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);



