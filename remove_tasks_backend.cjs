const fs = require('fs');

// Server API routes
const serverApiFile = '../server/src/routes/api.js';
if (fs.existsSync(serverApiFile)) {
    let content = fs.readFileSync(serverApiFile, 'utf8');
    content = content.replace(/import \* as taskController from '\.\.\/controllers\/taskController\.js';\n/, '');
    content = content.replace(/\/\/ --- TASKS ---[\s\S]*?router\.put\('\/tasks\/:taskId', requireAuth, taskController\.updateTaskStatus\);\n/, '');
    fs.writeFileSync(serverApiFile, content);
}

// Frontend API service
const clientApiFile = 'src/services/api.js';
if (fs.existsSync(clientApiFile)) {
    let content = fs.readFileSync(clientApiFile, 'utf8');
    content = content.replace(/\/\/ TASKS[\s\S]*?createTask\(taskData\) \{[\s\S]*?\},/, '');
    fs.writeFileSync(clientApiFile, content);
}

// Controller
if (fs.existsSync('../server/src/controllers/taskController.js')) {
    fs.unlinkSync('../server/src/controllers/taskController.js');
}

console.log('Removed Tasks backend');
