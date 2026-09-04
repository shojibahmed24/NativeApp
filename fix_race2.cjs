const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `useEffect(() => {
    // Find recipient from activeChats
    if (activeChats && activeChats.length > 0) {
      const chat = activeChats.find(c => c.contact && String(c.contact.id) === String(id));
      if (chat && chat.contact) {
        setRecipient({
          ...chat.contact,
          profile_picture: chat.contact.avatar,
          phone_number: chat.contact.phone
        });
      }
    } else {
      // Fallback API call if not in activeChats
      api.request(\`/users/\${id}/public-profile\`).then(res => {
         if (res && res.user) setRecipient(res.user);
      }).catch(e => console.warn(e));
    }
  }, [id, activeChats]);`;

const replacement = `useEffect(() => {
    let isSubscribed = true;
    if (activeChats && activeChats.length > 0) {
      const chat = activeChats.find(c => c.contact && String(c.contact.id) === String(id));
      if (chat && chat.contact) {
        if (isSubscribed) {
          setRecipient({
            ...chat.contact,
            profile_picture: chat.contact.avatar,
            phone_number: chat.contact.phone
          });
        }
        return;
      }
    }
    
    // Fallback API call if not in activeChats
    api.request(\`/users/\${id}/public-profile\`).then(res => {
       if (isSubscribed && res && res.user) setRecipient(res.user);
    }).catch(e => console.warn(e));

    return () => { isSubscribed = false; };
  }, [id, activeChats]);`;

// handle \r\n differences
const safeTarget = target.replace(/\r\n/g, '\n');
content = content.replace(/\r\n/g, '\n');

if (content.includes(safeTarget)) {
    content = content.replace(safeTarget, replacement);
    fs.writeFileSync(file, content);
    console.log('Successfully replaced');
} else {
    console.log('Failed to find target block');
}
