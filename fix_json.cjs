const fs = require('fs');
let file = 'src/services/api.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/body: taskData,/, 'body: JSON.stringify(taskData),');
fs.writeFileSync(file, content);
console.log('Fixed api.js createTask body');

let tasksFile = 'app/(main)/tasks.tsx';
let tasksContent = fs.readFileSync(tasksFile, 'utf8');
tasksContent = tasksContent.replace(/body: \{ status: newStatus \}/, 'body: JSON.stringify({ status: newStatus })');
fs.writeFileSync(tasksFile, tasksContent);
console.log('Fixed tasks.tsx API call');
