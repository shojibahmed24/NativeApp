const fs = require('fs');
let file = 'app/call/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useAuth')) {
  content = content.replace(`import { useCall } from '../../src/context/CallContext';`, `import { useCall } from '../../src/context/CallContext';\nimport { useAuth } from '../../src/context/AuthContext';`);
}

if (!content.includes('const { user } = useAuth();')) {
  content = content.replace(`export default function CallScreen() {`, `export default function CallScreen() {\n  const { user } = useAuth();`);
}

const targetStr = `socket?.emit('call:speech_input', { callId: id, audioBase64: base64data, language: 'en' });`;
const replaceStr = `if (activeCall && user) {
              const sourceLang = user.id === activeCall.callerId ? activeCall.callerLang : activeCall.receiverLang;
              const targetLang = user.id === activeCall.callerId ? activeCall.receiverLang : activeCall.callerLang;
              
              socket?.emit('call:speech_input', { 
                callId: id, 
                speakerId: user.id,
                peerId: activeCall.peer?.id,
                sourceLang: sourceLang || 'en',
                targetLang: targetLang || 'en',
                audioBase64: base64data, 
                isFinal: true
              });
            }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content);
  console.log('Fixed call:speech_input payload in frontend');
}
