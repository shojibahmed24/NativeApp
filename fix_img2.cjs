const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// I will just make it FORCE load the image by checking if recipient has NO avatar, just use fallback API!
// Actually, let me just add a console log to the screen by rendering the raw JSON of recipient!
// No, I can't see their screen unless they upload.

// What if the Image is failing to render because of React Native Web's Image implementation with border radius?
content = content.replace(/<Image source=\{\{ uri: \(recipient\?\.profile_picture \|\| recipient\?\.avatar \|\| ''\) \}\} style=\{\{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' \}\} \/>/, "<Image source={{ uri: (recipient?.profile_picture || recipient?.avatar || '') }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' }} onError={(e) => console.log('Image Error', e)} />");

fs.writeFileSync(file, content);
