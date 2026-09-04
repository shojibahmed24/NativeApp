const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace uploadFile with a regex that matches regardless of whitespace
content = content.replace(/const formDataFile\s*=\s*\{\s*uri:\s*asset\.uri,\s*name:\s*fileName,\s*type:\s*mimeType\s*\};\s*const uploadRes\s*=\s*await api\.uploadFile\(formDataFile,\s*'chat'\);/g, `
          let uploadRes;
          if (Platform.OS === 'web' && asset.base64) {
            uploadRes = await api.uploadBase64(asset.base64, fileName, mimeType, 'chat');
          } else {
            const formDataFile = { uri: asset.uri, name: fileName, type: mimeType };
            uploadRes = await api.uploadFile(formDataFile, 'chat');
          }
`);

fs.writeFileSync(file, content);
console.log('Fixed chat image upload properly');
