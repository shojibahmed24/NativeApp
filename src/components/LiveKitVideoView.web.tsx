// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Track } from 'livekit-client';
import { VideoTrack, useTracks } from '@livekit/components-react';

export default function LiveKitVideoView() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  
  const remoteTrack = tracks.find(t => !t.participant.isLocal);
  const localTrack = tracks.find(t => t.participant.isLocal);

  return (
    <>
      {remoteTrack && (
        <View style={StyleSheet.absoluteFillObject}>
          <VideoTrack trackRef={remoteTrack} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </View>
      )}
      {localTrack && (
        <View style={remoteTrack ? styles.pipContainer : StyleSheet.absoluteFillObject}>
          <VideoTrack trackRef={localTrack} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pipContainer: {
    position: 'absolute',
    right: 20,
    top: 100,
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 100
  }
});
