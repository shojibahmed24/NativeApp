const fs = require('fs');
let file = 'app/(main)/profile/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('GradientBackground')) {
    console.log('No GradientBackground found?');
}

if (!content.includes('from \'../../../src/components/ThemeComponents\'')) {
    content = content.replace(/import { SafeAreaView } from 'react-native-safe-area-context';/, "import { SafeAreaView } from 'react-native-safe-area-context';\nimport { GradientBackground } from '../../../src/components/ThemeComponents';");
    fs.writeFileSync(file, content);
}
console.log('Fixed GradientBackground import');
