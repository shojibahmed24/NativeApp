const fs = require('fs');

function checkFile(file) {
  if (fs.existsSync(file)) {
    console.log(`\n--- ${file} ---`);
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('translationEngine')) console.log('Contains translationEngine');
    if (content.includes('call:audio')) console.log('Contains call:audio');
    if (content.includes('playTranslatedVoice')) console.log('Contains playTranslatedVoice');
  }
}

checkFile('src/context/CallContext.tsx');
checkFile('app/call/[id].tsx');
checkFile('../server/src/socket/socketHandler.js');
checkFile('../server/src/services/translationEngine.js');
