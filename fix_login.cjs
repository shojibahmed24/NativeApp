const fs = require('fs');
let file = 'app/(auth)/login.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<Image 
            source={require('../../assets/images/logo-full-transparent.png')} 
            style={{ width: 220, height: 50 }} 
            resizeMode="contain" 
          />`;

content = content.replace(target, '');
fs.writeFileSync(file, content);
console.log('Removed bottom logo from login');
