const fs = require('fs');
let file = 'app/(auth)/otp.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('<KeyboardAvoidingView')) {
  if (content.includes(`} from 'react-native';`)) {
    content = content.replace(`} from 'react-native';`, `, KeyboardAvoidingView, Platform } from 'react-native';`);
  }
  
  content = content.replace(`<YStack flex={1} padding="$6" justifyContent="center" space="$5">`, `<KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>\n      <YStack flex={1} padding="$6" justifyContent="center" space="$5">`);
  
  content = content.replace(`</YStack>\n    </GradientBackground>`, `</YStack>\n      </KeyboardAvoidingView>\n    </GradientBackground>`);
  
  fs.writeFileSync(file, content);
  console.log('Added KeyboardAvoidingView to otp.tsx');
}
