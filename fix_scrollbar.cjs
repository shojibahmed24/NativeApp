const fs = require('fs');

const cssPath = 'app/global.css';
const cssContent = `
/* Hide scrollbar for Chrome, Safari and Opera */
::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
* {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
`;
fs.writeFileSync(cssPath, cssContent);

let layoutPath = 'app/_layout.tsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

if (!layoutContent.includes('global.css') && fs.existsSync('app/_layout.tsx')) {
  layoutContent = `import { Platform } from 'react-native';\nif (Platform.OS === 'web') {\n  require('./global.css');\n}\n` + layoutContent;
  fs.writeFileSync(layoutPath, layoutContent);
  console.log('Added global.css to _layout.tsx');
} else {
  console.log('Layout file missing or already has CSS');
}
