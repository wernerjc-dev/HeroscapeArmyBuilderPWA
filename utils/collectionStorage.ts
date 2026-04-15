import * as SQLite from 'expo-sqlite';
import { Collection } from '@/types/army';

const DB_NAME = 'collection.db';

let db: SQLite.SQLiteDatabase | null = null;

let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const database = await SQLite.openDatabaseAsync(DB_NAME);
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS collection (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          updatedAt TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS collection_cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cardId TEXT NOT NULL UNIQUE,
          quantity INTEGER NOT NULL DEFAULT 1
        );
      `);
      
      const existing = await database.getFirstAsync<{ id: number }>('SELECT id FROM collection WHERE id = 1');
      if (!existing) {
        await database.runAsync('INSERT INTO collection (id, updatedAt) VALUES (1, datetime("now"))');
      }
      
      db = database;
      return database;
    })();
  }
  
  return dbInitPromise;
}

export async function getCollection(): Promise<Collection> {
  const database = await getDatabase();
  
  const collectionRows = await database.getFirstAsync<{ updatedAt: string }>('SELECT updatedAt FROM collection WHERE id = 1');
  const cardRows = await database.getAllAsync<{ cardId: string; quantity: number }>('SELECT cardId, quantity FROM collection_cards');
  
  return {
    cards: cardRows.map(c => ({ cardId: c.cardId, quantity: c.quantity })),
    updatedAt: collectionRows?.updatedAt || new Date().toISOString(),
  };
}

export async function saveCollection(collection: Collection): Promise<void> {
  const database = await getDatabase();
  
  await database.execAsync('DELETE FROM collection_cards');
  
  for (const card of collection.cards) {
    await database.runAsync(
      'INSERT OR REPLACE INTO collection_cards (cardId, quantity) VALUES (?, ?)',
      [card.cardId, card.quantity]
    );
  }
  
  await database.runAsync(
    'UPDATE collection SET updatedAt = ? WHERE id = 1',
    [collection.updatedAt]
  );
}

export async function addCardToCollection(cardId: string, quantity: number = 1): Promise<Collection> {
  const database = await getDatabase();
  
  const existingRows = await database.getAllAsync<{ id: number; quantity: number }>(
    'SELECT id, quantity FROM collection_cards WHERE cardId = ?',
    [cardId]
  );
  
  if (existingRows && existingRows.length > 0) {
    const row = existingRows[0];
    await database.runAsync(
      'UPDATE collection_cards SET quantity = quantity + ? WHERE id = ?',
      [quantity, row.id]
    );
  } else {
    await database.runAsync(
      'INSERT INTO collection_cards (cardId, quantity) VALUES (?, ?)',
      [cardId, quantity]
    );
  }
  
  await database.runAsync(
    "UPDATE collection SET updatedAt = datetime('now') WHERE id = 1"
  );
  
  return getCollection();
}

export async function removeCardFromCollection(cardId: string): Promise<Collection> {
  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM collection_cards WHERE cardId = ?',
    [cardId]
  );
  
  await database.runAsync(
    "UPDATE collection SET updatedAt = datetime('now') WHERE id = 1"
  );
  
  return getCollection();
}

export async function updateCardQuantityInCollection(cardId: string, quantity: number): Promise<Collection> {
  const database = await getDatabase();
  
  if (quantity <= 0) {
    await database.runAsync(
      'DELETE FROM collection_cards WHERE cardId = ?',
      [cardId]
    );
  } else {
    await database.runAsync(
      'UPDATE collection_cards SET quantity = ? WHERE cardId = ?',
      [quantity, cardId]
    );
  }
  
  await database.runAsync(
    "UPDATE collection SET updatedAt = datetime('now') WHERE id = 1"
  );
  
  return getCollection();
}

export async function getCollectionCardQuantity(cardId: string): Promise<number> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ quantity: number }>(
    'SELECT quantity FROM collection_cards WHERE cardId = ?',
    [cardId]
  );
  return rows[0]?.quantity || 0;
}