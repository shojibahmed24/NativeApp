const fs = require('fs');
let file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const insertRegex = /\.on\('postgres_changes',\s*\{\s*event:\s*'INSERT',\s*schema:\s*'public',\s*table:\s*'messages'\s*\},[\s\S]*?\.on\('postgres_changes',\s*\{\s*event:\s*'UPDATE'/;

const newInsertBlock = `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMsg = payload.new;
        if (newMsg.sender_id === user.id) return;

        // Determine if it's a group chat using local cache
        const stored = await AsyncStorage.getItem('@active_chats');
        let contactId = newMsg.sender_id; // Default to sender_id (direct chat)
        if (stored) {
          const chats = JSON.parse(stored);
          const chat = chats.find((c: any) => c.id === newMsg.chat_id);
          if (chat && chat.type === 'group') {
             contactId = newMsg.chat_id;
          }
        }

        let decryptedText = newMsg.text;
        if (decryptedText) {
           const { decryptMessage } = require('../utils/cryptoUtils');
           decryptedText = await decryptMessage(decryptedText, user.id, newMsg.sender_id);
        }

        const formattedMsg = {
          id: newMsg.id,
          text: decryptedText,
          time: new Date(newMsg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSender: false,
          status: 'delivered', // initially delivered
          type: newMsg.type || 'text',
          mediaUrl: newMsg.file_url,
          fileName: newMsg.file_name,
          replyToId: newMsg.reply_to_id,
          metadata: newMsg.metadata,
          emoji: /^(\\p{Emoji_Presentation}|\\p{Emoji}\\uFE0F|\\s){1,3}$/u.test((decryptedText || '').trim())
        };

        setMessages(prev => {
          const updated = {
            ...prev,
            [contactId]: [formattedMsg, ...(prev[contactId] || [])] // Prepend for inverted FlatList
          };
          AsyncStorage.setItem('@chat_messages', JSON.stringify(updated));
          return updated;
        });

        // Mark as read logic would emit here
      })
      .on('postgres_changes', { event: 'UPDATE'`;

content = content.replace(insertRegex, newInsertBlock);

const updateRegex = /\.on\('postgres_changes',\s*\{\s*event:\s*'UPDATE',\s*schema:\s*'public',\s*table:\s*'messages'\s*\},[\s\S]*?\.subscribe\(\);/;

const newUpdateBlock = `.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updatedMsg = payload.new;
        setMessages(prev => {
          let targetContactId = null;
          for (const key of Object.keys(prev)) {
            if (prev[key].some(m => m.id === updatedMsg.id)) {
              targetContactId = key;
              break;
            }
          }
          if (!targetContactId) return prev; 
          
          const updated = {
            ...prev,
            [targetContactId]: prev[targetContactId].map(m => m.id === updatedMsg.id ? { ...m, status: updatedMsg.status } : m)
          };
          AsyncStorage.setItem('@chat_messages', JSON.stringify(updated));
          return updated;
        });
      })
      .subscribe();`;

content = content.replace(updateRegex, newUpdateBlock);

fs.writeFileSync(file, content);
console.log('Fixed INSERT and UPDATE real-time listeners');
