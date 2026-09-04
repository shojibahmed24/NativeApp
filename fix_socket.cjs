const fs = require('fs');
let file = 'src/context/CallContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `    socketRef.current.on('call:connected', () => {
        stopTone();
        setTranslationStatus('ready');
        if (!timerRef.current) {
          timerRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
        }
      setTranslationStatus('speaking');

      // Play synthesized audio (Base64) or fallback to text
      playTranslatedVoice(data.audioBase64, data.translatedText, data.targetLang);
    });`;

const replaceStr = `    socketRef.current.on('call:connected', () => {
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
    });`;

if (content.includes("setTranslationStatus('speaking');")) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content);
  console.log('Fixed call:connected and added call:translated_audio');
} else {
  console.log('Target string not found');
}
