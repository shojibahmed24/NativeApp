const fs = require('fs');
let file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update api.sendMessage
const oldCall = `await api.sendMessage({ 
             receiverId: chatId, 
             text: encryptedText, 
             mediaType: type, 
             fileUrl: finalMediaUrl,
             replyToId: replyToId,`;

const newCall = `await api.sendMessage({ 
             receiverId: chatId, 
             text: encryptedText, 
             mediaType: type, 
             fileUrl: finalMediaUrl,
             replyToId: replyToId,
             fileName: fileName,
             metadata: metadata,`;

content = content.replace(oldCall, newCall);

// Update optimistic message
const oldMsg = `mediaUrl: finalMediaUrl,`;
const newMsg = `mediaUrl: finalMediaUrl,
        fileName: fileName,
        metadata: metadata,`;

content = content.replace(oldMsg, newMsg);

fs.writeFileSync(file, content);
console.log('Fixed sendMessage arguments');
