const fs = require('fs');
const file = 'src/context/CallContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(activeAudioSourceRef\.current\) \{\s*activeAudioSourceRef\.current\.stop\(\);\s*activeAudioSourceRef\.current\.disconnect\(\);\s*activeAudioSourceRef\.current = null;\s*\}/;

const updated = `if (activeAudioSourceRef.current) {
          activeAudioSourceRef.current.stop();
          activeAudioSourceRef.current.disconnect();
          activeAudioSourceRef.current = null;
        }
        if (nativeSoundRef.current) {
          nativeSoundRef.current.stopAsync().catch(()=>{});
          nativeSoundRef.current.unloadAsync().catch(()=>{});
          nativeSoundRef.current = null;
        }`;

if (content.match(regex)) {
  content = content.replace(regex, updated);
  fs.writeFileSync(file, content);
  console.log('Fixed barge-in for native mobile');
}
