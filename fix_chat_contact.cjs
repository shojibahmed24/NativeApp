const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// robust find
content = content.replace(/c => c\.contact && c\.contact\.id === id/, "c => c.contact && String(c.contact.id) === String(id)");

// robust fallback
const oldFallback = `api.getProfile(id as string).then(res => {
          if (res.success) setRecipient(res.user);
        });`;
const newFallback = `api.getPublicProfile(id as string).then(res => {
          if (res.success) setRecipient(res.user);
        });`;
content = content.replace(oldFallback, newFallback);

// also check if activeChats is being ignored if length is 0, wait for it!
const effStart = `if (activeChats && activeChats.length > 0) {`;
const newEffStart = `if (activeChats && activeChats.length > 0) {`;
// wait, if we just use the API as fallback, api.getPublicProfile is right.

fs.writeFileSync(file, content);
console.log('Fixed contact matching in chat');
