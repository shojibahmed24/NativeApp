const fs = require('fs');
const file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `value={{ activeChats, messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, \nsendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, loadConversations, loadingConversations, \nfetchRealMessages, markMessagesAsRead, deleteMessage }}`;
const updated = `value={{ activeChats, messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, sendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, loadConversations, loadingConversations, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally }}`;

// Note: Target string matching with newlines can be flaky, so let's just use a more robust regex
const regex = /value=\{\{[\s\S]*?deleteMessage \}\}/;
if (content.match(regex)) {
  content = content.replace(regex, updated);
  fs.writeFileSync(file, content);
  console.log('Added updateMessageLocally to context export');
} else {
  console.log('Regex failed');
}
