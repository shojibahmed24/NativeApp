const fs = require('fs');
const file = '../server/src/socket/socketHandler.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { livekitAgent }')) {
  content = content.replace(/import supabase from '\.\.\/database\/supabaseClient\.js';/, "import supabase from '../database/supabaseClient.js';\nimport { livekitAgent } from '../services/livekitAgentService.js';");
}

const answerRegex = /io\.to\(callerSocketId\)\.emit\('call:connected', \{ callId, receiverId: socket\.user\.id \}\);\s*\}/;
const replacement = `io.to(callerSocketId).emit('call:connected', { callId, receiverId: socket.user.id });
        }
        
        // Spawn AI LiveKit Bot for Hybrid Translation
        // We need to fetch the call details to know the languages
        supabase.from('calls').select('caller_lang, receiver_lang').eq('id', callId).single().then(({ data: callData }) => {
          if (callData) {
            livekitAgent.joinCallAsBot(
              callId, 
              callerId, 
              socket.user.id, 
              callData.caller_lang, 
              callData.receiver_lang, 
              io, 
              userSocketMap
            );
          }
        });`;

if (content.match(answerRegex)) {
  content = content.replace(answerRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Injected LiveKit Bot into socketHandler');
} else {
  console.log('Regex failed');
}
