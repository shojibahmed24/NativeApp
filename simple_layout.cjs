const fs = require('fs');
const file = 'app/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const backup = 'app/_layout.tsx.bak';
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, content);
}

const simpleLayout = `
import { Text, View } from 'react-native';
export default function Layout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hello Native App</Text>
    </View>
  );
}
`;

fs.writeFileSync(file, simpleLayout);
console.log('Set simple layout');
