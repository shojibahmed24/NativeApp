const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({path: '../server/.env'});
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function checkTable() {
    const { data, error } = await supabase.from('messages').select('*').limit(1);
    if(data && data.length > 0) {
        console.log(Object.keys(data[0]));
    } else {
        console.log('No messages found to infer schema, but no error:', error);
    }
}
checkTable();
