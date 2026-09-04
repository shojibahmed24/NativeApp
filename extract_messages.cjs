const fs = require('fs');
const path = 'C:\\Users\\rajsh\\.gemini\\antigravity\\brain\\9c0af05e-1218-43a3-8c24-27517d324fff\\.system_generated\\logs\\transcript_full.jsonl';
const content = fs.readFileSync(path, 'utf8');

const matches = [...content.matchAll(/export default function MessagesScreen[\s\S]*?(?=\{"step_index)/g)];
if (matches.length > 1) {
    // get the one before the current one
    let target = matches[matches.length - 2][0];
    // limit to first 1000 chars to avoid huge console output
    console.log(target.substring(0, 1500));
} else {
    console.log("No previous complex version found.");
}
