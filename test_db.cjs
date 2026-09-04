const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kxkabnahclcsitfkllvg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a2FibmFoY2xjc2l0ZmtsbHZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIxMTYyOSwiZXhwIjoyMTAyNzg3NjI5fQ.sjenz4ljy_gIGLEBaBU1wzGHWB4CoozEK2dgYYNBTEI');

async function test() {
   const { data } = await supabase.from('users').select('id, name, profile_picture');
   console.log(data);
}
test();
