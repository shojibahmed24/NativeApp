import React from 'react';
import { LiveKitRoom } from '@livekit/react-native';

export default function LiveKitWrapper({ token, serverUrl, children }) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={Boolean(token && token.trim().length > 0)}
      audio={true}
      video={false}
      style={{ flex: 1 }}
    >
      {children}
    </LiveKitRoom>
  );
}
