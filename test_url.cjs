const https = require('https');
https.get('https://kxkabnahclcsitfkllvg.supabase.co/storage/v1/object/public/profiles/b6ff52b9-0491-452b-a429-940199187425_1787383060804.jpg', (res) => {
  console.log('Status:', res.statusCode);
}).on('error', (e) => {
  console.error(e);
});
