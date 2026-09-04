const fs = require('fs');
let file = 'app/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure Text is imported from react-native
if (!content.includes('import { Platform, useColorScheme, Text } from \'react-native\'')) {
    content = content.replace(/import \{ Platform, useColorScheme \} from 'react-native';/, "import { Platform, useColorScheme, Text } from 'react-native';");
}

fs.writeFileSync(file, content);
console.log('Fixed Text import in layout');
