const fs = require('fs');
let file = 'app/(main)/my-profile.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the react-native import block to include ImageBackground
content = content.replace(/import\s*\{\s*([\s\S]*?)\s*\}\s*from\s*'react-native';/, (match, p1) => {
    if (!p1.includes('ImageBackground')) {
        return `import {\n  ${p1},\n  ImageBackground\n} from 'react-native';`;
    }
    return match;
});

fs.writeFileSync(file, content);
console.log('Fixed ImageBackground properly');
