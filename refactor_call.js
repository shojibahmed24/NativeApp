const fs = require('fs');
const path = './src/context/CallContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add zustand import
content = content.replace("import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';", 
  "import React, { createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react';\nimport { create } from 'zustand';");

// 2. Define useCallStore
const storeCode = `
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
`;
content = content.replace("const CallContext = createContext<any>(null);", storeCode);

// 3. Replace state definitions in CallProvider
content = content.replace(
  /const \[activeCall, setActiveCall\] = useState\(null\); \/\/ active call object\s*const \[incomingCall, setIncomingCall\] = useState\(null\); \/\/ incoming call offer\s*const callStartTimeRef = useRef<number \| null>\(null\);\s*const \[isMuted, setIsMuted\] = useState\(false\);\s*const \[isSpeakerOn, setIsSpeakerOn\] = useState\(false\);\s*const \[translationStatus, setTranslationStatus\] = useState\('ready'\); \/\/ ready, listening, interpreting, speaking, interrupted\s*const \[lastTranslatedSpeech, setLastTranslatedSpeech\] = useState\(null\);\s*const \[callLatency, setCallLatency\] = useState\(0\);/,
  `const callStartTimeRef = useRef<number | null>(null);
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
  } = useCallStore();`
);

content = content.replace(/const \[callHistory, setCallHistory\] = useState<any\[\]>\(\[\]\);/, "");

// 4. Inject functions into the store
const contextValueReplacement = `  const contextValue = useMemo(() => ({
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
`;

content = content.replace(/const contextValue = useMemo\(\(\) => \(\{[\s\S]*?\}\), \[.*?\]\);/, contextValueReplacement);

fs.writeFileSync(path, content, 'utf8');
