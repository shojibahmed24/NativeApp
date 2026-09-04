const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<View style=\{\{ padding: 12, backgroundColor: inputText\.trim\(\) \? '#005eb8' : isRecording \? '#e74c3c' : '#e6e6e6', borderRadius: 24, transform: \[\{ scale: isRecording \? 1\.2 : 1 \}\], shadowColor: inputText\.trim\(\) \? '#005eb8' : 'transparent', shadowOpacity: 0\.4, shadowRadius: 6, elevation: inputText\.trim\(\) \? 4 : 0 \}\}>/;

const replacement = `<Animated.View entering={FadeInUp} style={{ padding: 14, backgroundColor: inputText.trim() ? '#007aff' : isRecording ? '#ef4444' : '#f1f5f9', borderRadius: 25, transform: [{ scale: isRecording ? 1.25 : 1 }], shadowColor: inputText.trim() ? '#007aff' : isRecording ? '#ef4444' : 'transparent', shadowOpacity: 0.4, shadowRadius: 10, elevation: (inputText.trim() || isRecording) ? 5 : 0 }}>`;

content = content.replace(regex, replacement);

const closeRegex = /<\/View>\s*<\/TouchableOpacity>\s*<\/XStack>/;
content = content.replace(closeRegex, `</Animated.View>\n            </TouchableOpacity>\n          </XStack>`);

fs.writeFileSync(file, content);
console.log('Fixed chat voice UI to use animated view');
