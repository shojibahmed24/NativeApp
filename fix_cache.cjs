const fs = require('fs');
let file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('AsyncStorage.removeItem(\'@active_chats\')')) {
    content = content.replace(/const loadConversations = useCallback\(async \(\) => \{/, "const loadConversations = useCallback(async () => {\n      await AsyncStorage.removeItem('@active_chats'); // FORCE CLEAR CACHE");
    fs.writeFileSync(file, content);
}
console.log('Forced cache clear in ChatContext');
