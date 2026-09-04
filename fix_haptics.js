const fs = require('fs');
let code = fs.readFileSync('./app/chat/[id].tsx', 'utf-8');
code = code.replace(/Haptics\.selectionAsync\(\)/g, 'Platform.OS !== \'web\' && Haptics.selectionAsync()');
code = code.replace(/Haptics\.impactAsync\((.*?)\)/g, 'Platform.OS !== \'web\' && Haptics.impactAsync()');
code = code.replace(/Haptics\.notificationAsync\((.*?)\)/g, 'Platform.OS !== \'web\' && Haptics.notificationAsync()');
fs.writeFileSync('./app/chat/[id].tsx', code);
console.log('Fixed');
