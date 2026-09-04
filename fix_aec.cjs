const fs = require('fs');
const file = 'app/call/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const \{ recording: newRecording \} = await Audio\.Recording\.createAsync\(Audio\.RecordingOptionsPresets\.HIGH_QUALITY\);/;
const updated = `
      // Enable Hardware Acoustic Echo Cancellation (AEC) by overriding Android audio source to VOICE_COMMUNICATION (7)
      const customOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          audioSource: 7, // MediaRecorder.AudioSource.VOICE_COMMUNICATION (Enables AEC)
        }
      };
      const { recording: newRecording } = await Audio.Recording.createAsync(customOptions);`;

if (content.match(regex)) {
  content = content.replace(regex, updated);
  fs.writeFileSync(file, content);
  console.log('Enabled AEC on Android');
} else {
  console.log('Regex failed');
}
