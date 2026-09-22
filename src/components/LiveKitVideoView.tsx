// @ts-nocheck
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let Track: any = null;
let VideoTrack: any = null;
let useTracks: any = null;

if (!isExpoGo) {
  try {
    Track = require('livekit-client').Track;
    const lk = require('@livekit/react-native');
    VideoTrack = lk.VideoTrack;
    useTracks = lk.useTracks;
  } catch (e) {
    console.log('LiveKit video not available');
  }
}

export default function LiveKitVideoView() {
  if (!useTracks || !Track) {
    return <View style={StyleSheet.absoluteFillObject}><Text style={{ color: '#fff', textAlign: 'center', marginTop: 200 }}>Video unavailable in Expo Go</Text></View>;
  }

  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  
  const remoteTrack = tracks.find(t => !t.participant.isLocal);
  const localTrack = tracks.find(t => t.participant.isLocal);

  return (
    <>
      {remoteTrack && (
        <View style={StyleSheet.absoluteFillObject}>
          <VideoTrack trackRef={remoteTrack} style={StyleSheet.absoluteFillObject} />
        </View>
      )}
      {localTrack && (
        <View style={remoteTrack ? styles.pipContainer : StyleSheet.absoluteFillObject}>
          <VideoTrack trackRef={localTrack} style={StyleSheet.absoluteFillObject} />
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

