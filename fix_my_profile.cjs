const fs = require('fs');
let file = 'app/(main)/my-profile.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ImageBackground')) {
    content = content.replace(/import \{ View, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Alert \} from 'react-native';/, "import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Alert, ImageBackground } from 'react-native';");
}

fs.writeFileSync(file, content);
console.log('Fixed ImageBackground import in my-profile.tsx');
