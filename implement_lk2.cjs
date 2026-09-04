const fs = require('fs');
const file = 'app/call/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const returnRegex = /return \(\s*<View style=\{styles\.container\}>/;
const updatedReturn = `
  const LIVEKIT_URL = 'wss://unicom-s74unm5v.livekit.cloud';

  return (
    <LiveKitWrapper token={activeCall?.livekitToken || ''} serverUrl={LIVEKIT_URL}>
      <View style={styles.container}>`;

if (content.match(returnRegex)) {
  content = content.replace(returnRegex, updatedReturn);
  
  // The root view is closed before ErrorBoundary. Let's find `</View>\n  );\n}\n\nexport function ErrorBoundary`
  content = content.replace(/<\/View>\s*\);\s*\}\s*export function ErrorBoundary/s, '</View>\n    </LiveKitWrapper>\n  );\n}\n\nexport function ErrorBoundary');
  
  // Add the import
  content = content.replace(/import \{ useLocalSearchParams, useRouter \} from 'expo-router';/, "import { useLocalSearchParams, useRouter } from 'expo-router';\nimport LiveKitWrapper from '../../src/components/LiveKitWrapper';");

  fs.writeFileSync(file, content);
  console.log('Modified app/call/[id].tsx');
} else {
  console.log('Regex failed on app/call/[id].tsx');
}
