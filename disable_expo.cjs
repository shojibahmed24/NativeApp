const fs = require('fs');
const file = 'app/call/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove startVADRecording invocation in useEffect
content = content.replace(/startVADRecording\(\);\s*return \(\) => \{[\s\S]*?clearInterval\(\w+\);\s*\}\s*\};\s*\}, \[\]\);/g, '}, []);');

fs.writeFileSync(file, content);
console.log('Disabled expo-av recording in Call Screen');
