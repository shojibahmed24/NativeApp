const fs = require('fs');
const file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const \{ messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, sendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, fetchRealMessages, markMessagesAsRead, deleteMessage \} = useChat\(\);/;
const updated = `const { messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, sendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally } = useChat();`;

if (content.match(regex)) {
  content = content.replace(regex, updated);
  fs.writeFileSync(file, content);
  console.log('Added updateMessageLocally');
} else {
  // It might be split across lines
  content = content.replace(/deleteMessage \} = useChat\(\);/, 'deleteMessage, updateMessageLocally } = useChat();');
  fs.writeFileSync(file, content);
  console.log('Added updateMessageLocally via fallback');
}
