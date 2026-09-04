const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kxkabnahclcsitfkllvg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIxMTYyOSwiZXhwIjoyMTAyNzg3NjI5fQ.sjenz4ljy_gIGLEBaBU1wzGHWB4CoozEK2dgYYNBTEI');

async function test() {
    const { data: participants } = await supabase.from('chat_participants').select('*').eq('chat_id', 'd53bba8c-0511-4150-8af0-465d719ae120');
    console.log("Participants in chat:", participants);
}
test();
