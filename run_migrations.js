const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: 'postgresql://postgres:JibOn%40786400@db.kxkabnahclcsitfkllvg.supabase.co:5432/postgres'
  });
  
  let connected = false;
  try {
    await client.connect();
    console.log('Connected via direct IPv6 host');
    connected = true;
  } catch (err) {
    console.log('Direct host failed, trying IPv4 pooler...', err.message);
  }

  if (!connected) {
    const client2 = new Client({
      connectionString: 'postgresql://postgres:JibOn%40786400@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
    });
    try {
      await client2.connect();
      console.log('Connected to Supabase via IPv4 Pooler');
      Object.assign(client, client2);
    } catch (e2) {
      console.log('Also failed IPv4 pooler:', e2.message);
      return;
    }
  }

  try {
    // 1. Create messages table
    console.log('Creating messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        chat_id TEXT NOT NULL,
        sender_id UUID,
        text TEXT,
        type TEXT DEFAULT 'text',
        media_url TEXT,
        file_name TEXT,
        metadata JSONB,
        reply_to_id TEXT,
        scheduled_for TIMESTAMP WITH TIME ZONE,
        emoji BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('messages table ready.');

    // 2. Add any missing columns
    const columns = [
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT;",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS emoji BOOLEAN DEFAULT FALSE;"
    ];
    for (let col of columns) {
      await client.query(col);
    }
    console.log('Missing columns added (if any).');

    // 3. Storage bucket
    console.log('Creating chat-media bucket if not exists...');
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('chat-media', 'chat-media', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log('Storage bucket ready.');

    // 4. RLS for messages
    await client.query(`
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow all access to messages" ON messages;
      CREATE POLICY "Allow all access to messages" ON messages FOR ALL USING (true);
    `);

    // 5. RLS for storage
    await client.query(`
      DROP POLICY IF EXISTS "Allow public access to chat-media" ON storage.objects;
      CREATE POLICY "Allow public access to chat-media" ON storage.objects 
      FOR ALL USING (bucket_id = 'chat-media');
      
      DROP POLICY IF EXISTS "Allow public insert to chat-media" ON storage.objects;
      CREATE POLICY "Allow public insert to chat-media" ON storage.objects 
      FOR INSERT WITH CHECK (bucket_id = 'chat-media');
      
      DROP POLICY IF EXISTS "Allow public update to chat-media" ON storage.objects;
      CREATE POLICY "Allow public update to chat-media" ON storage.objects 
      FOR UPDATE USING (bucket_id = 'chat-media');
    `);
    console.log('RLS policies ready.');

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.end();
  }
}

migrate();
