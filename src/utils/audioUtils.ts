import { Platform } from 'react-native';

let toneOscillator: any = null;
let toneInterval: any = null;
let audioCtx: any = null;

const initAudio = () => {
  if (Platform.OS !== 'web') return;
  if (!audioCtx) {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playBeep = (freq1: number, freq2: number, duration: number) => {
  if (Platform.OS !== 'web') return;
  initAudio();
  if (!audioCtx) return;

  try {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq1, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(freq2, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + duration);
    osc2.stop(audioCtx.currentTime + duration);
  } catch (e) {}
};

export const startDialingTone = () => {
  stopTone();
  if (Platform.OS !== 'web') return;
  const ring = () => {
    playBeep(425, 425, 1.5);
  };
  ring();
  toneInterval = setInterval(ring, 4000);
};

export const startRingingTone = () => {
  stopTone();
  if (Platform.OS !== 'web') return;
  const ring = () => {
    playBeep(440, 480, 0.4);
    setTimeout(() => playBeep(440, 480, 0.4), 600);
  };
  ring();
  toneInterval = setInterval(ring, 3000);
};

export const stopTone = () => {
  if (toneInterval) {
    clearInterval(toneInterval);
    toneInterval = null;
  }
};

export const playEndCallTone = () => {
  stopTone();
  if (Platform.OS !== 'web') return;
  try {
    playBeep(400, 400, 0.15);
    setTimeout(() => playBeep(400, 400, 0.15), 250);
    setTimeout(() => playBeep(400, 400, 0.15), 500);
  } catch(e) {}
};
