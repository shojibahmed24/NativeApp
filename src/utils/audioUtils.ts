// @ts-nocheck
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

let toneInterval: any = null;
let toneTimeouts: any[] = [];
let activeSound: AudioPlayer | null = null;

const DIAL_URI = 'data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQoAAAAAAP///wD//wAA';
const RING_URI = 'data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQoAAAAAAP///wD//wAA';
const END_URI = 'data:audio/wav;base64,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';

const playSound = async (uri: string, isLooping = false) => {
  try {
    if (activeSound) {
      activeSound.release();
      activeSound = null;
    }
    await setAudioModeAsync({
      playsInSilentMode: true,
      staysActiveInBackground: true,
    });
    activeSound = createAudioPlayer(uri);
    activeSound.loop = isLooping;
    activeSound.play();
  } catch(e) {
    console.warn('Failed to play tone:', e);
  }
};

export const startDialingTone = () => {
  stopTone();
  const ring = () => playSound(DIAL_URI);
  ring();
  toneInterval = setInterval(ring, 4000);
};

export const startRingingTone = () => {
  stopTone();
  const ring = async () => {
    await playSound(RING_URI);
    toneTimeouts.push(setTimeout(() => playSound(RING_URI), 600));
  };
  ring();
  toneInterval = setInterval(ring, 3000);
};

export const stopTone = () => {
  toneTimeouts.forEach(clearTimeout);
  toneTimeouts = [];
  if (toneInterval) {
    clearInterval(toneInterval);
    toneInterval = null;
  }
  if (activeSound) {
    activeSound.release();
    activeSound = null;
  }
};

export const playEndCallTone = () => {
  stopTone();
  playSound(END_URI).then(() => {
    toneTimeouts.push(setTimeout(() => playSound(END_URI), 250));
    toneTimeouts.push(setTimeout(() => playSound(END_URI), 500));
  });
};
