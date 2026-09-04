const fs = require('fs');
let file = 'app/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

if(!content.includes('import { Platform, useColorScheme } from')) {
    content = content.replace(/import \{ Platform \} from 'react-native'/, "import { Platform, useColorScheme, Text } from 'react-native'");
}

content = content.replace(/export default function RootLayout\(\) \{/, "export default function RootLayout() {\n  const colorScheme = useColorScheme();");

content = content.replace(/<Theme name=\{useColorScheme\(\) === 'dark' \? 'dark' : 'light'\}>/, `<Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>`);

fs.writeFileSync(file, content);
console.log('Fixed useColorScheme');
