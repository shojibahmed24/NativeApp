const fs = require('fs');
const file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const msg = messages\.find\(m => m\.id === msgId\);/, 'const msg = chatMessages.find(m => m.id === msgId);');
fs.writeFileSync(file, content);
console.log('Fixed messages.find bug');
