const fs = require('fs');
let file = '../server/src/controllers/authController.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/avatar: user\.avatar,/g, "avatar: user.profile_picture,\n        profile_picture: user.profile_picture,");

fs.writeFileSync(file, content);
console.log('Fixed public profile avatar mapping');
