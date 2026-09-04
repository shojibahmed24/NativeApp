const fs = require('fs');
let content = fs.readFileSync('app/_layout.tsx.bak', 'utf8');

content = content.replace('import * as Sentry from "@sentry/react-native";', '// import * as Sentry from "@sentry/react-native";');
content = content.replace('Sentry.init({', '// Sentry.init({');
content = content.replace('  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN', '//   dsn: process.env.EXPO_PUBLIC_SENTRY_DSN');
content = content.replace('  tracesSampleRate: 1.0,', '//   tracesSampleRate: 1.0,');
content = content.replace('});', '// });');

fs.writeFileSync('app/_layout.tsx', content);
console.log('Restored layout without Sentry');
