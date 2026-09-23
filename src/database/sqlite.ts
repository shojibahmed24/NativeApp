import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('unicom.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT,
        text TEXT,
        time TEXT,
        is_sender INTEGER,
        status TEXT,
        type TEXT,
        media_url TEXT,
        metadata TEXT,
        emoji INTEGER,
        timestamp INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_chat_id ON messages (chat_id);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON messages (timestamp DESC);
    `);
  }
  return db;
};

export const saveMessagesToDB = async (chatId: string, messages: any[]) => {
  const database = await initDB();
  
  await database.withTransactionAsync(async () => {
    for (const msg of messages) {
      const timestamp = new Date().getTime();
      await database.runAsync(
        `INSERT OR REPLACE INTO messages (id, chat_id, text, time, is_sender, status, type, media_url, metadata, emoji, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          msg.id, 
          chatId, 
          msg.text || '', 
          msg.time || '', 
          msg.isSender ? 1 : 0, 
          msg.status || 'delivered', 
          msg.type || 'text', 
          msg.mediaUrl || null, 
          msg.metadata ? JSON.stringify(msg.metadata) : null,
          msg.emoji ? 1 : 0,
          timestamp
        ]
      );
    }
  });
};

export const getMessagesFromDB = async (chatId: string, limit: number = 50, offset: number = 0) => {
  const database = await initDB();
  const rows = await database.getAllAsync(
    `SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    [chatId, limit, offset]
  );
  
  return rows.map((row: any) => ({
    id: row.id,
    text: row.text,
    time: row.time,
    isSender: row.is_sender === 1,
    status: row.status,
    type: row.type,
    mediaUrl: row.media_url,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    emoji: row.emoji === 1
  }));
};

export const clearMessagesDB = async () => {
  const database = await initDB();
  await database.execAsync('DELETE FROM messages;');
};
