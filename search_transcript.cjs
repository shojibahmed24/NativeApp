const fs = require('fs');
const path = 'C:\\Users\\rajsh\\.gemini\\antigravity\\brain\\9c0af05e-1218-43a3-8c24-27517d324fff\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');
let found = false;
for (const line of lines) {
  if (line.includes('"view_file"') && line.includes('messages.tsx')) {
    console.log(line.substring(0, 1000));
    found = true;
    break;
  }
}
if(!found) {
  for (const line of lines) {
    if (line.includes('cat ') && line.includes('messages.tsx')) {
      console.log(line.substring(0, 1000));
      break;
    }
  }
}
