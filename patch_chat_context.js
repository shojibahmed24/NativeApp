const fs = require('fs');
const path = 'C:/Users/rajsh/.gemini/antigravity/scratch/unicom-app/native-app/src/context/ChatContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { uploadMediaToSupabase } from '../utils/storageUtils';",
  "import { uploadMediaToSupabase } from '../utils/storageUtils';\nimport { saveMessagesToDB, getMessagesFromDB, initDB } from '../database/sqlite';"
);

content = content.replace(
  "useEffect(() => {\n    const loadLocalData = async () => {",
  "useEffect(() => {\n    initDB();\n    const loadLocalData = async () => {"
);

const fetchRealMessagesRegex = /const fetchRealMessages = useCallback\(async \(contactId: string\) => \{\n    if \(!user\) return;\n    try \{/;
content = content.replace(
  fetchRealMessagesRegex,
  `const fetchRealMessages = useCallback(async (contactId: string) => {
    if (!user) return;
    try {
      const localMsgs = await getMessagesFromDB(contactId);
      if (localMsgs && localMsgs.length > 0) {
        setMessages(prev => ({ ...prev, [contactId]: localMsgs }));
      }`
);

const fetchRealMessagesSetStateRegex = /setMessages\(prev => \(\{\n\s*\.\.\.prev,\n\s*\[contactId\]: decryptedMsgs\n\s*\}\)\);\n\s*\}\n\s*\} catch \(e\) \{/;
content = content.replace(
  fetchRealMessagesSetStateRegex,
  `saveMessagesToDB(contactId, decryptedMsgs);
        setMessages(prev => ({
          ...prev,
          [contactId]: decryptedMsgs
        }));
      }
    } catch (e) {`
);

const sendMessageRegex = /storage\.set\('@chat_messages', JSON\.stringify\(updated\)\);\n\s*return updated;\n\s*\}\);\n\n\s*setActiveChats/;
content = content.replace(
  sendMessageRegex,
  `storage.set('@chat_messages', JSON.stringify(updated));
      return updated;
    });

    saveMessagesToDB(chatId, [newMessage]);

    setActiveChats`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched ChatContext.tsx');
