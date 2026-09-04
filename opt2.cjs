const fs = require('fs');
let file = 'app/(auth)/login.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('<KeyboardAvoidingView')) {
  // Import it
  content = content.replace(`StyleSheet , Image } from 'react-native';`, `StyleSheet , Image, KeyboardAvoidingView, Platform } from 'react-native';`);
  
  // Wrap YStack
  content = content.replace(`<YStack flex={1} padding="$6" justifyContent="center" space="$5">`, `<KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>\n      <YStack flex={1} padding="$6" justifyContent="center" space="$5">`);
  
  content = content.replace(`</YStack>\n    </GradientBackground>`, `</YStack>\n      </KeyboardAvoidingView>\n    </GradientBackground>`);
  
  fs.writeFileSync(file, content);
  console.log('Added KeyboardAvoidingView to login.tsx');
}
