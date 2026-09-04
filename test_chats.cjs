const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kxkabnahclcsitfkllvg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a2FibmFoY2xjc2l0ZmtsbHZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIxMTYyOSwiZXhwIjoyMTAyNzg3NjI5fQ.sjenz4ljy_gIGLEBaBU1wzGHWB4CoozEK2dgYYNBTEI');

async function test() {
    // Current user (assuming it's SHOJIB 7daea47d... or New UNICOM User 638f479a...)
    // Let's just find the chat between Shafali and whoever.
    const { data: participants } = await supabase.from('chat_participants').select('*').eq('user_id', 'c38284e3-4c4f-4e02-9743-5916ae45308f');
    console.log("Shafali is in chats:", participants);
}
test();
