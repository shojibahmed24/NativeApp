const fs = require('fs');
let content = fs.readFileSync('app/(main)/call-info/[id].tsx', 'utf8');

if (!content.includes('supabase')) {
  content = content.replace("import { useAuth }", "import { supabase } from '../../../src/services/supabase';\nimport { api } from '../../../src/services/api';\nimport { useAuth }");
}

const oldEffect = /  useEffect\(\(\) => \{[\s\S]*?  \}, \[id, callHistory\]\);/;
const newEffect = `  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      try {
        // Fetch peer info
        const { data: user } = await supabase.from('users').select('*').eq('id', id).single();
        if (user) {
           setPeerInfo({
             id: user.id,
             name: user.name || 'Unknown',
             phone: user.phone_number || '',
             avatar: user.profile_picture || null
           });
        }
        
        // Fetch call history
        const res = await api.getCallHistory();
        if (res.success && res.calls) {
          const filtered = res.calls.filter(c => c.peer?.id === id);
          setPeerLogs(filtered);
        }
      } catch (err) {
        console.error('Error fetching call info:', err);
      }
    };
    
    loadData();
  }, [id]);`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('app/(main)/call-info/[id].tsx', content);
console.log('Fixed call-info fetch logic');
