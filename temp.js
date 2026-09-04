const fs = require('fs');
const content = fs.readFileSync('src/context/CallContext.tsx', 'utf8');
const match = content.match(/const startVoiceCall = async [\s\S]*?catch \(err\) \{[\s\S]*?\}\s*\};/);
console.log(match ? match[0] : "Not found");
