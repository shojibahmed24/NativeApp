const fs = require('fs');
const glob = require('glob');

function searchAndReplace(dir) {
  if (dir.includes('node_modules') || dir.includes('.expo')) return;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      searchAndReplace(name);
    } else if (name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.js')) {
      let content = fs.readFileSync(name, 'utf8');
      if (content.includes('profilePicture')) {
        content = content.replace(/profilePicture/g, 'avatar');
        fs.writeFileSync(name, content);
        console.log(`Replaced in ${name}`);
      }
    }
  }
}
searchAndReplace('.');
