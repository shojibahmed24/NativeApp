const fs = require('fs');
let file = 'src/services/api.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('createTask')) {
    const newMethods = `
  // TASKS
  createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: taskData,
    });
  },
`;
    content = content.replace(/updateMessageMetadata\(messageId, metadata\) \{[\s\S]*?\},/, (match) => match + newMethods);
    fs.writeFileSync(file, content);
}
