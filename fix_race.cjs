const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const oldEffect = `useEffect(() => {
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

const newEffect = `useEffect(() => {
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
      
      // Fallback
      api.request(\`/users/\${id}/public-profile\`).then(res => {
         if (isSubscribed && res && res.user) setRecipient(res.user);
      }).catch(e => console.warn(e));
      
      return () => { isSubscribed = false; };
    }, [id, activeChats]);`;

content = content.replace(oldEffect, newEffect);

// Wait, I should also ensure that the Image source uri handles undefined properly
// No, React Native Image doesn't crash on undefined, but just to be safe:
content = content.replace(/uri: \(recipient\?\.profile_picture \|\| recipient\?\.avatar\)/g, "uri: (recipient?.profile_picture || recipient?.avatar || '')");

fs.writeFileSync(file, content);
console.log('Fixed race condition in chat/[id].tsx');
