const fs = require('fs');
const file = 'app/call/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove all expo-av and audio recording logic
content = content.replace(/import \{ Audio \} from 'expo-av';/, '');
content = content.replace(/const \[recording, setRecording\] = React\.useState<any>\(null\);/g, '');
content = content.replace(/const recordingRef = React\.useRef<any>\(null\);/g, '');
content = content.replace(/const startVADRecording = async \(\) => \{[\s\S]*?\}\s*};\s*/g, '');
content = content.replace(/const processAndRestartRecording = async \(\w+\) => \{[\s\S]*?\}\s*};\s*/g, '');
content = content.replace(/const updateAudioMode = async \(\) => \{[\s\S]*?\}\s*};\s*if \(Platform\.OS !== 'web'\) updateAudioMode\(\);/g, '');
content = content.replace(/React\.useEffect\(\(\) => \{\s*startVADRecording\(\);\s*return \(\) => \{[\s\S]*?\}\s*\}, \[\]\);/g, '');
content = content.replace(/import LiveKitWrapper from '\.\.\/\.\.\/src\/components\/LiveKitWrapper';/g, ''); // in case we run multiple times
content = content.replace(/import \{ useLocalSearchParams, useRouter \} from 'expo-router';/, "import { useLocalSearchParams, useRouter } from 'expo-router';\nimport LiveKitWrapper from '../../src/components/LiveKitWrapper';");

// 2. Wrap return statement in LiveKitWrapper
const returnRegex = /return \(\s*<ImageBackground/;
const updatedReturn = `
  const LIVEKIT_URL = 'wss://unicom-s74unm5v.livekit.cloud';

  return (
    <LiveKitWrapper token={activeCall?.livekitToken || ''} serverUrl={LIVEKIT_URL}>
      <ImageBackground`;

if (content.match(returnRegex)) {
  content = content.replace(returnRegex, updatedReturn);
  // Add closing tag
  content = content.replace(/<\/ImageBackground>\s*\);/g, '</ImageBackground>\n    </LiveKitWrapper>\n  );');
  fs.writeFileSync(file, content);
  console.log('Modified app/call/[id].tsx');
} else {
  console.log('Regex failed on app/call/[id].tsx');
}
