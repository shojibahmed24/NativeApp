const fs = require('fs');
let file = 'app/(main)/messages.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('Swipeable')) {
    content = content.replace(/import \{ SafeAreaView \} from 'react-native-safe-area-context';/, "import { SafeAreaView } from 'react-native-safe-area-context';\nimport { Swipeable } from 'react-native-gesture-handler';");
}

if (!content.includes('deleteChat =')) {
    content = content.replace(/const \[refreshing, setRefreshing\] = useState\(false\);/, "const [refreshing, setRefreshing] = useState(false);\n\n  const deleteChat = (id) => {\n    Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [\n      { text: 'Cancel', style: 'cancel' },\n      { text: 'Delete', style: 'destructive', onPress: async () => {\n         setConversations(prev => prev.filter(c => c.id !== id));\n         setFiltered(prev => prev.filter(c => c.id !== id));\n      } }\n    ]);\n  };\n\n  const renderRightActions = (id) => (\n    <View style={{ flexDirection: 'row', width: 140 }}>\n      <TouchableOpacity style={{ flex: 1, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center' }}>\n        <Archive color=\"#fff\" size={24} />\n      </TouchableOpacity>\n      <TouchableOpacity onPress={() => deleteChat(id)} style={{ flex: 1, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' }}>\n        <Trash2 color=\"#fff\" size={24} />\n      </TouchableOpacity>\n    </View>\n  );\n");
}

if (!content.includes('<Swipeable')) {
    content = content.replace(/<Animated\.View entering=\{FadeInDown\.delay\(i \* 50\)\}>/, "<Animated.View entering={FadeInDown.delay(i * 50)}>\n                <Swipeable renderRightActions={() => renderRightActions(contact.id)}>");
    content = content.replace(/<\/TouchableOpacity>\n\s*<\/Animated\.View>/g, "</TouchableOpacity>\n                </Swipeable>\n                </Animated.View>");
}

fs.writeFileSync(file, content);
console.log('Added Swipeable to messages.tsx');
