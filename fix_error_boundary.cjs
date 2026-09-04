const fs = require('fs');
let file = 'app/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure RN components are imported for ErrorBoundary
if (!content.includes('import { Platform, useColorScheme, Text, View as RNView, Text as RNText } from \'react-native\'')) {
    content = content.replace(/import \{ Platform, useColorScheme, Text \} from 'react-native';/, "import { Platform, useColorScheme, Text, View as RNView, Text as RNText } from 'react-native';");
}

// Replace View and Text in ErrorBoundary with RNView and RNText
content = content.replace(/<View style=\{\{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 \}\}>/, "<RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>");
content = content.replace(/<\/View>\s*\);\s*\}\s*return this\.props\.children;/, "</RNView>\n      );\n    }\n    return this.props.children;");
content = content.replace(/<Text style=\{\{ color: 'red', fontSize: 18, marginBottom: 10 \}\}>App Crashed<\/Text>/, "<RNText style={{ color: 'red', fontSize: 18, marginBottom: 10 }}>App Crashed</RNText>");
content = content.replace(/<Text>\{this\.state\.error\?\.message\}<\/Text>/, "<RNText>{this.state.error?.message}</RNText>");

fs.writeFileSync(file, content);
console.log('Fixed ErrorBoundary in layout');
