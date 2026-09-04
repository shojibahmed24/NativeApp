const fs = require('fs');
let file = 'app/(auth)/register.tsx';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('<KeyboardAvoidingView')) {
      if (content.includes(`} from 'react-native';`)) {
        content = content.replace(/}\s+from\s+['"]react-native['"];?/, `, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';`);
      }
      
      content = content.replace(`<YStack flex={1} padding="$6" justifyContent="center" space="$5">`, `<KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>\n      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>\n      <YStack flex={1} padding="$6" justifyContent="center" space="$5">`);
      
      content = content.replace(`</YStack>\n    </GradientBackground>`, `</YStack>\n      </ScrollView>\n      </KeyboardAvoidingView>\n    </GradientBackground>`);
      
      fs.writeFileSync(file, content);
      console.log('Added KeyboardAvoidingView to register.tsx');
    }
}
