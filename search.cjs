const fs = require('fs');
const glob = require('glob');

function search(dir) {
  if (dir.includes('node_modules') || dir.includes('.expo')) return;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      search(name);
    } else if (name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.js')) {
      const content = fs.readFileSync(name, 'utf8');
      if (content.includes('profilePicture') || content.includes('profile_picture')) {
        console.log(`Found in ${name}`);
      }
    }
  }
}
search('.');
