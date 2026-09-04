const fs = require('fs');
let file = 'app/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{(\/\* Dynamic Theme \*\/)\}\s*<Theme name=\{useColorScheme\(\) === 'dark' \? 'dark' : 'light'\}>/, `<Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>`);

// Add const colorScheme = useColorScheme(); in the component
content = content.replace(/export default function RootLayout\(\) \{/, "export default function RootLayout() {\n  const colorScheme = useColorScheme();");

// Oh wait, the layout component is actually `export default function RootLayout()` which wraps `RootLayoutNav`.
// Let's check the exact component structure in _layout.tsx
