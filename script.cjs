const fs = require('fs');
const glob = require('glob'); // Need to check if glob exists, otherwise use plain fs recursion

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.tsx') || name.endsWith('.js')) {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles('app');
console.log(`Found ${files.length} files to check for mobile optimization.`);
