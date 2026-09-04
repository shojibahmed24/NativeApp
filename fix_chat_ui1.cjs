const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Header Alignment & Padding
const headerRegex = /<XStack padding="\$3" paddingTop="\$5" alignItems="center" justifyContent="space-between"[\s\S]*?borderBottomColor="rgba\(0,0,0,0\.05\)">/;
const headerReplacement = `<XStack padding="$3" paddingTop="$5" paddingBottom="$3" alignItems="center" justifyContent="space-between" backgroundColor="rgba(255,255,255,0.95)" shadowColor="#000" shadowOpacity={0.08} shadowRadius={8} shadowOffset={{ width: 0, height: 4 }} elevation={4} borderBottomWidth={1} borderBottomColor="rgba(0,0,0,0.05)">`;
content = content.replace(headerRegex, headerReplacement);

// 2. Message Bubbles iMessage Style
const bubbleRegex = /backgroundColor: msg\.isSender \? '#005eb8' : '#fff',\s*padding: 12,\s*borderRadius: 20,\s*borderBottomRightRadius: msg\.isSender \? 4 : 20,\s*borderBottomLeftRadius: msg\.isSender \? 20 : 4,\s*shadowColor: '#000',\s*shadowOpacity: 0\.05,\s*shadowRadius: 5,\s*elevation: 1,/;

const bubbleReplacement = `backgroundColor: msg.isSender ? '#007aff' : '#ffffff',
                padding: 12,
                paddingHorizontal: 16,
                borderRadius: 22,
                borderBottomRightRadius: msg.isSender ? 4 : 22,
                borderBottomLeftRadius: msg.isSender ? 22 : 4,
                shadowColor: msg.isSender ? '#007aff' : '#000',
                shadowOpacity: msg.isSender ? 0.2 : 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: msg.isSender ? 4 : 2,`;
content = content.replace(bubbleRegex, bubbleReplacement);

// 3. Input Field Alignment & Padding
const inputAreaRegex = /<XStack padding="\$3" alignItems="center" backgroundColor="#fff" space="\$2" borderTopWidth=\{1\} borderTopColor="#eee">[\s\S]*?<TouchableOpacity onPress=\{startRecording\}[\s\S]*?<\/View>[\s\S]*?<\/TouchableOpacity>[\s\S]*?<\/XStack>/;

// Let's replace the whole input bar if possible. Actually, searching for XStack padding="$3" alignItems="center" backgroundColor="#fff" space="$2" borderTopWidth={1}
const inputRegex = /<XStack padding="\$3" alignItems="center" backgroundColor="#fff" space="\$2" borderTopWidth=\{1\} borderTopColor="#eee">/g;
content = content.replace(inputRegex, `<XStack padding="$3" paddingVertical="$4" alignItems="center" backgroundColor="#fff" space="$3" borderTopWidth={1} borderTopColor="#f1f5f9" shadowColor="#000" shadowOffset={{ width: 0, height: -3 }} shadowOpacity={0.05} shadowRadius={10} elevation={10}>`);

// Update the text input styling
const textInputRegex = /style=\{\{\s*flex: 1,\s*minHeight: 40,\s*maxHeight: 120,\s*backgroundColor: '#f0f4f8',\s*borderRadius: 20,\s*paddingHorizontal: 16,\s*paddingTop: 10,\s*paddingBottom: 10,\s*fontSize: 16,\s*color: '#333'\s*\}\}/g;
content = content.replace(textInputRegex, `style={{ flex: 1, minHeight: 45, maxHeight: 120, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, fontSize: 16, color: '#0f172a' }}`);

fs.writeFileSync(file, content);
console.log('Fixed chat layout 1');
