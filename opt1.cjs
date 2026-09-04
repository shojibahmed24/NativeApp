const fs = require('fs');

const targetFiles = [
  'app/chat/[id].tsx',
  'app/(auth)/login.tsx',
  'app/(main)/calls.tsx',
  'app/(main)/messages.tsx',
  'app/(main)/contacts.tsx',
  'app/(main)/my-profile.tsx',
  'app/call/[id].tsx'
];

for (const file of targetFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let needsSave = false;

    // 1. Ensure KeyboardAvoidingView is optimized for iOS/Android
    if (content.includes('<KeyboardAvoidingView') && !content.includes('behavior={Platform.OS ===')) {
      content = content.replace(/<KeyboardAvoidingView\s+behavior="padding"/g, `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}`);
      needsSave = true;
    }

    // 2. Add SafeAreaView from react-native-safe-area-context instead of react-native if not present, but only if it's the root.
    // Actually, Expo Router automatically adds safe area for headers, but for headerless screens (like chat, login) we need it.
    // Let's just fix the SafeAreaView imports first.
    if (content.includes('SafeAreaView } from \'react-native\'')) {
      content = content.replace(/SafeAreaView\s*,?\s*/, '');
      if (!content.includes('react-native-safe-area-context')) {
        content = `import { SafeAreaView } from 'react-native-safe-area-context';\n` + content;
      }
      needsSave = true;
    }
    
    // Some files might import SafeAreaView from tamagui, which is fine, but react-native-safe-area-context is better for standard edges.

    if (needsSave) {
      fs.writeFileSync(file, content);
      console.log(`Optimized ${file}`);
    }
  }
}
