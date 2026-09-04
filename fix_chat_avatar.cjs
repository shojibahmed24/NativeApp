const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Avatar with standard Image
const oldAvatar = `<Avatar circular size="$4" style={{ borderWidth: 2, borderColor: '#fff' }}>
                {recipient?.profile_picture && <Avatar.Image src={recipient.profile_picture} />}
                <Avatar.Fallback backgroundColor="#e6e6e6" alignItems="center" justifyContent="center">
                  <Text color="#666" fontSize="$3" fontWeight="bold">{recipient?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                </Avatar.Fallback>
              </Avatar>`;

const newAvatar = `{(recipient?.profile_picture || recipient?.avatar) ? (
                <Image source={{ uri: (recipient?.profile_picture || recipient?.avatar) }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' }} />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff', backgroundColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center' }}>
                  <Text color="#666" fontSize="$3" fontWeight="bold">{recipient?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}`;

content = content.replace(oldAvatar, newAvatar);

fs.writeFileSync(file, content);
console.log('Fixed chat header avatar');
