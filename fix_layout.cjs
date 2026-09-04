const fs = require('fs');
let file = 'app/(main)/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('CheckSquare')) {
    content = content.replace(/import \{ Phone, MessageSquare, Users, ShieldBan, Grip, User \} from 'lucide-react-native';/, "import { Phone, MessageSquare, Users, ShieldBan, Grip, User, CheckSquare } from 'lucide-react-native';");
    fs.writeFileSync(file, content);
    console.log('Added CheckSquare to layout imports');
}
