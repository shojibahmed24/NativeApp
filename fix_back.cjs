const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<TouchableOpacity onPress={() => router.back()} style={{ padding: 6, backgroundColor: '#f0f4f8', borderRadius: 20 }}>`;
const replacement = `<TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)/messages')} style={{ padding: 6, backgroundColor: '#f0f4f8', borderRadius: 20 }}>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Fixed back button');
} else {
    console.log('Could not find back button target');
}
