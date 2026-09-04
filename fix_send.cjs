const fs = require('fs');
const file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const validTasks = taskInputs\.filter.*?done: false \}\)\);/s;
const updatedSend = `const validTasks = taskInputs.filter(t => (typeof t === 'string' ? t : (t.title || '')).trim() !== '').map((t, i) => ({ id: \`t\${i}_\${Date.now()}\`, title: (typeof t === 'string' ? t : (t.title || '')).trim(), price: typeof t === 'string' ? 0 : parseFloat(t.price || '0'), done: false }));`;

if (content.match(regex)) {
  content = content.replace(regex, updatedSend);
  fs.writeFileSync(file, content);
  console.log('Fixed sendTaskList for objects');
} else {
  console.log('Could not find sendTaskList regex');
}
