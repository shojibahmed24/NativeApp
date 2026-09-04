const fs = require('fs');
let file = 'app/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the second import of Platform
content = content.replace(/import \{ Platform \} from 'react-native'/, "");

fs.writeFileSync(file, content);
console.log('Fixed duplicate import in layout');
