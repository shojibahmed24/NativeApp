const fs = require('fs');
let file = 'src/context/CallContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /socketRef\.current\.on\('call:connected', \(\) => \{[\s\S]*?playTranslatedVoice\(data\.audioBase64, data\.translatedText, data\.targetLang\);\s*\}\);/;

const replacement = `socketRef.current.on('call:connected', () => {
        stopTone();
        setTranslationStatus('ready');
        if (!timerRef.current) {
          timerRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
        }
    });

    socketRef.current.on('call:translated_audio', (data) => {
      setTranslationStatus('speaking');
      // Play synthesized audio (Base64) or fallback to text
      playTranslatedVoice(data.audioBase64, data.translatedText, data.targetLang);
    });

    socketRef.current.on('call:translation_error', (data) => {
      console.error('Translation error:', data.message);
      setTranslationStatus('error');
      if (typeof alert !== 'undefined') {
        alert('Translation Error: ' + data.message);
      }
    });`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Successfully applied all socket fixes via Regex!');
} else {
  console.log('Regex did not match!');
}
