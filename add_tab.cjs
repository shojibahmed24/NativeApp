const fs = require('fs');
let file = 'app/(main)/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<Tabs.Screen
        name="my-profile"`;

const newTab = `<Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={{
                position: 'absolute',
                top: -10,
                width: 40,
                height: 40,
                backgroundColor: focused ? 'rgba(0, 94, 184, 0.1)' : 'transparent',
                borderRadius: 20,
              }} />
              <CheckSquare color={color} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="my-profile"`;

if (content.includes(target) && !content.includes('name="tasks"')) {
    content = content.replace(target, newTab);
    
    // add CheckSquare import if missing
    if (!content.includes('CheckSquare')) {
        content = content.replace(/import { Phone, MessageSquare, Grip, Users, User, ShieldAlert } from 'lucide-react-native';/, "import { Phone, MessageSquare, Grip, Users, User, ShieldAlert, CheckSquare } from 'lucide-react-native';");
    }
    
    fs.writeFileSync(file, content);
    console.log('Added Tasks tab');
}
