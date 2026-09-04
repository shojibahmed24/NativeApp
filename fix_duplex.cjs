const fs = require('fs');

// 1. Backend: Remove call:interrupt and call:cancel_audio emission
const backendFile = '../server/src/socket/socketHandler.js';
let backendContent = fs.readFileSync(backendFile, 'utf8');

const backendRegex = /\/\/ Barge-in \/ Interruption Signal[\s\S]*?\}\);/s;
// Let's replace just the emit part
const backendRegex2 = /if \(peerSocketId && interruption\.interrupted\) \{[\s\S]*?io\.to\(peerSocketId\)\.emit\('call:cancel_audio', \{[\s\S]*?\}\);[\s\S]*?\}/;
if (backendContent.match(backendRegex2)) {
  backendContent = backendContent.replace(backendRegex2, '// Interruption signal disabled for Full Duplex mode');
  fs.writeFileSync(backendFile, backendContent);
  console.log('Backend barge-in emit removed');
}

// 2. Frontend: Remove cancellation listener
const frontendFile = 'src/context/CallContext.tsx';
let frontendContent = fs.readFileSync(frontendFile, 'utf8');

const frontendRegex = /\/\/ Interruption \/ Barge-in cancel signal[\s\S]*?socketRef\.current\.on\('call:cancel_audio', \(\) => \{[\s\S]*?\}\);/s;
if (frontendContent.match(frontendRegex)) {
  frontendContent = frontendContent.replace(frontendRegex, '// Full Duplex: Audio cancellation disabled (Microsoft Teams style)');
  fs.writeFileSync(frontendFile, frontendContent);
  console.log('Frontend barge-in listener removed');
}
