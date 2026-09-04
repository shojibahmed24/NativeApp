const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// Enable base64 in ImagePicker
content = content.replace(/quality: 0.8,\s*\/\/\s*base64:\s*true\s*removed\s*for\s*multipart\/form-data/g, "quality: 0.8,\n      base64: true");

// Use uploadBase64 on web
const oldUploadBlock = `const formDataFile = { uri: asset.uri, name: fileName, type: mimeType };
            const uploadRes = await api.uploadFile(formDataFile, 'chat');`;

const newUploadBlock = `let uploadRes;
          if (Platform.OS === 'web' && asset.base64) {
            uploadRes = await api.uploadBase64(asset.base64, fileName, mimeType, 'chat');
          } else {
            const formDataFile = { uri: asset.uri, name: fileName, type: mimeType };
            uploadRes = await api.uploadFile(formDataFile, 'chat');
          }`;

content = content.replace(oldUploadBlock, newUploadBlock);

fs.writeFileSync(file, content);
console.log('Fixed chat image upload for web');
