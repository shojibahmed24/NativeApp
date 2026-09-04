const fs = require('fs');
let file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update the UPDATE listener
const oldUpdate = `[targetContactId]: prev[targetContactId].map(m => m.id === updatedMsg.id ? { ...m, status: updatedMsg.status } : m)`;
const newUpdate = `[targetContactId]: prev[targetContactId].map(m => m.id === updatedMsg.id ? { ...m, status: updatedMsg.status, metadata: updatedMsg.metadata } : m)`;

content = content.replace(oldUpdate, newUpdate);

// Add updateMessageLocally
const newMethod = `
  const updateMessageLocally = (chatId: string, messageId: string, updates: any) => {
    setMessages(prev => {
      const updated = {
        ...prev,
        [chatId]: (prev[chatId] || []).map(m => m.id === messageId ? { ...m, ...updates } : m)
      };
      AsyncStorage.setItem('@chat_messages', JSON.stringify(updated));
      return updated;
    });
  };
`;

if (!content.includes('updateMessageLocally')) {
    content = content.replace(/const deleteMessage = /g, newMethod + '\n  const deleteMessage = ');
}

// Add to context type
content = content.replace(/deleteMessage: \(messageId: string\) => Promise<void>;/, "deleteMessage: (messageId: string) => Promise<void>;\n  updateMessageLocally: (chatId: string, messageId: string, updates: any) => void;");

// Add to exports
content = content.replace(/deleteMessage,\n\s*activeChats/g, "deleteMessage,\n    updateMessageLocally,\n    activeChats");

fs.writeFileSync(file, content);
console.log('Updated ChatContext');
