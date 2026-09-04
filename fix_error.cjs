const fs = require('fs');
let file = 'src/context/CallContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const errorListener = `

    socketRef.current.on('call:translation_error', (data) => {
      console.error('Translation error:', data.message);
      setTranslationStatus('ready');
      if (Platform.OS !== 'web') {
        const { Alert } = require('react-native');
        Alert.alert('Translation Error', data.message || 'An error occurred during translation.');
      } else {
        alert(data.message || 'Translation Error');
      }
    });`;

if (!content.includes('call:translation_error')) {
  content = content.replace(
    `    socketRef.current.on('call:translated_audio', (data) => {`,
    errorListener + `\n\n    socketRef.current.on('call:translated_audio', (data) => {`
  );
  fs.writeFileSync(file, content);
  console.log('Added translation_error listener');
}
