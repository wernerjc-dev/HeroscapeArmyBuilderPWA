import * as SQLite from 'expo-sqlite';
import { Army, ArmyCardEntry } from '@/types/army';

const DB_NAME = 'armies.db';

let db: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS armies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pointTotal INTEGER NOT NULL,
      contemporaryOnly INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS army_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      armyId TEXT NOT NULL,
      cardId TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (armyId) REFERENCES armies(id) ON DELETE CASCADE
    );
  `);
  return db;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function getArmies(): Promise<Army[]> {
  try {
    const database = await getDatabase();
    
    const armyRows = await database.getAllAsync<{
      id: string;
      name: string;
      pointTotal: number;
      contemporaryOnly: number;
      createdAt: string;
      updatedAt: string;
    }>('SELECT * FROM armies ORDER BY createdAt DESC');
    
    const armies: Army[] = [];
    
    for (const row of armyRows) {
      const cardRows = await database.getAllAsync<{
        cardId: string;
        quantity: number;
      }>('SELECT cardId, quantity FROM army_cards WHERE armyId = ?', [row.id]);
      
      armies.push({
        id: row.id,
        name: row.name,
        pointTotal: row.pointTotal,
        contemporaryOnly: row.contemporaryOnly === 1,
        cards: cardRows.map(c => ({ cardId: c.cardId, quantity: c.quantity })),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }
    
    return armies;
  } catch (error) {
    console.error('Error loading armies:', error);
    return [];
  }
}

export async function saveArmies(armies: Army[]): Promise<void> {
  const database = await getDatabase();
  
  await database.execAsync('DELETE FROM army_cards');
  await database.execAsync('DELETE FROM armies');
  
  for (const army of armies) {
    await database.runAsync(
      'INSERT INTO armies (id, name, pointTotal, contemporaryOnly, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [army.id, army.name, army.pointTotal, army.contemporaryOnly ? 1 : 0, army.createdAt, army.updatedAt]
    );
    
    for (const card of army.cards) {
      await database.runAsync(
        'INSERT INTO army_cards (armyId, cardId, quantity) VALUES (?, ?, ?)',
        [army.id, card.cardId, card.quantity]
      );
    }
  }
}

export async function createArmy(
  name: string = 'New Army',
  pointTotal: number = 500,
  contemporaryOnly: boolean = true
): Promise<Army> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  
  const army: Army = {
    id: generateId(),
    name,
    pointTotal,
    contemporaryOnly,
    cards: [],
    createdAt: now,
    updatedAt: now,
  };
  
  await database.runAsync(
    'INSERT INTO armies (id, name, pointTotal, contemporaryOnly, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [army.id, army.name, army.pointTotal, contemporaryOnly ? 1 : 0, army.createdAt, army.updatedAt]
  );
  
  return army;
}

export async function updateArmy(army: Army): Promise<Army> {
  const database = await getDatabase();
  
  const now = new Date().toISOString();
  army.updatedAt = now;
  
  await database.runAsync(
    'UPDATE armies SET name = ?, pointTotal = ?, contemporaryOnly = ?, updatedAt = ? WHERE id = ?',
    [army.name, army.pointTotal, army.contemporaryOnly ? 1 : 0, army.updatedAt, army.id]
  );
  
  return army;
}

export async function deleteArmy(armyId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM army_cards WHERE armyId = ?', [armyId]);
  await database.runAsync('DELETE FROM armies WHERE id = ?', [armyId]);
}

export async function addCardToArmy(armyId: string, cardId: string, quantity: number = 1): Promise<Army> {
  const database = await getDatabase();
  
  const existing = await database.getFirstAsync<{ id: number; quantity: number }>(
    'SELECT id, quantity FROM army_cards WHERE armyId = ? AND cardId = ?',
    [armyId, cardId]
  );
  
  if (existing) {
    await database.runAsync(
      'UPDATE army_cards SET quantity = quantity + ? WHERE id = ?',
      [quantity, existing.id]
    );
  } else {
    await database.runAsync(
      'INSERT INTO army_cards (armyId, cardId, quantity) VALUES (?, ?, ?)',
      [armyId, cardId, quantity]
    );
  }
  
  const armies = await getArmies();
  const army = armies.find(a => a.id === armyId);
  if (!army) throw new Error('Army not found');
  
  return army;
}

export async function removeCardFromArmy(armyId: string, cardId: string): Promise<Army> {
  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM army_cards WHERE armyId = ? AND cardId = ?',
    [armyId, cardId]
  );
  
  const armies = await getArmies();
  const army = armies.find(a => a.id === armyId);
  if (!army) throw new Error('Army not found');
  
  return army;
}

export async function updateCardQuantity(armyId: string, cardId: string, quantity: number): Promise<Army> {
  const database = await getDatabase();
  
  if (quantity <= 0) {
    await database.runAsync(
      'DELETE FROM army_cards WHERE armyId = ? AND cardId = ?',
      [armyId, cardId]
    );
  } else {
    await database.runAsync(
      'UPDATE army_cards SET quantity = ? WHERE armyId = ? AND cardId = ?',
      [quantity, armyId, cardId]
    );
  }
  
  const armies = await getArmies();
  const army = armies.find(a => a.id === armyId);
  if (!army) throw new Error('Army not found');
  
  return army;
}
