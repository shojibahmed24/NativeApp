const fs = require('fs');
let file = '../server/src/routes/api.js';
let content = fs.readFileSync(file, 'utf8');

const importStatement = `import * as taskController from '../controllers/taskController.js';\n`;
if (!content.includes('taskController')) {
  content = content.replace(/import \* as authController/, importStatement + 'import * as authController');
}

const routes = `
// --- TASKS ---
router.get('/tasks', requireAuth, taskController.getTasks);
router.post('/tasks', requireAuth, taskController.createTask);
router.put('/tasks/:taskId', requireAuth, taskController.updateTaskStatus);
`;

if (!content.includes('/tasks')) {
  content += routes;
  fs.writeFileSync(file, content);
}
