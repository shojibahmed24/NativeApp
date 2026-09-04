const fs = require('fs');
const file = 'app/(main)/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<Tabs\.Screen\s+name="contacts"[\s\S]*?\/>\s*<CheckSquare color=\{color\} size=\{24\} \/>\s*<\/View>\s*\),\s*\}\}\s*\/>/;
const replacement = `<Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, focused }) => (
            <View backgroundColor={focused ? 'rgba(0,94,184,0.1)' : 'transparent'} padding={6} borderRadius={16} minWidth={48} alignItems="center">
              <Users color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed _layout.tsx syntax error');
