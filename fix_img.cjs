const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/uri: \(recipient\?\.profile_picture \|\| recipient\?\.avatar\)/g, "uri: (recipient?.profile_picture || recipient?.avatar || '')");

fs.writeFileSync(file, content);
console.log('Fixed Image uri fallback');
