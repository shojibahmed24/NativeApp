const fs = require('fs');
const content = fs.readFileSync('../server/src/controllers/chatController.js', 'utf8');
const match = content.match(/from\('users'\)\s*\.select\('([\w,\s]+)'\)/);
if (match) console.log(match[1]);
