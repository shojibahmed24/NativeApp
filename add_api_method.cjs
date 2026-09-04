const fs = require('fs');
let file = 'src/services/api.js';
let content = fs.readFileSync(file, 'utf8');

const newMethod = `
  updateMessageMetadata(messageId, metadata) {
    return this.request(\`/chat/messages/\${messageId}/metadata\`, {
      method: 'PUT',
      body: JSON.stringify({ metadata })
    });
  },
`;

if (!content.includes('updateMessageMetadata(')) {
    content = content.replace(/deleteMessage\(messageId\) \{[\s\S]*?\},/, (match) => match + newMethod);
    fs.writeFileSync(file, content);
}
console.log('Added updateMessageMetadata to api.js');
