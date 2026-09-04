const fs = require('fs');
const file = 'src/context/CallContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Full Duplex: Audio cancellation disabled \(Microsoft Teams style\)[\s\S]*?nativeSoundRef\.current\.unloadAsync\(\)\.catch\(\(\)=>\{\}\);\s*nativeSoundRef\.current = null;\s*\}\s*setTranslationStatus\('interrupted'\);\s*setTimeout\(\(\) => setTranslationStatus\('ready'\), 2000\);\s*\}\);/s;

if (content.match(regex)) {
  content = content.replace(regex, '// Full Duplex: Audio cancellation disabled (Microsoft Teams style)');
  fs.writeFileSync(file, content);
  console.log('Fixed hanging syntax in CallContext');
} else {
  console.log('Regex 1 failed');
  // fallback regex
  const fbRegex = /\/\/ Full Duplex: Audio cancellation disabled \(Microsoft Teams style\)[\s\S]*?\}\);/s;
  if (content.match(fbRegex)) {
    content = content.replace(fbRegex, '// Full Duplex: Audio cancellation disabled (Microsoft Teams style)');
    fs.writeFileSync(file, content);
    console.log('Fixed hanging syntax with fallback');
  } else {
    console.log('Both regexes failed!');
  }
}
