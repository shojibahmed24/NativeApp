const { Client } = require('pg');
require('dotenv').config({ path: '../server/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS freelancer_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  price NUMERIC(10, 2) DEFAULT 0.00,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE freelancer_tasks;
`;

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(createTableQuery);
    console.log('Successfully created freelancer_tasks table');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
