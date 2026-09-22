// @ts-nocheck
import React from 'react';
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import { useCall } from '../context/CallContext';
import { useEffect } from 'react';

function LiveKitSync() {
  const { isMuted, activeCall } = useCall();
  const { localParticipant } = useLocalParticipant();

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

export default function LiveKitWrapper({ token, activeCall, children }) {
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
    >
      {children}
      <LiveKitSync />
      {(!activeCall || !activeCall.isTranslated) && <RoomAudioRenderer />}
    </LiveKitRoom>
  );
}
