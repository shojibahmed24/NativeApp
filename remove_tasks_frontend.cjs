const fs = require('fs');
const file = 'app/(main)/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<Tabs\.Screen\s+name="tasks"[\s\S]*?\/>/, '');
fs.writeFileSync(file, content);

if (fs.existsSync('app/(main)/tasks.tsx')) {
  fs.unlinkSync('app/(main)/tasks.tsx');
}
console.log('Removed Tasks frontend');
