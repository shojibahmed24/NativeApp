import { Platform } from 'react-native';

// Simple IndexedDB wrapper for caching messages and conversations
const DB_NAME = 'UnicomDB';
const DB_VERSION = 2;
const STORE_MESSAGES = 'messages';
const STORE_CONVERSATIONS = 'conversations';

const openDb = () => {
  if (Platform.OS !== 'web') return Promise.reject('IndexedDB not supported');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        db.createObjectStore(STORE_MESSAGES, { keyPath: 'contactId' });
      }
      if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
        db.createObjectStore(STORE_CONVERSATIONS, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const cacheMessages = async (contactId, messages) => {
  if (Platform.OS !== 'web') return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_MESSAGES, 'readwrite');
    const store = tx.objectStore(STORE_MESSAGES);
    store.put({ contactId, messages, timestamp: Date.now() });
  } catch (err) {
    console.error('IDB Cache Error:', err);
  }
};

export const getCachedMessages = async (contactId) => {
  if (Platform.OS !== 'web') return [];
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const store = tx.objectStore(STORE_MESSAGES);
      const request = store.get(contactId);
      request.onsuccess = () => resolve(request.result ? request.result.messages : []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IDB Get Error:', err);
    return [];
  }
};

export const cacheConversations = async (conversations) => {
  if (Platform.OS !== 'web') return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_CONVERSATIONS, 'readwrite');
    const store = tx.objectStore(STORE_CONVERSATIONS);
    store.put({ id: 'all', conversations, timestamp: Date.now() });
  } catch (err) {
    console.error('IDB Cache Conv Error:', err);
  }
};

export const getCachedConversations = async () => {
  if (Platform.OS !== 'web') return [];
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CONVERSATIONS, 'readonly');
      const store = tx.objectStore(STORE_CONVERSATIONS);
      const request = store.get('all');
      request.onsuccess = () => resolve(request.result ? request.result.conversations : []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IDB Get Conv Error:', err);
    return [];
  }
};
