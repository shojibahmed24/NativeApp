const fs = require('fs');
let file = 'app/(main)/messages.tsx';
let content = fs.readFileSync(file, 'utf8');

// First, remove the dangling </Swipeable>
content = content.replace(/<\/Swipeable>\s*<\/Animated\.View>/g, "</Animated.View>");

// Now add Swipeable properly
content = content.replace(/<TouchableOpacity\s*style=\{\[styles\.chatRow/g, "<Swipeable renderRightActions={() => renderRightActions(contact.id)}>\n                    <TouchableOpacity style={[styles.chatRow");
content = content.replace(/<\/TouchableOpacity>\n\s*<\/Animated\.View>/g, "</TouchableOpacity>\n                  </Swipeable>\n                </Animated.View>");

fs.writeFileSync(file, content);
console.log('Fixed Swipeable syntax error');
